package org.clouds.server.dto.request;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LoginUserFirstAttemptRequestDto {
    private String email;
}
