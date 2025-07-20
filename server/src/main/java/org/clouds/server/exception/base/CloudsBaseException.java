package org.clouds.server.exception.base;

/**
 * Base exception class for all CloudS application exceptions.
 * Provides common functionality for all custom exceptions.
 * 
 * @author Bohdan
 * @version 1.0
 */
public abstract class CloudsBaseException extends RuntimeException {
    
    private final String errorCode;
    private final Object[] parameters;
    
    protected CloudsBaseException(String message) {
        super(message);
        this.errorCode = null;
        this.parameters = null;
    }
    
    protected CloudsBaseException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
        this.parameters = null;
    }
    
    protected CloudsBaseException(String message, String errorCode, Object... parameters) {
        super(message);
        this.errorCode = errorCode;
        this.parameters = parameters;
    }
    
    protected CloudsBaseException(String message, Throwable cause, String errorCode, Object... parameters) {
        super(message, cause);
        this.errorCode = errorCode;
        this.parameters = parameters;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public Object[] getParameters() {
        return parameters;
    }
}