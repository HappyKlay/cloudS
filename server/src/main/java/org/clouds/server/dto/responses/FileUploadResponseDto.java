package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponseDto {
    private Long fileId;
    private String fileName;
    private boolean success;

    public static FileUploadResponseDto success(Long fileId, String fileName) {
        return FileUploadResponseDto.builder()
                .fileId(fileId)
                .fileName(fileName)
                .success(true)
                .build();
    }

    public static FileUploadResponseDto error(String fileName) {
        return FileUploadResponseDto.builder()
                .fileName(fileName)
                .success(false)
                .build();
    }
} 