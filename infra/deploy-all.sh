#!/bin/bash
ECR_BASE="825555019210.dkr.ecr.eu-central-1.amazonaws.com"
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $ECR_BASE
docker pull $ECR_BASE/hotel-service:latest
docker pull $ECR_BASE/api-gateway:latest
cd /opt/hotel-services
/usr/local/bin/docker-compose up -d --no-deps hotel-service api-gateway
echo "Waiting 55s for Spring Boot startups..."
sleep 55
echo "=== hotel-service ==="
curl -so /dev/null -w "hotel detail: %{http_code}\n" http://localhost:8081/api/v1/hotels/2
curl -so /dev/null -w "bookings OPTIONS: %{http_code}\n" -X OPTIONS http://localhost:8081/api/v1/bookings -H "Origin: http://hotel-booking-frontend-459981.s3-website.eu-central-1.amazonaws.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type"
echo "=== api-gateway ==="
curl -so /dev/null -w "gateway health: %{http_code}\n" http://localhost:8080/actuator/health
curl -so /dev/null -w "gateway bookings OPTIONS: %{http_code}\n" -X OPTIONS http://localhost:8080/api/v1/bookings -H "Origin: http://hotel-booking-frontend-459981.s3-website.eu-central-1.amazonaws.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type"
