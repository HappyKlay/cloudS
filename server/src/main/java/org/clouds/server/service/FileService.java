package org.clouds.server.service;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.exception.FileAccessException;
import org.clouds.server.exception.FileNotFoundException;
import org.clouds.server.model.FileOwner;
import org.clouds.server.model.UserFile;
import org.clouds.server.model.UserFilesSecure;
import org.clouds.server.dto.request.FileUploadRequestDto;
import org.clouds.server.dto.responses.FileUploadResponseDto;
import org.clouds.server.dto.UserFileDto;
import org.clouds.server.dto.responses.UserFilesResponseDto;
import org.clouds.server.repository.FileOwnerRepository;
import org.clouds.server.repository.UserFileRepository;
import org.clouds.server.repository.UserFilesSecureRepository;
import org.clouds.server.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "file.management")
public class FileService {
    private static final int PAGE_SIZE = 30;

    private final UserFileRepository userFileRepository;
    private final UserFilesSecureRepository userFilesSecureRepository;
    private final FileOwnerRepository fileOwnerRepository;
    private final S3Service s3Service;
    private final UserRepository userRepository;
    private final UserService userService;

    public FileUploadResponseDto saveFileMetadata(FileUploadRequestDto requestDto, Integer userId) {
        log.info("Service: Preparing to save file metadata for user {}: {}", userId, requestDto);

        try {
            UserFile userFile = UserFile.builder()
                    .userId(userId)
                    .fileName(requestDto.getFileName())
                    .fileSizeBytes(requestDto.getFileSizeBytes())
                    .contentType(requestDto.getContentType())
                    .createdAt(LocalDateTime.now())
                    .s3Key("none")
                    .build();

            log.info("Service: Created UserFile entity: {}", userFile);

            UserFile savedFile = userFileRepository.saveFileMetadata(userFile);

            log.info("Service: File metadata saved to database with ID: {}", savedFile.getId());

            try {
                FileOwner fileOwner = new FileOwner();
                fileOwner.setFileId(savedFile.getId());
                fileOwner.setOwnerUserId(Long.valueOf(userId));
                FileOwner savedOwner = fileOwnerRepository.saveFileOwner(fileOwner);

                log.info("Service: File owner information saved for fileId: {}, userId: {}, owner record: {}",
                        savedFile.getId(), userId, savedOwner);
            } catch (Exception e) {
                log.error("Service: Error saving file owner information: {}", e.getMessage(), e);
            }

            return FileUploadResponseDto.builder()
                    .fileId(savedFile.getId())
                    .fileName(savedFile.getFileName())
                    .success(true)
                    .build();
        } catch (Exception e) {
            log.error("Service: Error saving file metadata: {}", e.getMessage(), e);
            return FileUploadResponseDto.builder()
                    .fileName(requestDto.getFileName())
                    .success(false)
                    .build();
        }
    }

    public void saveFileContent(Long fileId,
                                Integer userId,
                                byte[] encryptedContent,
                                String encryptedKey,
                                String iv,
                                String tag,
                                String keyIv
    ) {
        log.info("Service: Saving file content for fileId: {}, userId: {}", fileId, userId);

        UserFile userFile = userFileRepository.getUserFileById(fileId);
        if (userFile == null) {
            log.error("Service: File not found with ID: {}", fileId);
            throw new FileNotFoundException("File not found");
        }

        if (!userFile.getUserId().equals(userId)) {
            log.error("Service: File {} does not belong to user {}", fileId, userId);
            throw new FileAccessException("Unauthorized access to file");
        }

        String folder = s3Service.determineFolder(userFile.getContentType());
        String s3Key = folder + UUID.randomUUID() + "_" + userFile.getFileName();

        s3Service.uploadFile(encryptedContent, userFile.getContentType(), s3Key);

        userFile.setS3Key(s3Key);
        userFileRepository.updateUserFile(userFile);

        UserFilesSecure secureDetails = UserFilesSecure.builder()
                .fileId(fileId)
                .userId(Long.valueOf(userId))
                .wrappedKey(encryptedKey)
                .fileIv(iv)
                .fileTag(tag)
                .keyIv(keyIv)
                .createdAt(LocalDateTime.now())
                .build();

        userFilesSecureRepository.saveSecureDetails(secureDetails);

        log.info("Service: File content saved and uploaded to S3 successfully: {}", s3Key);
    }

    public UserFilesResponseDto getUserFiles(Integer userId, int page) {
        log.info("Service: Getting files for user {} (page: {})", userId, page);

        List<UserFile> userFiles = userFileRepository.getUserFilesByPage(userId, page, PAGE_SIZE);
        int totalFiles = userFileRepository.countUserFiles(userId);
        boolean hasMoreFiles = (page + 1) * PAGE_SIZE < totalFiles;

        List<UserFileDto> fileDtos = userFiles.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        log.info("Service: Returning {} files, hasMore: {}", fileDtos.size(), hasMoreFiles);

        return UserFilesResponseDto.builder()
                .files(fileDtos)
                .hasMoreFiles(hasMoreFiles)
                .currentPage(page)
                .totalFiles(totalFiles)
                .build();
    }

    private UserFileDto convertToDto(UserFile userFile) {
        FileOwner fileOwner = fileOwnerRepository.getFileOwnerByFileId(userFile.getId());
        String owner = "You";

        if (fileOwner != null) {
            log.debug("File ID: {}, Owner User ID: {}, Current User ID: {}",
                    userFile.getId(), fileOwner.getOwnerUserId(), userFile.getUserId());

            if (!Long.valueOf(userFile.getUserId()).equals(fileOwner.getOwnerUserId())) {
                String ownerName = userRepository.findUserNameById(fileOwner.getOwnerUserId().intValue());
                log.debug("Getting owner name for user ID: {}, Name: {}",
                        fileOwner.getOwnerUserId(), ownerName);

                if (ownerName != null && !ownerName.isEmpty()) {
                    owner = ownerName;
                }
            }
        } else {
            log.warn("No file owner record found for file ID: {}", userFile.getId());
        }

        return UserFileDto.builder()
                .id(userFile.getId())
                .fileName(userFile.getFileName())
                .fileSizeBytes(userFile.getFileSizeBytes())
                .contentType(userFile.getContentType())
                .createdAt(userFile.getCreatedAt())
                .owner(owner)
                .build();
    }

    private String formatFileSize(Long sizeInBytes) {
        if (sizeInBytes == null || sizeInBytes <= 0) return "0 B";

        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(sizeInBytes) / Math.log10(1024));

        digitGroups = Math.max(0, Math.min(digitGroups, units.length - 1));

        double size = sizeInBytes / Math.pow(1024, digitGroups);
        return String.format("%.1f %s", size, units[digitGroups]);
    }

    public void deleteFile(Long fileId, Integer userId) {
        log.info("Service: Deleting file with ID: {}, for user: {}", fileId, userId);

        UserFile userFile = userFileRepository.getUserFileById(fileId);
        if (userFile == null) {
            log.error("Service: File not found with ID: {}", fileId);
            throw new RuntimeException("File not found");
        }

        if (!userFile.getUserId().equals(userId)) {
            log.error("Service: File {} does not belong to user {}", fileId, userId);
            throw new RuntimeException("Unauthorized access to file");
        }

        if (userFile.getS3Key() != null && !userFile.getS3Key().equals("none")) {
            s3Service.deleteFile(userFile.getS3Key());
        }

        userFilesSecureRepository.deleteByFileId(fileId);
        fileOwnerRepository.deleteByFileId(fileId);

        userFileRepository.deleteFile(fileId);

        log.info("Service: File with ID: {} successfully deleted", fileId);
    }

    public byte[] downloadFile(Long fileId, Integer userId) {
        log.info("Service: Downloading file with ID: {}, for user: {}", fileId, userId);

        UserFile userFile = userFileRepository.getUserFileById(fileId);
        if (userFile == null) {
            log.error("Service: File not found with ID: {}", fileId);
            throw new RuntimeException("File not found");
        }

        if (!userFile.getUserId().equals(userId)) {
            log.error("Service: File {} does not belong to user {}", fileId, userId);
            throw new RuntimeException("Unauthorized access to file");
        }

        if (userFile.getS3Key() == null || userFile.getS3Key().equals("none")) {
            log.error("Service: S3 key not found for file ID: {}", fileId);
            throw new RuntimeException("File content not available");
        }

        byte[] encryptedContent = s3Service.downloadFile(userFile.getS3Key());

        log.info("Service: Downloaded encrypted file from S3: {}", userFile.getS3Key());

        return encryptedContent;
    }

    public Map<String, Object> getFileDetailsForDownload(Long fileId, Integer userId) {
        log.info("Service: Getting file details for download, fileId: {}, userId: {}", fileId, userId);

        UserFile userFile = userFileRepository.getUserFileById(fileId);
        if (userFile == null) {
            log.error("Service: File not found with ID: {}", fileId);
            throw new RuntimeException("File not found");
        }

        if (!userFile.getUserId().equals(userId)) {
            log.error("Service: File {} does not belong to user {}", fileId, userId);
            throw new RuntimeException("Unauthorized access to file");
        }

        UserFilesSecure secureDetails = userFilesSecureRepository.getSecureDetailsByFileId(fileId);
        if (secureDetails == null) {
            log.error("Service: Secure details not found for file ID: {}", fileId);
            throw new RuntimeException("Secure file details not available");
        }

        Map<String, Object> details = new HashMap<>();
        details.put("fileName", userFile.getFileName());
        details.put("fileSize", userFile.getFileSizeBytes());
        details.put("contentType", userFile.getContentType());
        details.put("wrappedKey", secureDetails.getWrappedKey());
        details.put("iv", secureDetails.getFileIv());
        details.put("tag", secureDetails.getFileTag());
        details.put("keyIv", secureDetails.getKeyIv());

        FileOwner fileOwner = fileOwnerRepository.getFileOwnerByFileId(fileId);
        if (fileOwner != null && !Long.valueOf(userId).equals(fileOwner.getOwnerUserId())) {
            Long ownerUserId = fileOwner.getOwnerUserId();
            log.info("Service: This is a transferred file. Looking up public key for owner userId: {}", ownerUserId);

            String ownerPublicKey = userService.findUserPublicKeyById(ownerUserId.intValue());
            if (ownerPublicKey != null) {
                details.put("senderPublicKeyHex", ownerPublicKey);
                log.info("Service: Included sender's public key in file details response");
            } else {
                log.warn("Service: Could not find public key for file owner userId: {}", ownerUserId);
            }
        }

        log.info("Service: Returning file details for download, fileId: {}", fileId);

        return details;
    }

    /**
     * Transfers a file from one user to another user
     *
     * @param fileId         The ID of the file to transfer
     * @param sourceUserId   The user ID of the current file owner
     * @param recipientEmail The email of the user to transfer the file to
     * @param newWrappedKey  The file key wrapped with the recipient's key
     * @param newKeyIv       The IV used for the newly wrapped key
     */
    public void transferFile(Long fileId, Integer sourceUserId, String recipientEmail,
                             String newWrappedKey, String newKeyIv) {
        log.info("Service: Transferring file ID: {} from user: {} to recipient: {}",
                fileId, sourceUserId, recipientEmail);

        UserFile userFile = userFileRepository.getUserFileById(fileId);
        if (userFile == null) {
            log.error("Service: File not found with ID: {}", fileId);
            throw new RuntimeException("File not found");
        }

        if (!userFile.getUserId().equals(sourceUserId)) {
            log.error("Service: File {} does not belong to user {}", fileId, sourceUserId);
            throw new RuntimeException("Unauthorized access to file");
        }

        Integer recipientUserId = userRepository.findUserIdByEmail(recipientEmail);
        if (recipientUserId == null) {
            log.error("Service: Recipient user not found with email: {}", recipientEmail);
            throw new RuntimeException("Recipient user not found");
        }

        UserFilesSecure secureDetails = userFilesSecureRepository.getSecureDetailsByFileId(fileId);
        if (secureDetails == null) {
            log.error("Service: Secure details not found for file ID: {}", fileId);
            throw new RuntimeException("Secure file details not available");
        }

        FileOwner originalFileOwner = fileOwnerRepository.getFileOwnerByFileId(fileId);
        Long originalOwnerId = (originalFileOwner != null) ?
                originalFileOwner.getOwnerUserId() : Long.valueOf(sourceUserId);

        log.info("Service: Original file owner ID: {}", originalOwnerId);

        try {
            UserFile newFile = UserFile.builder()
                    .userId(recipientUserId)
                    .fileName(userFile.getFileName())
                    .fileSizeBytes(userFile.getFileSizeBytes())
                    .contentType(userFile.getContentType())
                    .createdAt(LocalDateTime.now())
                    .s3Key(userFile.getS3Key())
                    .build();

            UserFile savedFile = userFileRepository.saveFileMetadata(newFile);

            UserFilesSecure newSecureDetails = UserFilesSecure.builder()
                    .fileId(savedFile.getId())
                    .userId(Long.valueOf(recipientUserId))
                    .wrappedKey(newWrappedKey)
                    .fileIv(secureDetails.getFileIv())
                    .fileTag(secureDetails.getFileTag())
                    .keyIv(newKeyIv)
                    .createdAt(LocalDateTime.now())
                    .build();

            userFilesSecureRepository.saveSecureDetails(newSecureDetails);

            FileOwner fileOwner = new FileOwner();
            fileOwner.setFileId(savedFile.getId());
            fileOwner.setOwnerUserId(originalOwnerId);
            FileOwner savedOwner = fileOwnerRepository.saveFileOwner(fileOwner);

            log.info("Service: File successfully transferred. New file ID: {}, File Owner: {}",
                    savedFile.getId(), savedOwner);
        } catch (Exception e) {
            log.error("Service: Error transferring file: {}", e.getMessage(), e);
            throw new RuntimeException("Error transferring file: " + e.getMessage());
        }
    }

    /**
     * Deletes all files belonging to a user
     *
     * @param userId The ID of the user whose files should be deleted
     */
    public void deleteAllUserFiles(Integer userId) {
        log.info("Service: Deleting all files for user: {}", userId);

        List<UserFile> userFiles = userFileRepository.getAllUserFiles(userId);
        log.info("Service: Found {} files to delete", userFiles.size());

        for (UserFile userFile : userFiles) {
            try {
                if (userFile.getS3Key() != null && !userFile.getS3Key().equals("none")) {
                    s3Service.deleteFile(userFile.getS3Key());
                    log.info("Service: Deleted file {} from S3", userFile.getS3Key());
                }

                userFilesSecureRepository.deleteByFileId(userFile.getId());
                fileOwnerRepository.deleteByFileId(userFile.getId());
                userFileRepository.deleteFile(userFile.getId());

                log.info("Service: Successfully deleted file with ID: {}", userFile.getId());
            } catch (Exception e) {
                log.error("Service: Error deleting file with ID: {}: {}", userFile.getId(), e.getMessage(), e);
            }
        }

        log.info("Service: Completed deletion of all files for user: {}", userId);
    }
}