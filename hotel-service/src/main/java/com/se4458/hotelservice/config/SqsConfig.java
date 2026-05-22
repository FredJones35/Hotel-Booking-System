package com.se4458.hotelservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SqsConfig {

    @Value("${app.sqs.queue-url:}")
    private String queueUrl;

    public String getQueueUrl() {
        return queueUrl;
    }
}
