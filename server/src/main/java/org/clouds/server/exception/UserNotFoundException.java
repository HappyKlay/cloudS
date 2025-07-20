package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsBusinessException;

/**
 * Exception thrown when a user is not found.
 *
 * @author Bohdan
 * @version 1.0
 */
public class UserNotFoundException extends CloudsBusinessException {

    public static final String ERROR_CODE = "USER_NOT_FOUND";

    public UserNotFoundException(String message) {
        super(message, ERROR_CODE);
    }

    public UserNotFoundException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }

    public static UserNotFoundException byId(Long userId) {
        return new UserNotFoundException("User not found with ID: " + userId);
    }

    public static UserNotFoundException byEmail(String email) {
        return new UserNotFoundException("User not found with email: " + email);
    }

    public static UserNotFoundException byUsername(String username) {
        return new UserNotFoundException("User not found with username: " + username);
    }

    public static UserNotFoundException securityNotFound(Integer userId) {
        return new UserNotFoundException("User security information not found for user ID: " + userId);
    }
}

