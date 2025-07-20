package org.clouds.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadRequestDto {
    private String fileName;
    private Long fileSizeBytes;
    private String contentType;
} 