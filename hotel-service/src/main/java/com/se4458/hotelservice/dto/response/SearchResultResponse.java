package com.se4458.hotelservice.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class SearchResultResponse {
    private Long hotelId;
    private String hotelName;
    private String destination;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer starRating;
    private String amenities;
    private String description;
    private String imageUrl;
    private List<RoomResponse> availableRooms;
    private BigDecimal minPrice;
    private BigDecimal minDiscountedPrice;
    private boolean discountApplied;
}
