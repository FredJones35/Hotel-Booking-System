package com.se4458.hotelservice.dto.response;

import com.se4458.hotelservice.model.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder
public class BookingResponse {
    private Long id;
    private Long hotelId;
    private String hotelName;
    private Long roomId;
    private String userId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer guestCount;
    private BigDecimal totalPrice;
    private BookingStatus status;
    private LocalDateTime createdAt;
}
