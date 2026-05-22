package com.se4458.hotelservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HotelResponse implements Serializable {
    private Long id;
    private String name;
    private String destination;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer starRating;
    private String amenities;
    private String description;
    private String imageUrl;
    private String adminEmail;
    private LocalDateTime createdAt;
}
