package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionVerificationResponse {
    private boolean isValid;
    private String message;
    private String error;

    public static SessionVerificationResponse valid(){
        return SessionVerificationResponse.builder()
                .isValid(true)
                .build();
    }

    public static SessionVerificationResponse valid(String message){
        return SessionVerificationResponse.builder()
                .isValid(true)
                .message(message)
                .build();
    }

    public static SessionVerificationResponse invalid(String message){
        return SessionVerificationResponse.builder()
                .isValid(false)
                .message(message)
                .build();
    }

    public static SessionVerificationResponse error(String error){
        return SessionVerificationResponse.builder()
                .isValid(false)
                .error(error)
                .build();
    }
}
