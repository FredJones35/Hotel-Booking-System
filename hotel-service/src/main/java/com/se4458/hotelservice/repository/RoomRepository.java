package com.se4458.hotelservice.repository;

import com.se4458.hotelservice.model.Room;
import com.se4458.hotelservice.model.enums.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT r FROM Room r WHERE r.hotel.id = :hotelId " +
           "AND r.status = 'VACANT' " +
           "AND r.capacity >= :guests " +
           "AND (r.availableFrom IS NULL OR r.availableFrom <= :checkIn) " +
           "AND (r.availableTo IS NULL OR r.availableTo >= :checkOut)")
    List<Room> findAvailableRooms(@Param("hotelId") Long hotelId,
                                   @Param("checkIn") LocalDate checkIn,
                                   @Param("checkOut") LocalDate checkOut,
                                   @Param("guests") int guests);

    List<Room> findByHotelId(Long hotelId);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.hotel.id = :hotelId")
    long countByHotelId(@Param("hotelId") Long hotelId);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.hotel.id = :hotelId AND r.status = :status")
    long countByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") RoomStatus status);
}
