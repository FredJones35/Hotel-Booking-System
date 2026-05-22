package com.se4458.commentsservice.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data @Builder
public class CommentResponse {
    private String id;
    private String hotelId;
    private String userId;
    private String userName;
    private Double overallRating;
    private Map<String, Double> categoryRatings;
    private String comment;
    private String stayDuration;
    private LocalDateTime createdAt;
}
