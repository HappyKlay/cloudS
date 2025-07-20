package org.clouds.server.service;

import lombok.extern.slf4j.Slf4j;
import org.clouds.server.exception.S3Exception;
import org.clouds.server.exception.StorageConfigurationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Service for managing S3 file operations.
 * Provides functionality for uploading, downloading, and deleting files from AWS S3.
 * 
 * @author CloudS Team
 * @version 1.0
 */
@Service
@Slf4j(topic = "s3.storage")
public class S3Service {
    
    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;
    
    @Value("${cloud.aws.credentials.accessKey}")
    private String accessKey;
    
    @Value("${cloud.aws.credentials.secretKey}")
    private String secretKey;
    
    @Value("${cloud.aws.region.static}")
    private String region;
    
    private S3Client s3Client;
    
    /**
     * Initializes the S3 client with configured credentials and region.
     * 
     * @throws StorageConfigurationException if the configuration is invalid
     * @throws S3Exception if S3 client initialization fails
     */
    @PostConstruct
    public void init() {
        validateConfiguration();
        
        try {
            log.info("Initializing S3 client with region: {}", region);
            
            AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(accessKey, secretKey);
            
            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                    .build();
            
            log.info("S3 client initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize S3 client: {}", e.getMessage(), e);
            throw S3Exception.initializationFailed(e);
        }
    }
    
    /**
     * Uploads a file to S3.
     * 
     * @param fileContent The file content as a byte array
     * @param contentType The MIME type of the file
     * @param fileKey The S3 key for the file
     * @throws S3Exception if upload fails
     */
    public void uploadFile(byte[] fileContent, String contentType, String fileKey) {
        log.info("Uploading file to S3: {}", fileKey);
        
        validateFileUploadParams(fileContent, contentType, fileKey);
        ensureS3ClientInitialized();
        
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .contentType(contentType)
                    .contentLength((long) fileContent.length)
                    .build();
            
            PutObjectResponse response = s3Client.putObject(putRequest, RequestBody.fromBytes(fileContent));
            
            log.info("File uploaded successfully to S3: {}, ETag: {}", fileKey, response.eTag());
        } catch (S3Exception e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", e.getMessage(), e);
            throw S3Exception.uploadFailed(fileKey, e);
        }
    }
    
    /**
     * Downloads a file from S3.
     * 
     * @param s3Key The S3 key of the file to download
     * @return The file content as a byte array
     * @throws S3Exception if download fails
     */
    public byte[] downloadFile(String s3Key) {
        log.info("Downloading file from S3: {}", s3Key);
        
        validateS3Key(s3Key);
        ensureS3ClientInitialized();
        
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();
            
            try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(getObjectRequest);
                 ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                
                byte[] data = new byte[4096];
                int bytesRead;
                
                while ((bytesRead = s3Object.read(data)) != -1) {
                    buffer.write(data, 0, bytesRead);
                }
                
                byte[] content = buffer.toByteArray();
                log.info("File downloaded successfully from S3: {}, size: {} bytes", s3Key, content.length);
                return content;
            }
        } catch (IOException e) {
            log.error("I/O error downloading file from S3: {}", e.getMessage(), e);
            throw S3Exception.ioError("download", e);
        } catch (NoSuchKeyException e) {
            log.error("File not found in S3: {}", s3Key);
            throw S3Exception.downloadFailed(s3Key, e);
        } catch (Exception e) {
            log.error("Failed to download file from S3: {}", e.getMessage(), e);
            throw S3Exception.downloadFailed(s3Key, e);
        }
    }
    
    /**
     * Deletes a file from S3.
     * 
     * @param s3Key The S3 key of the file to delete
     * @throws S3Exception if deletion fails
     */
    public void deleteFile(String s3Key) {
        log.info("Deleting file from S3: {}", s3Key);
        
        validateS3Key(s3Key);
        ensureS3ClientInitialized();
        
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();
            
            s3Client.deleteObject(deleteRequest);
            log.info("File deleted successfully from S3: {}", s3Key);
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", e.getMessage(), e);
            throw S3Exception.deleteFailed(s3Key, e);
        }
    }
    
    /**
     * Determines the appropriate S3 folder based on content type.
     * 
     * @param contentType The MIME type of the file
     * @return The folder path for the file type
     */
    public String determineFolder(String contentType) {
        if (contentType == null || contentType.trim().isEmpty()) {
            return "documents/";
        }
        
        if (contentType.startsWith("image/")) {
            return "photos/";
        } else if (contentType.startsWith("video/")) {
            return "videos/";
        } else {
            return "documents/";
        }
    }
    
    /**
     * Validates S3 service configuration.
     * 
     * @throws StorageConfigurationException if the configuration is invalid
     */
    private void validateConfiguration() {
        if (bucketName == null || bucketName.trim().isEmpty()) {
            throw StorageConfigurationException.missingProperty("cloud.aws.s3.bucket-name");
        }
        
        if (accessKey == null || accessKey.trim().isEmpty()) {
            throw StorageConfigurationException.missingProperty("cloud.aws.credentials.accessKey");
        }
        
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw StorageConfigurationException.missingProperty("cloud.aws.credentials.secretKey");
        }
        
        if (region == null || region.trim().isEmpty()) {
            throw StorageConfigurationException.missingProperty("cloud.aws.region.static");
        }
    }
    
    /**
     * Validates file upload parameters.
     * 
     * @param fileContent The file content
     * @param contentType The content type
     * @param fileKey The file key
     * @throws IllegalArgumentException if parameters are invalid
     */
    private void validateFileUploadParams(byte[] fileContent, String contentType, String fileKey) {
        if (fileContent == null || fileContent.length == 0) {
            throw new IllegalArgumentException("File content cannot be null or empty");
        }
        
        if (contentType == null || contentType.trim().isEmpty()) {
            throw new IllegalArgumentException("Content type cannot be null or empty");
        }
        
        validateS3Key(fileKey);
    }
    
    /**
     * Validates S3 key parameter.
     * 
     * @param s3Key The S3 key to validate
     * @throws IllegalArgumentException if the key is invalid
     */
    private void validateS3Key(String s3Key) {
        if (s3Key == null || s3Key.trim().isEmpty()) {
            throw new IllegalArgumentException("S3 key cannot be null or empty");
        }
    }
    
    /**
     * Ensures S3 client is initialized, initializes if needed.
     * 
     * @throws S3Exception if client initialization fails
     */
    private void ensureS3ClientInitialized() {
        if (s3Client == null) {
            init();
        }
    }
}