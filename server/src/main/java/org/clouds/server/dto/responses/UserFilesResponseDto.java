package org.clouds.server.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.clouds.server.dto.UserFileDto;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFilesResponseDto {
    private List<UserFileDto> files;
    private boolean hasMoreFiles;
    private int currentPage;
    private int totalFiles;
} 