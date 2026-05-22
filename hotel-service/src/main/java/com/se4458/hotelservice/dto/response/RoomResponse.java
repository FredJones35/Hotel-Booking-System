package com.se4458.hotelservice.dto.response;

import com.se4458.hotelservice.model.enums.RoomStatus;
import com.se4458.hotelservice.model.enums.RoomType;
import lombok.Builder;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class RoomResponse implements Serializable {
    private Long id;
    private Long hotelId;
    private RoomType roomType;
    private String roomNumber;
    private Integer capacity;
    private BigDecimal pricePerNight;
    private BigDecimal discountedPrice;
    private RoomStatus status;
    private LocalDate availableFrom;
    private LocalDate availableTo;
}
