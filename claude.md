/# SE4458 Final Project — Hotel Booking System
## Project Overview

A Hotels.com-like hotel booking system built as a microservices architecture. The system includes hotel administration, search, booking, comments, notifications, and an AI agent chat interface.

**Solo developer project.**

---

## Tech Stack

### Backend
- **Language/Framework:** Java 17 + Spring Boot 3.x
- **Build Tool:** Maven
- **Auth:** AWS Cognito (JWT-based, no custom auth implementation)
- **Primary DB:** AWS RDS (PostgreSQL)
- **Cache:** AWS ElastiCache (Redis) — for hotel details
- **NoSQL DB:** MongoDB Atlas (for comments)
- **Queue:** AWS SQS
- **Scheduler:** AWS EventBridge Scheduler (nightly tasks)
- **File Storage:** AWS S3 (optional room images)
- **Deployment:** AWS App Runner (per-service)
- **API Gateway:** Spring Cloud Gateway (self-hosted, deployed separately on App Runner)

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Deployment:** AWS S3 + CloudFront (static hosting)

### AI Agent
- **Language/Framework:** Node.js 20 + TypeScript + Express
- **SDK:** `@anthropic-ai/sdk` (official)
- **API:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Pattern:** Tool-calling agent that calls internal Hotel/Booking REST APIs
- **Deployment:** AWS App Runner

---

## Architecture Overview

```
[React Frontend (S3/CloudFront)]
           |
    [API Gateway - Spring Cloud Gateway (App Runner)]
           |
  ┌────────┼──────────────────────────────────┐
  │        │                │                  │
[Hotel Service]  [Comments Service]  [Notification Service]  [AI Agent Service]
[Spring Boot]    [Spring Boot]        [Spring Boot]           [Node.js/TS]
[App Runner]     [App Runner]         [App Runner]            [App Runner]
  │        │                                    │
[RDS/PG] [ElastiCache Redis]          [Anthropic Claude API]
           │                          [calls Hotel Service internally]
         [SQS Queue] ──► [Notification Service]
           │
      [MongoDB Atlas] (Comments)
           │
      [AWS Cognito] (Auth/IAM)
           │
        [S3] (Images)
           │
  [EventBridge Scheduler] ──► [Notification Service]
```

All clients (Admin, User) authenticate via **AWS Cognito**. The API Gateway validates JWT tokens before routing to downstream services.

---

## Microservices

### 1. Hotel Service (`hotel-service`)
Handles hotel admin management, room availability, hotel search, and bookings.

**Port:** 8080 (local), deployed on App Runner

**Responsibilities:**
- Hotel CRUD (admin only)
- Room management with date-range availability
- Hotel search by destination, dates, guest count
- Booking creation (decrements room capacity)
- Cache hotel details in Redis
- Push new reservations to SQS queue
- Expose AI Agent-friendly search/book endpoints

**Key Endpoints (all under `/api/v1`):**

```
# Admin (requires ADMIN role JWT)
POST   /admin/hotels                         – create hotel
PUT    /admin/hotels/{hotelId}               – update hotel
POST   /admin/hotels/{hotelId}/rooms         – add/update room availability
PUT    /admin/hotels/{hotelId}/rooms/{roomId} – update room

# Search (public or authenticated)
GET    /hotels/search?destination=&checkIn=&checkOut=&guests=&page=&size=
       → returns available rooms; if JWT present, apply 15% discount

# Hotel Detail
GET    /hotels/{hotelId}                     – hotel detail (cached in Redis)

# Booking (requires USER role JWT)
POST   /bookings                             – create booking
GET    /bookings/{bookingId}                 – get booking detail
GET    /bookings/my                          – list user's bookings

```

**Data Models:**

```sql
-- hotels
id, name, destination, address, latitude, longitude, star_rating,
amenities (text/json), description, image_url, admin_email, created_at

-- rooms
id, hotel_id (FK), room_type (ENUM: STANDARD, FAMILY, SUITE, DELUXE),
room_number, capacity, price_per_night, status (VACANT/OCCUPIED),
available_from, available_to, created_at, updated_at

-- bookings
id, hotel_id (FK), room_id (FK), user_id (Cognito sub),
check_in, check_out, guest_count, total_price,
status (CONFIRMED/CANCELLED), created_at
```

**Redis Caching:**
- Cache key: `hotel:{hotelId}` — TTL 30 minutes
- Invalidate on hotel update
- Use Spring Cache (`@Cacheable`, `@CacheEvict`) with Redis as backing store

**SQS Integration:**
- On successful booking → publish message to SQS queue `hotel-new-reservations`
- Message payload: `{ bookingId, hotelId, userId, checkIn, checkOut, hotelAdminEmail }`

**Business Rules:**
- Only `VACANT` rooms within the requested date range are returned in search
- On booking: set room status to `OCCUPIED` for those dates (or decrement capacity counter)
- Logged-in users (valid JWT) get 15% discount applied to `price_per_night`
- Use **pessimistic locking** on room update to prevent double-booking
- All list endpoints support pagination (`page`, `size` query params)

---

### 2. Comments Service (`comments-service`)
Handles hotel reviews and rating distributions.

**Port:** 8081 (local), deployed on App Runner

**DB:** MongoDB Atlas (collection: `comments`)

**Key Endpoints:**

```
POST   /api/v1/comments                      – submit comment (requires JWT)
GET    /api/v1/comments/hotel/{hotelId}?page=&size=   – list comments with pagination
GET    /api/v1/comments/hotel/{hotelId}/stats         – rating distribution per category
```

**MongoDB Document Schema:**
```json
{
  "_id": "ObjectId",
  "hotelId": "string",
  "userId": "string (Cognito sub)",
  "userName": "string",
  "overallRating": 8.6,
  "categoryRatings": {
    "cleanliness": 9.6,
    "staffAndService": 9.6,
    "facilitiesAndAmenities": 9.4,
    "locationAndAccessibility": 9.6,
    "ecoFriendliness": 9.4
  },
  "comment": "string",
  "stayDuration": "4 nights",
  "createdAt": "ISODate"
}
```

**Stats endpoint** returns per-category averages + comment count for the rating distribution graph on the UI.

---

### 3. Notification Service (`notification-service`)
Handles scheduled nightly tasks and queue consumption.

**Port:** 8082 (local), deployed on App Runner

**Triggered by:**
- AWS EventBridge Scheduler → nightly CRON job (e.g., `cron(0 2 * * ? *)`)
- SQS queue polling (Spring `@SqsListener`)

**Nightly Scheduled Task (EventBridge → HTTP POST `/api/v1/notifications/nightly`):**
1. Query Hotel Service for all hotels
2. For each hotel: check room capacity for the **next 30 days**
3. If available capacity < 20% → send email/notification to hotel admin

**SQS Consumer (runs continuously, independent of nightly job):**
- Listens to `hotel-new-reservations` queue via `@SqsListener`
- On each new message: sends reservation confirmation to the user

```java
@SqsListener("hotel-new-reservations")
public void handleNewReservation(ReservationMessage message) {
    // send confirmation to user
}
```

**Endpoints:**
```
POST   /api/v1/notifications/nightly         – trigger nightly job (called by EventBridge)
GET    /api/v1/notifications/health          – health check
```

**Notification delivery:** Use Spring Mail (AWS SES or simple SMTP) or just log to console — document your assumption.

---

### 4. AI Agent Service (`ai-agent-service`)
A standalone Node.js/TypeScript microservice that powers the chat window. Uses the official `@anthropic-ai/sdk` with tool-calling to orchestrate hotel search and booking via internal APIs.

**Port:** 3000 (local), deployed on App Runner

**Tech:** Node.js 20, TypeScript, Express, `@anthropic-ai/sdk`, `axios`

**Endpoint:**
```
POST /api/v1/ai/chat
Body: { "message": "string", "conversationHistory": [...], "userToken": "string" }
Response: { "reply": "string", "toolsUsed": [...] }
```

**Project Structure:**
```
ai-agent-service/
├── src/
│   ├── index.ts               – Express app entry point
│   ├── routes/
│   │   └── chat.route.ts      – POST /api/v1/ai/chat
│   ├── agent/
│   │   ├── agent.ts           – core agentic loop (tool-calling)
│   │   ├── tools.ts           – tool definitions for Claude
│   │   └── toolExecutor.ts    – calls Hotel Service REST APIs
│   └── config.ts              – env vars
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Tool Definitions (`tools.ts`):**
```typescript
import Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "searchHotels",
    description: "Search available hotels by destination, check-in/out dates, and guest count",
    input_schema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "City or region name" },
        checkIn:     { type: "string", description: "Check-in date (YYYY-MM-DD)" },
        checkOut:    { type: "string", description: "Check-out date (YYYY-MM-DD)" },
        guests:      { type: "integer", description: "Number of guests" }
      },
      required: ["destination", "checkIn", "checkOut", "guests"]
    }
  },
  {
    name: "bookHotel",
    description: "Book a specific hotel room for the authenticated user",
    input_schema: {
      type: "object",
      properties: {
        hotelId:    { type: "string" },
        roomId:     { type: "string" },
        checkIn:    { type: "string", description: "YYYY-MM-DD" },
        checkOut:   { type: "string", description: "YYYY-MM-DD" },
        guestCount: { type: "integer" }
      },
      required: ["hotelId", "roomId", "checkIn", "checkOut", "guestCount"]
    }
  }
];
```

**Agentic Loop (`agent.ts`):**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import { tools } from "./tools";
import { executeTool } from "./toolExecutor";

const client = new Anthropic();

export async function runAgent(
  userMessage: string,
  conversationHistory: Anthropic.MessageParam[],
  userToken: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: "You are a helpful hotel booking assistant. Use the provided tools to search and book hotels for the user. Always confirm details before booking.",
      tools,
      messages
    });

    // If no tool use, return final text response
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find(b => b.type === "text");
      return textBlock ? (textBlock as Anthropic.TextBlock).text : "";
    }

    // Process tool calls
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await executeTool(block.name, block.input as Record<string, unknown>, userToken);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result)
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }
}
```

**Tool Executor (`toolExecutor.ts`):**
```typescript
import axios from "axios";

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL!;

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userToken: string
): Promise<unknown> {
  const headers = { Authorization: `Bearer ${userToken}` };

  switch (toolName) {
    case "searchHotels":
      const { data } = await axios.get(`${HOTEL_SERVICE_URL}/api/v1/hotels/search`, {
        params: input, headers
      });
      return data;

    case "bookHotel":
      const { data: booking } = await axios.post(
        `${HOTEL_SERVICE_URL}/api/v1/bookings`,
        input, { headers }
      );
      return booking;

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

**Environment Variables:**
```
PORT=3000
ANTHROPIC_API_KEY=
HOTEL_SERVICE_URL=
AWS_COGNITO_ISSUER_URI=
AWS_REGION=
```

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**package.json dependencies:**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "axios": "^1.7.0",
    "express": "^4.18.0",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/swagger-ui-express": "^4.1.0",
    "@types/swagger-jsdoc": "^6.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

### 5. API Gateway (`api-gateway`)
Spring Cloud Gateway deployed on App Runner.

**Responsibilities:**
- Route requests to appropriate microservices
- Validate AWS Cognito JWT tokens
- Rate limiting (optional)

**Route config (application.yml):**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: hotel-service
          uri: ${HOTEL_SERVICE_URL}
          predicates:
            - Path=/api/v1/hotels/**, /api/v1/bookings/**, /api/v1/admin/**
        - id: ai-agent-service
          uri: ${AI_AGENT_SERVICE_URL}
          predicates:
            - Path=/api/v1/ai/**
        - id: comments-service
          uri: ${COMMENTS_SERVICE_URL}
          predicates:
            - Path=/api/v1/comments/**
        - id: notification-service
          uri: ${NOTIFICATION_SERVICE_URL}
          predicates:
            - Path=/api/v1/notifications/**
```

---

## Frontend (React + Vite + TypeScript)

**Pages / Views:**
1. **Home / Search Page** — destination input, date pickers, guest count → search results
2. **Search Results Page** — hotel cards with pricing (15% discount badge if logged in), "Haritada Göster" map view
3. **Hotel Detail Page** — hotel info, room list, "Book" button, comments section with rating distribution chart
4. **Admin Panel** — add/update hotel, manage room availability (authenticated)
5. **AI Agent Chat** — floating chat window on main screen, calls `/api/v1/ai/chat`
6. **Login / Register** — via AWS Cognito Hosted UI or Amplify Auth

**Map Integration:** Use Leaflet.js or Google Maps to show searched hotels ("Haritada Göster")

**Auth:** AWS Amplify (`aws-amplify`) for Cognito integration — store JWT in memory/localStorage, attach as `Authorization: Bearer <token>` header

**Key Components:**
- `HotelCard` — shows hotel info + discounted price if logged in
- `RoomAvailabilityForm` (Admin) — date range + room type + status
- `CommentStats` — bar chart (Recharts) showing per-category ratings
- `AIChatWindow` — floating chat bubble, message history, loading states

---

## Project Structure

```
hotel-booking-system/
├── hotel-service/
│   ├── src/main/java/com/se4458/hotelservice/
│   │   ├── controller/         (HotelController, BookingController, AdminController)
│   │   ├── service/            (HotelService, BookingService, SearchService, CacheService)
│   │   ├── repository/         (HotelRepository, RoomRepository, BookingRepository)
│   │   ├── model/              (Hotel, Room, Booking enums)
│   │   ├── dto/                (request/response DTOs)
│   │   ├── config/             (RedisConfig, SecurityConfig, SqsConfig)
│   │   └── HotelServiceApplication.java
│   ├── Dockerfile
│   └── pom.xml
│
├── comments-service/
│   ├── src/main/java/com/se4458/commentsservice/
│   │   ├── controller/         (CommentController)
│   │   ├── service/            (CommentService)
│   │   ├── repository/         (CommentRepository - MongoRepository)
│   │   ├── document/           (Comment)
│   │   └── CommentsServiceApplication.java
│   ├── Dockerfile
│   └── pom.xml
│
├── notification-service/
│   ├── src/main/java/com/se4458/notificationservice/
│   │   ├── controller/         (NotificationController)
│   │   ├── service/            (NotificationService, CapacityCheckService)
│   │   ├── listener/           (ReservationQueueListener)
│   │   └── NotificationServiceApplication.java
│   ├── Dockerfile
│   └── pom.xml
│
├── ai-agent-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/             (chat.route.ts)
│   │   ├── agent/              (agent.ts, tools.ts, toolExecutor.ts)
│   │   └── config.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── api-gateway/
│   ├── src/main/java/com/se4458/gateway/
│   │   ├── config/             (GatewayConfig, CognitoJwtFilter)
│   │   └── GatewayApplication.java
│   ├── Dockerfile
│   └── pom.xml
│
└── frontend/
    ├── src/
    │   ├── pages/              (Home, SearchResults, HotelDetail, AdminPanel, Login)
    │   ├── components/         (HotelCard, RoomForm, CommentStats, AIChatWindow, MapView)
    │   ├── services/           (api.ts, auth.ts)
    │   └── App.tsx
    ├── Dockerfile
    └── package.json
```

---

## Environment Variables

### hotel-service
```
SPRING_DATASOURCE_URL=jdbc:postgresql://<RDS_ENDPOINT>:5432/hoteldb
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
SPRING_REDIS_HOST=<ELASTICACHE_ENDPOINT>
SPRING_REDIS_PORT=6379
AWS_SQS_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account>/hotel-new-reservations
AWS_REGION=eu-central-1
AWS_COGNITO_ISSUER_URI=https://cognito-idp.<region>.amazonaws.com/<userPoolId>
S3_BUCKET_NAME=
```

### ai-agent-service
```
PORT=3000
ANTHROPIC_API_KEY=
HOTEL_SERVICE_URL=
AWS_COGNITO_ISSUER_URI=
AWS_REGION=eu-central-1
```

### comments-service
```
SPRING_DATA_MONGODB_URI=mongodb+srv://user1:21e03k05@project-cluster.jcoamfv.mongodb.net/commentsdb?appName=project-cluster
AWS_COGNITO_ISSUER_URI=
AWS_REGION=eu-central-1
```

### notification-service
```
HOTEL_SERVICE_BASE_URL=
AWS_SQS_QUEUE_URL=
AWS_REGION=eu-central-1
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
```

### api-gateway
```
HOTEL_SERVICE_URL=
AI_AGENT_SERVICE_URL=
COMMENTS_SERVICE_URL=
NOTIFICATION_SERVICE_URL=
AWS_COGNITO_ISSUER_URI=
AWS_REGION=eu-central-1
```

### frontend (.env)
```
VITE_API_GATEWAY_URL=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=eu-central-1
```

---

## AWS Infrastructure Setup

1. **RDS PostgreSQL** — create `hoteldb` database, run schema migrations (Flyway)
2. **ElastiCache Redis** — single-node cluster, same VPC as App Runner services
3. **SQS Queue** — standard queue named `hotel-new-reservations`
4. **Cognito User Pool** — create user pool + app client; define groups `ADMIN` and `USER`
5. **S3 Bucket** — `hotel-images-<suffix>` for room photos (optional), + separate bucket for frontend static hosting
6. **CloudFront** — distribution pointing to frontend S3 bucket
7. **App Runner** — one service per microservice; connect to ECR or GitHub for auto-deploy
8. **EventBridge Scheduler** — CRON rule targeting notification-service `/api/v1/notifications/nightly`

---

## Dockerfiles

Each service must have a `Dockerfile`. Example for Spring Boot:

```dockerfile
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Frontend Dockerfile:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Key Implementation Notes

### Pessimistic Locking (Double-booking Prevention)
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT r FROM Room r WHERE r.id = :id")
Optional<Room> findByIdWithLock(@Param("id") Long id);
```

### 15% Discount Logic
- In `SearchService`, check if the request contains a valid JWT
- If authenticated: `discountedPrice = originalPrice * 0.85`
- Return both `originalPrice` and `discountedPrice` in the DTO

### Swagger / OpenAPI Documentation
Every Spring Boot service (hotel-service, comments-service, notification-service, api-gateway) must include Springdoc OpenAPI:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

Each service exposes:
- Swagger UI at `/swagger-ui/index.html`
- OpenAPI JSON at `/v3/api-docs`

Annotate all controllers with `@Tag`, all endpoints with `@Operation` and `@ApiResponse`.

For ai-agent-service (Node.js), add `swagger-ui-express` + `swagger-jsdoc`:
```json
"swagger-ui-express": "^5.0.0",
"swagger-jsdoc": "^6.2.8"
```
Swagger UI served at `/api-docs`.

### API Versioning
- All endpoints under `/api/v1/` prefix
- Use `@RequestMapping("/api/v1/...")` on all controllers

### Pagination
- Use Spring Data `Pageable` for all list endpoints
- Return `Page<T>` wrapped in a standard response envelope:
```json
{
  "data": [...],
  "page": 0,
  "size": 10,
  "totalElements": 42,
  "totalPages": 5
}
```

---

## Assumptions (Document in README)

1. "Destination" search is matched against hotel `destination` and `address` fields (ILIKE query)
2. Room capacity decrease on booking means setting room status to OCCUPIED for the booked dates; a room can only have one booking per date range
3. Notification emails for low capacity are sent to hotel admin's email stored in the `hotels` table
4. The AI Agent is a separate Node.js/TypeScript service (`ai-agent-service`) deployed independently on App Runner; it calls Hotel Service internally and is not exposed directly to the frontend (goes through API Gateway)
5. MongoDB Atlas free tier is used for comments (not AWS DocumentDB) to avoid cost
6. Image uploading (S3) is implemented as a nice-to-have but not blocking
7. "Haritada Göster" uses Leaflet.js with OpenStreetMap (free, no API key needed)
8. EventBridge Scheduler calls the notification service via HTTP — the notification service is not in a private VPC
9. Payment is mocked — booking always succeeds with status CONFIRMED, no real payment processing

---

## README Checklist (for GitHub)

- [ ] Deployed URLs (API Gateway, Frontend CloudFront URL)
- [ ] Architecture diagram
- [ ] ER diagram (hotels, rooms, bookings tables)
- [ ] MongoDB schema
- [ ] Assumptions listed above
- [ ] Known issues / limitations
- [ ] Link to 5-minute demo video

---

## AWS Deployment Automation

All AWS infrastructure must be provisioned using the **AWS CLI**. Do not use the AWS Console manually. All CLI commands must be scripted in `infra/setup.sh` so the entire infrastructure can be reproduced from scratch with a single script.

### Prerequisites (already installed and configured on the machine)
- AWS CLI v2, configured with root/admin credentials (`aws configure`)
- Docker (for building and pushing images to ECR)
- Node.js 20, Java 17, Maven (for building services)

### AWS Region
Use `eu-central-1` (Frankfurt) for all resources unless a service is not available there.

### Step-by-step provisioning order

#### 1. ECR — Create one repository per service
```bash
aws ecr create-repository --repository-name hotel-service --region eu-central-1
aws ecr create-repository --repository-name comments-service --region eu-central-1
aws ecr create-repository --repository-name notification-service --region eu-central-1
aws ecr create-repository --repository-name ai-agent-service --region eu-central-1
aws ecr create-repository --repository-name api-gateway --region eu-central-1
```
After creation, build each service's Docker image and push to its ECR repository.

#### 2. RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier hoteldb \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username hoteluser \
  --master-user-password <GENERATE_SECURE_PASSWORD> \
  --allocated-storage 20 \
  --db-name hoteldb \
  --publicly-accessible \
  --region eu-central-1
```
After RDS is available, run Flyway migrations from hotel-service.

#### 3. ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id hotel-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --region eu-central-1
```

#### 4. SQS Queue
```bash
aws sqs create-queue \
  --queue-name hotel-new-reservations \
  --region eu-central-1
```

#### 5. Cognito User Pool
```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name hotel-booking-pool \
  --policies '{"PasswordPolicy":{"MinimumLength":8}}' \
  --region eu-central-1

# Create app client (note the UserPoolId from above output)
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name hotel-booking-client \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region eu-central-1

# Create ADMIN and USER groups
aws cognito-idp create-group --group-name ADMIN --user-pool-id <USER_POOL_ID> --region eu-central-1
aws cognito-idp create-group --group-name USER --user-pool-id <USER_POOL_ID> --region eu-central-1
```

#### 6. S3 Buckets
```bash
# Frontend static hosting
aws s3 mb s3://hotel-booking-frontend-<UNIQUE_SUFFIX> --region eu-central-1
aws s3 website s3://hotel-booking-frontend-<UNIQUE_SUFFIX> \
  --index-document index.html --error-document index.html

# Room images (optional)
aws s3 mb s3://hotel-booking-images-<UNIQUE_SUFFIX> --region eu-central-1
```

#### 7. CloudFront Distribution (for frontend)
```bash
aws cloudfront create-distribution \
  --origin-domain-name hotel-booking-frontend-<UNIQUE_SUFFIX>.s3-website-eu-central-1.amazonaws.com \
  --default-root-object index.html
```

#### 8. App Runner — one service per microservice
For each service, create an App Runner service pointing to its ECR image:
```bash
aws apprunner create-service \
  --service-name hotel-service \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "<ECR_URI>/hotel-service:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "SPRING_DATASOURCE_URL": "<RDS_URL>",
          "SPRING_DATASOURCE_USERNAME": "hoteluser",
          "SPRING_DATASOURCE_PASSWORD": "<PASSWORD>",
          "SPRING_REDIS_HOST": "<ELASTICACHE_ENDPOINT>",
          "SPRING_REDIS_PORT": "6379",
          "AWS_SQS_QUEUE_URL": "<SQS_URL>",
          "AWS_REGION": "eu-central-1",
          "AWS_COGNITO_ISSUER_URI": "<COGNITO_ISSUER_URI>",
          "S3_BUCKET_NAME": "<BUCKET_NAME>"
        }
      }
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{"Cpu":"1 vCPU","Memory":"2 GB"}' \
  --region eu-central-1
```
Repeat for `comments-service` (port 8081), `notification-service` (port 8082), `ai-agent-service` (port 3000), and `api-gateway` (port 8080) with their respective env vars.

#### 9. EventBridge Scheduler (nightly job)
```bash
# First create an IAM role that allows EventBridge to call HTTP endpoints
aws events put-rule \
  --name hotel-nightly-job \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED \
  --region eu-central-1

# Target: notification-service /api/v1/notifications/nightly
# Use EventBridge Scheduler (not Events) for HTTP targets:
aws scheduler create-schedule \
  --name hotel-nightly-job \
  --schedule-expression "cron(0 2 * * ? *)" \
  --target '{
    "Arn": "arn:aws:scheduler:::aws-sdk:lambda:invoke",
    "RoleArn": "<SCHEDULER_ROLE_ARN>",
    "Input": "{}"
  }' \
  --flexible-time-window '{"Mode":"OFF"}' \
  --region eu-central-1
```
Note: Since the notification service is an HTTP endpoint (App Runner), use an AWS Lambda shim or configure EventBridge to POST directly to the App Runner URL via a connection.

### infra/setup.sh
Create `infra/setup.sh` at the root of the repository that runs all the above commands in order, capturing output values (UserPoolId, RDS endpoint, ECR URIs, App Runner URLs, etc.) and automatically injecting them into subsequent commands and into each service's environment variable configuration.

The script must:
1. Provision all resources in the correct order
2. Wait for resources to become available before proceeding (e.g., `aws rds wait db-instance-available`)
3. Write all generated values to `infra/.env.generated` for reference
4. Build and push all Docker images to ECR
5. Deploy all App Runner services with correct env vars
6. Build the React frontend with correct `VITE_*` env vars and upload to S3
7. Invalidate the CloudFront cache after frontend upload

### IAM Permissions needed
The AWS account used must have permissions for: ECR, RDS, ElastiCache, SQS, Cognito, S3, CloudFront, App Runner, EventBridge Scheduler, IAM (to create roles for App Runner and EventBridge).
