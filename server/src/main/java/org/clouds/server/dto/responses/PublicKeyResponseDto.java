package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for public key information.
 *
 * @author Bohdan
 * @version 1.0
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PublicKeyResponseDto {
    private String publicKey;

}
