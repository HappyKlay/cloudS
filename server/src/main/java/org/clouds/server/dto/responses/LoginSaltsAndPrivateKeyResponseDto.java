package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginSaltsAndPrivateKeyResponseDto {
    private String encryptedMasterKey;
    private String encryptedMasterKeyIv;
    private String saltMk;
    private String saltEncryption;
    private String encryptedPrivateKey;
    private String encryptedPrivateKeyIv;
    private String encryptedPrivateKeySalt;
    private String sessionId;
    private boolean success;
    private String message;
}
