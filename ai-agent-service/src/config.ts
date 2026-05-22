import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  hotelServiceUrl: process.env.HOTEL_SERVICE_URL || 'http://localhost:8080',
  cognitoIssuerUri: process.env.AWS_COGNITO_ISSUER_URI || '',
  awsRegion: process.env.AWS_REGION || 'eu-central-1',
};
