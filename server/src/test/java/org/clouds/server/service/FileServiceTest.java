package org.clouds.server.service;

import org.clouds.server.model.FileOwner;
import org.clouds.server.model.UserFile;
import org.clouds.server.dto.request.FileUploadRequestDto;
import org.clouds.server.dto.responses.FileUploadResponseDto;
import org.clouds.server.repository.FileOwnerRepository;
import org.clouds.server.repository.UserFileRepository;
import org.clouds.server.repository.UserFilesSecureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FileServiceTest {

    @Mock
    private UserFileRepository userFileRepository;
    
    @Mock
    private UserFilesSecureRepository userFilesSecureRepository;
    
    @Mock
    private FileOwnerRepository fileOwnerRepository;
    
    @Mock
    private S3Service s3Service;
    
    @InjectMocks
    private FileService fileService;
    
    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }
    
    @Test
    public void testSaveFileMetadata_shouldSaveFileOwner() {
        Integer userId = 1;
        Long fileId = 1L;
        
        FileUploadRequestDto requestDto = new FileUploadRequestDto();
        requestDto.setFileName("test-file.txt");
        requestDto.setFileSizeBytes(1024L);
        requestDto.setContentType("text/plain");
        
        UserFile savedFile = new UserFile();
        savedFile.setId(fileId);
        savedFile.setUserId(userId);
        savedFile.setFileName(requestDto.getFileName());
        savedFile.setFileSizeBytes(requestDto.getFileSizeBytes());
        savedFile.setContentType(requestDto.getContentType());
        
        when(userFileRepository.saveFileMetadata(any(UserFile.class))).thenReturn(savedFile);
        
        ArgumentCaptor<FileOwner> fileOwnerCaptor = ArgumentCaptor.forClass(FileOwner.class);
        when(fileOwnerRepository.saveFileOwner(fileOwnerCaptor.capture())).thenReturn(new FileOwner());
        
        // When
        FileUploadResponseDto response = fileService.saveFileMetadata(requestDto, userId);
        
        // Then
        assertTrue(response.isSuccess());
        assertEquals(fileId, response.getFileId());
        assertEquals(requestDto.getFileName(), response.getFileName());
        
        // Verify file owner was saved
        verify(fileOwnerRepository, times(1)).saveFileOwner(any(FileOwner.class));
        
        // Verify correct values were saved
        FileOwner capturedFileOwner = fileOwnerCaptor.getValue();
        assertEquals(fileId, capturedFileOwner.getFileId());
        assertEquals(Long.valueOf(userId), capturedFileOwner.getOwnerUserId());
    }
    
    @Test
    public void testDeleteFile_shouldDeleteFileOwner() {
        // Given
        Integer userId = 1;
        Long fileId = 1L;
        
        UserFile userFile = new UserFile();
        userFile.setId(fileId);
        userFile.setUserId(userId);
        userFile.setS3Key("test-key");
        
        when(userFileRepository.getUserFileById(fileId)).thenReturn(userFile);
        
        // When
        fileService.deleteFile(fileId, userId);
        
        // Then
        verify(fileOwnerRepository, times(1)).deleteByFileId(fileId);
        verify(userFilesSecureRepository, times(1)).deleteByFileId(fileId);
        verify(userFileRepository, times(1)).deleteFile(fileId);
        verify(s3Service, times(1)).deleteFile(userFile.getS3Key());
    }
} 