package org.clouds.server.exception;

import org.clouds.server.exception.base.FileException;

/**
 * Exception thrown when file operations fail.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class FileOperationException extends FileException {
    
    public static final String ERROR_CODE = "FILE_OPERATION_FAILED";
    
    public FileOperationException(String message) {
        super(message, ERROR_CODE);
    }
    
    public FileOperationException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static FileOperationException upload(String fileName, Throwable cause) {
        return new FileOperationException("Failed to upload file: " + fileName, cause);
    }
    
    public static FileOperationException download(String fileName, Throwable cause) {
        return new FileOperationException("Failed to download file: " + fileName, cause);
    }
    
    public static FileOperationException delete(String fileName, Throwable cause) {
        return new FileOperationException("Failed to delete file: " + fileName, cause);
    }
}