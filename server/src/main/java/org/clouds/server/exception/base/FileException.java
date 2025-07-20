package org.clouds.server.exception.base;

/**
 * Base class for file-related exceptions.
 * 
 * @author Bohdan
 * @version 1.0
 */
public abstract class FileException extends CloudsBusinessException {
    
    protected FileException(String message) {
        super(message);
    }
    
    protected FileException(String message, Throwable cause) {
        super(message, cause);
    }
    
    protected FileException(String message, String errorCode, Object... parameters) {
        super(message, errorCode, parameters);
    }
    
    protected FileException(String message, Throwable cause, String errorCode, Object... parameters) {
        super(message, cause, errorCode, parameters);
    }
}