package org.clouds.server.exception;

/**
 * Exception thrown when storage configuration is invalid.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class StorageConfigurationException extends StorageException {
    
    public static final String ERROR_CODE = "STORAGE_CONFIG_ERROR";
    
    public StorageConfigurationException(String message) {
        super(message, ERROR_CODE);
    }
    
    public StorageConfigurationException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static StorageConfigurationException missingProperty(String property) {
        return new StorageConfigurationException("Missing required storage configuration property: " + property);
    }
    
    public static StorageConfigurationException invalidProperty(String property, String value) {
        return new StorageConfigurationException("Invalid storage configuration property '" + property + "': " + value);
    }
}