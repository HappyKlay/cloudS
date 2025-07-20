package org.clouds.server.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFile {
    private Long id;
    private Integer userId;
    private String fileName;
    private Long fileSizeBytes;
    private String s3Key;
    private String contentType;
    private LocalDateTime createdAt;
}

