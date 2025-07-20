package org.clouds.server.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyUserRequestDto {
    private String email;
    private String verificationCode;
}
