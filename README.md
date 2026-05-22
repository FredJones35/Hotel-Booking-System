# SE4458 Final Project — Hotel Booking System

A Hotels.com-like hotel booking system built as a microservices architecture.

## Demo Video

[![Demo Video](https://img.youtube.com/vi/Aaq4rxtNWPE/0.jpg)](https://youtu.be/Aaq4rxtNWPE)

## Architecture

```
[React Frontend (S3/CloudFront)]
           |
    [API Gateway - Spring Cloud Gateway (App Runner)]
           |
  ┌────────┼──────────────────────────────────┐
  │        │                │                  │
[Hotel]  [Comments]  [Notification]      [AI Agent]
[Boot]   [Boot]      [Boot]              [Node.js/TS]
[8080]   [8081]      [8082]              [3000]
  │
[RDS/PG] [Redis]  [MongoDB]  [SQS]  [Cognito]
```

## Services

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| hotel-service | Spring Boot 3.2, Java 17 | 8080 | Hotels, rooms, bookings, search |
| comments-service | Spring Boot 3.2, MongoDB | 8081 | Reviews and ratings |
| notification-service | Spring Boot 3.2, SQS | 8082 | Nightly capacity checks, email alerts |
| ai-agent-service | Node.js 20, TypeScript | 3000 | Claude-powered booking assistant |
| api-gateway | Spring Cloud Gateway | 8080 | JWT validation, routing |
| frontend | React 18, Vite, Tailwind | 5173 | React SPA |

## Live URLs

| Component | URL |
|-----------|-----|
| **Frontend** | http://hotel-booking-frontend-459981.s3-website.eu-central-1.amazonaws.com |
| **API Gateway** | http://35.156.202.215:8080 |
| **Hotel Service** | http://35.156.202.215:8081 |
| **Comments Service** | https://pp56mzfpmr.eu-central-1.awsapprunner.com |
| **Notification Service** | http://35.156.202.215:8082 |
| **AI Agent Service** | http://35.156.202.215:3000 |

### Swagger UIs
| Service | URL |
|---------|-----|
| Hotel Service | http://35.156.202.215:8081/swagger-ui/index.html |
| Comments Service | https://pp56mzfpmr.eu-central-1.awsapprunner.com/swagger-ui/index.html |
| Notification Service | http://35.156.202.215:8082/swagger-ui/index.html |
| AI Agent Service | http://35.156.202.215:3000/api-docs |

### AWS Resources
| Resource | Value |
|----------|-------|
| Region | eu-central-1 |
| Cognito User Pool | eu-central-1_xYDm3hohE |
| Cognito Client ID | 1334b9n9d6kdir7ok678kkupeq |
| RDS Endpoint | hoteldb.c7keu2agcdcb.eu-central-1.rds.amazonaws.com |
| Redis Endpoint | hotel-redis.jime5v.0001.euc1.cache.amazonaws.com |
| SQS Queue | https://sqs.eu-central-1.amazonaws.com/825555019210/hotel-new-reservations |
| EC2 Instance | i-01ac18fe932fa08ba (t3.small, eu-central-1) |

> Note: hotel-service, api-gateway, ai-agent, and notification-service run on EC2 (t3.small) via Docker Compose. comments-service runs on App Runner. New accounts have a 2-service App Runner limit; request an increase at AWS Support to migrate all services to App Runner.

## Quick Start (Local)

### Prerequisites
- Java 17, Maven
- Node.js 20
- Docker + Docker Compose
- PostgreSQL, Redis (or Docker)

### Run with Docker Compose
```bash
docker-compose up
```

### Run services individually

```bash
# hotel-service
cd hotel-service
mvn spring-boot:run

# comments-service
cd comments-service
mvn spring-boot:run

# notification-service
cd notification-service
mvn spring-boot:run

# ai-agent-service
cd ai-agent-service
npm install
npm run dev

# api-gateway
cd api-gateway
mvn spring-boot:run

# frontend
cd frontend
npm install
npm run dev
```

## AWS Deployment

### Prerequisites
- AWS CLI v2 configured with admin credentials
- Docker installed and running
- Maven, Node.js 20

### Deploy
```bash
cd infra
chmod +x setup.sh
./setup.sh
```

The script provisions all infrastructure in order and writes all generated values to `infra/.env.generated`.

## Database Schema

### PostgreSQL (hotel-service)

```sql
hotels(id, name, destination, address, latitude, longitude, star_rating,
       amenities, description, image_url, admin_email, created_at)

rooms(id, hotel_id, room_type, room_number, capacity, price_per_night,
      status, available_from, available_to, created_at, updated_at)

bookings(id, hotel_id, room_id, user_id, check_in, check_out,
         guest_count, total_price, status, created_at)
```

### MongoDB (comments-service)

```json
{
  "_id": "ObjectId",
  "hotelId": "string",
  "userId": "string",
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

## API Endpoints

### Hotel Service
```
GET  /api/v1/hotels/search?destination=&checkIn=&checkOut=&guests=&page=&size=
GET  /api/v1/hotels/{hotelId}
POST /api/v1/bookings              (authenticated)
GET  /api/v1/bookings/{bookingId}  (authenticated)
GET  /api/v1/bookings/my           (authenticated)
POST /api/v1/admin/hotels          (ADMIN)
PUT  /api/v1/admin/hotels/{id}     (ADMIN)
POST /api/v1/admin/hotels/{id}/rooms (ADMIN)
```

### Comments Service
```
POST /api/v1/comments              (authenticated)
GET  /api/v1/comments/hotel/{id}?page=&size=
GET  /api/v1/comments/hotel/{id}/stats
```

### Notification Service
```
POST /api/v1/notifications/nightly
GET  /api/v1/notifications/health
```

### AI Agent Service
```
POST /api/v1/ai/chat
  Body: { "message": string, "conversationHistory": [], "userToken": string }
```

## Key Business Rules

1. **Hotel search**: matches destination and address (case-insensitive LIKE)
2. **15% discount**: applied to authenticated (logged-in) users
3. **Double-booking prevention**: pessimistic locking on room updates
4. **Room availability**: only VACANT rooms within requested dates are returned
5. **SQS notifications**: new bookings trigger SQS message → notification-service sends email
6. **Nightly check**: rooms < 20% available capacity triggers admin email alert
7. **Payment**: mocked — all bookings confirmed immediately (no real payment)

## Assumptions

1. Destination search matches `destination` and `address` fields (ILIKE)
2. Room capacity: status set to OCCUPIED on booking (one booking per room per date range)
3. Admin emails stored in `hotels.admin_email`
4. AI Agent goes through API Gateway, not directly to clients
5. MongoDB Atlas free tier used for comments
6. Image uploading (S3) is optional (image_url stored as string)
7. Map view uses Leaflet.js + OpenStreetMap (free, no API key)
8. EventBridge → Notification Service via HTTP POST (not in private VPC)
9. Payment is mocked — booking always succeeds with CONFIRMED status

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Maven |
| Auth | AWS Cognito (JWT) |
| Primary DB | AWS RDS PostgreSQL |
| Cache | AWS ElastiCache Redis (30min TTL) |
| NoSQL | MongoDB Atlas (comments) |
| Queue | AWS SQS |
| Scheduler | AWS EventBridge |
| Storage | AWS S3 |
| Deployment | AWS App Runner |
| Gateway | Spring Cloud Gateway |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| AI Agent | Node.js 20, TypeScript, @anthropic-ai/sdk |
| AI Model | claude-sonnet-4-20250514 |

## Known Issues / Limitations

- ElastiCache Redis is not in a VPC — for production, place all services in a VPC
- The nightly EventBridge → HTTP integration requires a Lambda shim for private endpoints
- No email provider configured by default (notifications logged to console)
- Frontend room availability on HotelDetail page requires navigating from search results
