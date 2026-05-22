import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import chatRouter from './routes/chat.route';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Agent Service API',
      version: '1.0.0',
      description: 'Hotel Booking AI Agent powered by Anthropic Claude'
    },
    servers: [{ url: `http://localhost:${config.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/ai', chatRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'UP', service: 'ai-agent-service' });
});

app.listen(config.port, () => {
  console.log(`AI Agent Service running on port ${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/api-docs`);
});

export default app;
