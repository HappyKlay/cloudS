package org.clouds.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFileDto {
    private Long id;
    private String fileName;
    private Long fileSizeBytes;
    private String contentType;
    private LocalDateTime createdAt;
    private String owner;
} 