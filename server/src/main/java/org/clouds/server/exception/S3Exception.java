package org.clouds.server.exception;

/**
 * Exception thrown when S3 operations fail.
 * 
 * @author Bohdan
 * @version 1.0
 */
public class S3Exception extends StorageException {
    
    public static final String ERROR_CODE = "S3_OPERATION_FAILED";
    
    public S3Exception(String message) {
        super(message, ERROR_CODE);
    }
    
    public S3Exception(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
    
    public static S3Exception initializationFailed(Throwable cause) {
        return new S3Exception("Failed to initialize S3 client", cause);
    }
    
    public static S3Exception uploadFailed(String key, Throwable cause) {
        return new S3Exception("Failed to upload file to S3: " + key, cause);
    }
    
    public static S3Exception downloadFailed(String key, Throwable cause) {
        return new S3Exception("Failed to download file from S3: " + key, cause);
    }
    
    public static S3Exception deleteFailed(String key, Throwable cause) {
        return new S3Exception("Failed to delete file from S3: " + key, cause);
    }
    
    public static S3Exception ioError(String operation, Throwable cause) {
        return new S3Exception("I/O error during S3 " + operation, cause);
    }
}