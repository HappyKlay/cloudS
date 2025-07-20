package org.clouds.server.exception.base;

/**
 * Base class for technical exceptions.
 * These exceptions represent technical failures like I/O errors, network issues, etc.
 * 
 * @author Bohdan
 * @version 1.0
 */
public abstract class CloudsTechnicalException extends CloudsBaseException {
    
    protected CloudsTechnicalException(String message) {
        super(message);
    }
    
    protected CloudsTechnicalException(String message, Throwable cause) {
        super(message, cause);
    }
    
    protected CloudsTechnicalException(String message, String errorCode, Object... parameters) {
        super(message, errorCode, parameters);
    }
    
    protected CloudsTechnicalException(String message, Throwable cause, String errorCode, Object... parameters) {
        super(message, cause, errorCode, parameters);
    }
}