package com.se4458.commentsservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class PageResponse<T> {
    private List<T> data;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
