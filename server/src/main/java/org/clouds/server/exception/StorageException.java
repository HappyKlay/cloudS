package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsTechnicalException;

/**
 * Base class for storage-related exceptions.
 * 
 * @author Bohdan
 * @version 1.0
 */
public abstract class StorageException extends CloudsTechnicalException {
    
    protected StorageException(String message) {
        super(message);
    }
    
    protected StorageException(String message, Throwable cause) {
        super(message, cause);
    }
    
    protected StorageException(String message, String errorCode, Object... parameters) {
        super(message, errorCode, parameters);
    }
    
    protected StorageException(String message, Throwable cause, String errorCode, Object... parameters) {
        super(message, cause, errorCode, parameters);
    }
}