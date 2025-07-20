package org.clouds.server.exception;

import org.clouds.server.exception.base.FileException;

/**
 * Exception thrown when a file is not found.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class FileNotFoundException extends FileException {
    
    public static final String ERROR_CODE = "FILE_NOT_FOUND";
    
    public FileNotFoundException(String message) {
        super(message, ERROR_CODE);
    }
    
    public FileNotFoundException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static FileNotFoundException byId(Long fileId) {
        return new FileNotFoundException("File not found with ID: " + fileId);
    }
    
    public static FileNotFoundException byKey(String key) {
        return new FileNotFoundException("File not found with key: " + key);
    }
}