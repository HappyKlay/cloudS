package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginInitResponseDto {
    private String salt;       // For password encryption
    private String authSalt;   // For hashing authentication key
    private boolean success;   // Whether the operation was successful
    private String message;    // Error message if not successful
} 