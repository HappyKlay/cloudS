package org.clouds.server.exception;

import org.clouds.server.exception.base.FileException;

/**
 * Exception thrown when file access is denied or fails.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class FileAccessException extends FileException {
    
    public static final String ERROR_CODE = "FILE_ACCESS_DENIED";
    
    public FileAccessException(String message) {
        super(message, ERROR_CODE);
    }
    
    public FileAccessException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static FileAccessException insufficientPermissions(Long fileId) {
        return new FileAccessException("Insufficient permissions to access file with ID: " + fileId);
    }
    
    public static FileAccessException ownershipRequired(Long fileId) {
        return new FileAccessException("File ownership required for this operation. File ID: " + fileId);
    }
}