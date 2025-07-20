package org.clouds.server.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Builder
@Getter
@Setter
public class RegistrationRequestDto {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Surname is required")
    @Size(min = 2, max = 50, message = "Surname must be between 2 and 50 characters")
    private String surname;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Salt is required")
    private String salt;

    @NotBlank(message = "Auth salt is required")
    private String authSalt;

    @NotBlank(message = "Encryption salt is required")
    private String encSalt;

    @NotBlank(message = "Master key salt is required")
    private String encMKSalt;

    private String ip;

    @NotBlank(message = "Encrypted master key is required")
    private String encryptedMasterKey;

    @NotBlank(message = "Encrypted master key IV is required")
    private String encryptedMasterKeyIv;

    @NotBlank(message = "Public key is required")
    private String publicKey;

    @NotBlank(message = "Hashed authentication key is required")
    private String hashedAuthenticationKey;

    @NotBlank(message = "Encrypted private key is required")
    private String encryptedPrivateKey;

    @NotBlank(message = "Encrypted private key IV is required")
    private String encryptedPrivateKeyIv;

    @NotBlank(message = "Encrypted private key salt is required")
    private String encryptedPrivateKeySalt;
}