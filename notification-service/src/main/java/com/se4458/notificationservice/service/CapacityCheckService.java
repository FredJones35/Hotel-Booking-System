package com.se4458.notificationservice.service;

import com.se4458.notificationservice.dto.HotelDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CapacityCheckService {

    private final WebClient.Builder webClientBuilder;
    private final EmailService emailService;

    @Value("${app.hotel-service-url}")
    private String hotelServiceUrl;

    public void runNightlyCheck() {
        log.info("Starting nightly capacity check");
        try {
            WebClient client = webClientBuilder.baseUrl(hotelServiceUrl).build();

            List<HotelDto> hotels = client.get()
                .uri("/api/v1/internal/hotels")
                .retrieve()
                .bodyToFlux(HotelDto.class)
                .collectList()
                .block();

            if (hotels == null || hotels.isEmpty()) {
                log.info("No hotels found for capacity check");
                return;
            }

            log.info("Checking capacity for {} hotels", hotels.size());

            for (HotelDto hotel : hotels) {
                try {
                    Map<String, Long> cap = client.get()
                        .uri("/api/v1/internal/hotels/{id}/capacity", hotel.getId())
                        .retrieve()
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Long>>() {})
                        .block();

                    if (cap != null && cap.getOrDefault("total", 0L) > 0) {
                        long total = cap.getOrDefault("total", 0L);
                        long vacant = cap.getOrDefault("vacant", 0L);
                        double availableRate = (double) vacant / total;

                        if (availableRate < 0.20) {
                            log.warn("Hotel '{}' (id={}) has low availability: {}% ({}/{} rooms vacant)",
                                hotel.getName(), hotel.getId(),
                                (int)(availableRate * 100), vacant, total);

                            emailService.sendEmail(
                                hotel.getAdminEmail(),
                                "Low Room Availability Alert — " + hotel.getName(),
                                String.format(
                                    "Dear Admin,\n\nYour hotel '%s' has only %d%% room availability.\n" +
                                    "%d of %d rooms are currently vacant.\n\n" +
                                    "Please review your room availability settings.",
                                    hotel.getName(), (int)(availableRate * 100), vacant, total)
                            );
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to check capacity for hotel {}: {}", hotel.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Nightly capacity check failed: {}", e.getMessage(), e);
        }
        log.info("Nightly capacity check completed");
    }
}
