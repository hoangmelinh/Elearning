package com.elearning.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagedResponse<T> {
    private List<T> data;
    private int page;
    private int size;
    private long total;
    private int totalPages;

    public static <T> PagedResponse<T> of(Page<T> pageResult) {
        return PagedResponse.<T>builder()
                .data(pageResult.getContent())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .total(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .build();
    }
}
