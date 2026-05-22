package com.se4458.commentsservice.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "comments")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Comment {
    @Id
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
