package org.clouds.server.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PasswordUpdateRequestDto {
    private String email;
    private String currentAuthHash;
    private String salt;
    private String authSalt;
    private String encSalt;
    private String hashedAuthenticationKey;
    private String encryptedMasterKey;
    private String encryptedMasterKeyIv;
} 