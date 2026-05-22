package com.se4458.hotelservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateHotelRequest {
    @NotBlank private String name;
    @NotBlank private String destination;
    private String address;
    private Double latitude;
    private Double longitude;
    @Min(1) @Max(5) private Integer starRating;
    private String amenities;
    private String description;
    private String imageUrl;
    private String adminEmail;
}
