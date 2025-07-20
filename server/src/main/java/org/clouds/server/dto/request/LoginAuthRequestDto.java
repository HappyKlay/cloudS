package org.clouds.server.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginAuthRequestDto {
    @NotBlank(message = "email is mandatory")
    private String email;
    @NotBlank(message = "authHash is mandatory")
    private String authHash;
} 