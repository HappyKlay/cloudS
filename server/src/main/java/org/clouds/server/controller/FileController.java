package org.clouds.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.dto.request.FileUploadRequestDto;
import org.clouds.server.dto.responses.ApiResponse;
import org.clouds.server.dto.responses.FileUploadResponseDto;
import org.clouds.server.dto.responses.UserFilesResponseDto;
import org.clouds.server.dto.request.FileTransferRequestDto;
import org.clouds.server.exception.FileOperationException;
import org.clouds.server.service.AuthenticationService;
import org.clouds.server.service.FileService;
import org.clouds.server.service.SessionCookieService;
import org.hibernate.mapping.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * REST controller for file operations including upload, download, deletion, and transfer.
 * Handles encrypted file content and metadata with proper authentication and authorization.
 *
 * @author Bohdan
 * @version 1.0
 */
@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@AllArgsConstructor
@Slf4j(topic = "file.controller")
@Validated
public class FileController {

    private static final String FILE_CONTENT_UPLOADED_SUCCESS = "File content uploaded successfully";
    private static final String FILE_DELETED_SUCCESS = "File deleted successfully";
    private static final String FILE_TRANSFERRED_SUCCESS = "File transferred successfully";

    private final FileService fileService;
    private final AuthenticationService authenticationService;
    @Getter
    private final SessionCookieService sessionCookieService;

    /**
     * Uploads file metadata to the system.
     *
     * @param requestDto The file upload request containing metadata
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity containing the file upload response with file ID or error
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponseDto> uploadFile(
            @Valid @RequestBody FileUploadRequestDto requestDto,
            HttpServletRequest request) {

        log.info("Received file upload request for file: {}", requestDto.getFileName());

        Integer userId = authenticationService.authenticateUser(request);
        FileUploadResponseDto response = fileService.saveFileMetadata(requestDto, userId);

        log.info("File metadata saved successfully for user {}: {}", userId, response);
        return ResponseEntity.ok(response);
    }

    /**
     * Uploads encrypted file content for a specific file ID.
     *
     * @param fileId The ID of the file to upload content for
     * @param encryptedContent The encrypted file content as a multipart file
     * @param encryptedKey The encrypted symmetric key
     * @param iv Initialization vector for content encryption
     * @param keyIv Initialization vector for key encryption
     * @param tag Authentication tag for content verification
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity with a success message or error
     */
    @PostMapping("/upload/content/{fileId}")
    public ResponseEntity<ApiResponse<Void>> uploadFileContent(
            @PathVariable Long fileId,
            @RequestParam("encryptedContent") MultipartFile encryptedContent,
            @RequestParam("encryptedKey") String encryptedKey,
            @RequestParam("iv") String iv,
            @RequestParam("keyIv") String keyIv,
            @RequestParam("tag") String tag,
            HttpServletRequest request) {

        log.info("Received file content upload request for fileId: {}", fileId);

        Integer userId = authenticationService.authenticateUser(request);

        try {
            byte[] fileContent = encryptedContent.getBytes();
            fileService.saveFileContent(fileId, userId, fileContent, encryptedKey, iv, tag, keyIv);

            log.info("File content uploaded successfully for fileId: {} by user: {}", fileId, userId);
            return ResponseEntity.ok(ApiResponse.success(FILE_CONTENT_UPLOADED_SUCCESS));

        } catch (IOException e) {
            log.error("Error reading file content for fileId: {}", fileId, e);
            throw new FileOperationException("Failed to read file content", e);
        }
    }

    /**
     * Retrieves paginated list of user's files.
     *
     * @param request HTTP servlet request for session validation
     * @param page Page number for pagination (0-based)
     * @return ResponseEntity containing user files or error
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserFilesResponseDto>> getUserFiles(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page) {

        log.info("Received request to get user files, page: {}", page);

        Integer userId = authenticationService.authenticateUser(request);
        UserFilesResponseDto response = fileService.getUserFiles(userId, page);

        log.info("Returning {} files for user {}, page: {}",
                response.getFiles().size(), userId, page);

        return ResponseEntity.ok(ApiResponse.success("Files retrieved successfully", response));
    }

    /**
     * Retrieves detailed information about a specific file.
     *
     * @param fileId The ID of the file to get details for
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity containing file details or error
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<ApiResponse<Map>> getFileDetails(
            @PathVariable Long fileId,
            HttpServletRequest request) {

        log.info("Received request to get file details for fileId: {}", fileId);

        Integer userId = authenticationService.authenticateUser(request);
        Map fileDetails = (Map) fileService.getFileDetailsForDownload(fileId, userId);

        log.info("File details retrieved successfully for fileId: {} by user: {}", fileId, userId);
        return ResponseEntity.ok(ApiResponse.success("File details retrieved successfully", fileDetails));
    }

    /**
     * Deletes a specific file from the system.
     *
     * @param fileId The ID of the file to delete
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity with a success message or error
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long fileId,
            HttpServletRequest request) {

        log.info("Received request to delete file with ID: {}", fileId);

        Integer userId = authenticationService.authenticateUser(request);
        fileService.deleteFile(fileId, userId);

        log.info("File deleted successfully: fileId={} by user={}", fileId, userId);
        return ResponseEntity.ok(ApiResponse.success(FILE_DELETED_SUCCESS));
    }

    /**
     * Downloads encrypted file content.
     *
     * @param fileId The ID of the file to download
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity containing file content as byte array or error
     */
    @GetMapping("/{fileId}/content")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long fileId,
            HttpServletRequest request) {

        log.info("Received request to download file with ID: {}", fileId);

        Integer userId = authenticationService.authenticateUser(request);
        byte[] fileContent = fileService.downloadFile(fileId, userId);

        log.info("File downloaded successfully: fileId={} by user={}", fileId, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(fileContent);
    }

    /**
     * Transfers a file from one user to another.
     *
     * @param requestDto The file transfer request containing recipient and encryption details
     * @param request HTTP servlet request for session validation
     * @return ResponseEntity with a success message or error
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> transferFile(
            @Valid @RequestBody FileTransferRequestDto requestDto,
            HttpServletRequest request) {

        log.info("Received file transfer request for fileId: {} to recipient: {}",
                requestDto.getFileId(), requestDto.getRecipientEmail());

        Integer userId = authenticationService.authenticateUser(request);

        fileService.transferFile(
                requestDto.getFileId(),
                userId,
                requestDto.getRecipientEmail(),
                requestDto.getNewWrappedKey(),
                requestDto.getNewKeyIv()
        );

        log.info("File transferred successfully: fileId={} from user={} to recipient={}",
                requestDto.getFileId(), userId, requestDto.getRecipientEmail());

        return ResponseEntity.ok(ApiResponse.success(FILE_TRANSFERRED_SUCCESS));
    }

}
