package com.se4458.notificationservice.dto;

import lombok.Data;

@Data
public class ReservationMessage {
    private Long bookingId;
    private Long hotelId;
    private String userId;
    private String checkIn;
    private String checkOut;
    private String hotelAdminEmail;
}
