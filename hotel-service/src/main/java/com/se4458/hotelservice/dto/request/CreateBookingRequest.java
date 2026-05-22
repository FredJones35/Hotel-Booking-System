package com.se4458.hotelservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateBookingRequest {
    @NotNull private Long hotelId;
    @NotNull private Long roomId;
    @NotNull private LocalDate checkIn;
    @NotNull private LocalDate checkOut;
    @Min(1) private Integer guestCount;
}
