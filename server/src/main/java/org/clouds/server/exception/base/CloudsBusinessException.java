package org.clouds.server.exception.base;

/**
 * Base class for business logic exceptions.
 * These exceptions represent business rule violations or expected error conditions.
 * 
 * @author Bohdan
 * @version 1.0
 */
public abstract class CloudsBusinessException extends CloudsBaseException {
    
    protected CloudsBusinessException(String message) {
        super(message);
    }
    
    protected CloudsBusinessException(String message, Throwable cause) {
        super(message, cause);
    }
    
    protected CloudsBusinessException(String message, String errorCode, Object... parameters) {
        super(message, errorCode, parameters);
    }
    
    protected CloudsBusinessException(String message, Throwable cause, String errorCode, Object... parameters) {
        super(message, cause, errorCode, parameters);
    }
}