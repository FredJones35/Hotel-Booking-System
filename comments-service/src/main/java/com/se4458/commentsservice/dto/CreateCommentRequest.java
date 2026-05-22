package com.se4458.commentsservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.Map;

@Data
public class CreateCommentRequest {
    @NotBlank private String hotelId;
    @NotBlank private String userName;
    @NotNull @DecimalMin("0.0") @DecimalMax("10.0") private Double overallRating;
    private Map<String, Double> categoryRatings;
    private String comment;
    private String stayDuration;
}
