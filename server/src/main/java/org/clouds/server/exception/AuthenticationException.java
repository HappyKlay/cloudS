package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsBusinessException;

/**
 * Exception thrown when authentication fails.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class AuthenticationException extends CloudsBusinessException {
    
    public static final String ERROR_CODE = "AUTH_FAILED";
    
    public AuthenticationException(String message) {
        super(message, ERROR_CODE);
    }
    
    public AuthenticationException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static AuthenticationException invalidCredentials() {
        return new AuthenticationException("Invalid credentials provided");
    }
    
    public static AuthenticationException blockedUser(String message) {
        return new AuthenticationException(message);
    }
    
    public static AuthenticationException unverifiedAccount() {
        return new AuthenticationException("Account not verified. Please check your email for verification instructions.");
    }
}