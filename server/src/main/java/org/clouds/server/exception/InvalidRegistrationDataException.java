package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsBusinessException;

/**
 * Exception thrown when registration data is invalid.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class InvalidRegistrationDataException extends CloudsBusinessException {
    
    public static final String ERROR_CODE = "INVALID_REGISTRATION_DATA";
    
    public InvalidRegistrationDataException(String message) {
        super(message, ERROR_CODE);
    }
    
    public InvalidRegistrationDataException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static InvalidRegistrationDataException userCreation() {
        return new InvalidRegistrationDataException("Invalid user data provided");
    }
    
    public static InvalidRegistrationDataException userSecurity() {
        return new InvalidRegistrationDataException("Invalid user security data provided");
    }
    
    public static InvalidRegistrationDataException userVerification() {
        return new InvalidRegistrationDataException("Error creating user verification");
    }
}