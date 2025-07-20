package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsBusinessException;

/**
 * Exception thrown when attempting to create a user that already exists.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class UserAlreadyExistsException extends CloudsBusinessException {
    
    public static final String ERROR_CODE = "USER_ALREADY_EXISTS";
    
    public UserAlreadyExistsException(String message) {
        super(message, ERROR_CODE);
    }
    
    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static UserAlreadyExistsException email(String email) {
        return new UserAlreadyExistsException("User with email '" + email + "' already exists");
    }
    
    public static UserAlreadyExistsException username(String username) {
        return new UserAlreadyExistsException("User with username '" + username + "' already exists");
    }
}