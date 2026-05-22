package com.se4458.commentsservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data @Builder
public class CommentStatsResponse {
    private String hotelId;
    private long commentCount;
    private Double overallAverage;
    private Map<String, Double> categoryAverages;
}
