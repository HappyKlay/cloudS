package org.clouds.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileTransferRequestDto {
    private Long fileId;
    private String recipientEmail;
    private String newWrappedKey;
    private String newKeyIv;
} 