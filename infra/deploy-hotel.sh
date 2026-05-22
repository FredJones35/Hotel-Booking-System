#!/bin/bash
ECR_BASE="825555019210.dkr.ecr.eu-central-1.amazonaws.com"
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $ECR_BASE
docker pull $ECR_BASE/hotel-service:latest
cd /opt/hotel-services && /usr/local/bin/docker-compose up -d --no-deps hotel-service
echo "Waiting 50s for Spring Boot..."
sleep 50
echo "=== All rooms (no date filter) ==="
curl -s "http://localhost:8081/api/v1/hotels/5/rooms" | python3 -c "import sys,json; r=json.load(sys.stdin); print(len(r), 'rooms'); [print(' ', x['roomType'], x['roomNumber'], '$'+str(x['pricePerNight'])) for x in r]"
echo "=== Available rooms with dates ==="
curl -s "http://localhost:8081/api/v1/hotels/5/rooms?checkIn=2026-06-01&checkOut=2026-06-05&guests=2" | python3 -c "import sys,json; r=json.load(sys.stdin); print(len(r), 'available rooms')"
