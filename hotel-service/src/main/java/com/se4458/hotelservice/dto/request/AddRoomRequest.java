package com.se4458.hotelservice.dto.request;

import com.se4458.hotelservice.model.enums.RoomType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AddRoomRequest {
    @NotNull private RoomType roomType;
    private String roomNumber;
    @Min(1) private Integer capacity;
    @NotNull @DecimalMin("0.01") private BigDecimal pricePerNight;
    private LocalDate availableFrom;
    private LocalDate availableTo;
}
