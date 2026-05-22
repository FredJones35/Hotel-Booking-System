package com.se4458.notificationservice.controller;

import com.se4458.notificationservice.service.CapacityCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification and nightly job endpoints")
public class NotificationController {

    private final CapacityCheckService capacityCheckService;

    @PostMapping("/nightly")
    @Operation(summary = "Trigger nightly capacity check (called by EventBridge)")
    public ResponseEntity<Map<String, String>> triggerNightly() {
        capacityCheckService.runNightlyCheck();
        return ResponseEntity.ok(Map.of("status", "Nightly job triggered successfully"));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "notification-service"));
    }
}
