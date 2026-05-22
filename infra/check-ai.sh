#!/bin/bash
docker logs hotel-services-ai-agent-service-1 2>&1 | grep -i "error\|book\|token\|401\|403\|API call" | tail -20
