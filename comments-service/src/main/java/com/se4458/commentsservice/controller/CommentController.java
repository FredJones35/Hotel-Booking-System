package com.se4458.commentsservice.controller;

import com.se4458.commentsservice.dto.*;
import com.se4458.commentsservice.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Hotel reviews and ratings")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Submit a hotel comment (requires authentication)")
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(commentService.createComment(req, jwt.getSubject()));
    }

    @GetMapping("/hotel/{hotelId}")
    @Operation(summary = "Get paginated comments for a hotel")
    public ResponseEntity<PageResponse<CommentResponse>> getComments(
            @PathVariable String hotelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentService.getCommentsByHotel(hotelId, page, size));
    }

    @GetMapping("/hotel/{hotelId}/stats")
    @Operation(summary = "Get rating statistics for a hotel")
    public ResponseEntity<CommentStatsResponse> getStats(@PathVariable String hotelId) {
        return ResponseEntity.ok(commentService.getStats(hotelId));
    }
}
