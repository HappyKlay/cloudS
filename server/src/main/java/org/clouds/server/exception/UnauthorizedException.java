package org.clouds.server.exception;

import java.util.List;

/**
 * Exception thrown when authentication or authorization fails.
 *
 * @author Bohdan
 * @version 1.0
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }

    public List<String> getErrorCode()
    {
    }
}

