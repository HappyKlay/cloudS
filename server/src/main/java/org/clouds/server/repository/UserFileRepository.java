package org.clouds.server.repository;

import lombok.extern.slf4j.Slf4j;
import org.clouds.server.model.UserFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;

@Repository
@Slf4j
public class UserFileRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<UserFile> userFileRowMapper = new RowMapper<UserFile>() {
        @Override
        public UserFile mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserFile.builder()
                    .id(rs.getLong("id"))
                    .userId(rs.getInt("user_id"))
                    .fileName(rs.getString("file_name"))
                    .fileSizeBytes(rs.getLong("file_size_bytes"))
                    .s3Key(rs.getString("s3_key"))
                    .contentType(rs.getString("content_type"))
                    .createdAt(rs.getObject("created_at", LocalDateTime.class))
                    .build();
        }
    };

    public UserFile saveFileMetadata(UserFile userFile) {
        log.info("Repository: Saving file metadata to database: {}", userFile);

        String sql = "INSERT INTO user_files (user_id, file_name, file_size_bytes, content_type, created_at, s3_key) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, userFile.getUserId());
            ps.setString(2, userFile.getFileName());
            ps.setLong(3, userFile.getFileSizeBytes());
            ps.setString(4, userFile.getContentType());
            ps.setObject(5, LocalDateTime.now());
            ps.setString(6, userFile.getS3Key());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKeys().get("id") != null ?
                ((Number) keyHolder.getKeys().get("id")).longValue() : null;

        if (id == null) {
            log.error("Repository: Failed to get generated ID for file: {}", userFile.getFileName());
            throw new RuntimeException("Failed to get generated ID for file");
        }

        userFile.setId(id);
        log.info("Repository: File metadata saved successfully with ID: {}", id);

        return userFile;
    }

    public UserFile getUserFileById(Long fileId) {
        log.info("Repository: Fetching file with ID: {}", fileId);

        String sql = "SELECT * FROM user_files WHERE id = ?";

        try {
            return jdbcTemplate.queryForObject(sql, userFileRowMapper, fileId);
        } catch (Exception e) {
            log.error("Repository: Error fetching file with ID {}: {}", fileId, e.getMessage());
            return null;
        }
    }

    public void updateUserFile(UserFile userFile) {
        log.info("Repository: Updating file metadata for ID: {}", userFile.getId());

        String sql = "UPDATE user_files SET s3_key = ? WHERE id = ?";

        int updatedRows = jdbcTemplate.update(sql,
                userFile.getS3Key(),
                userFile.getId());

        if (updatedRows == 0) {
            log.error("Repository: No rows updated for file ID: {}", userFile.getId());
            throw new RuntimeException("Failed to update file metadata");
        }

        log.info("Repository: File metadata updated successfully for ID: {}", userFile.getId());
    }

    public List<UserFile> getUserFilesByPage(Integer userId, int page, int pageSize) {
        log.info("Repository: Fetching files for user {} (page: {}, size: {})", userId, page, pageSize);

        int offset = page * pageSize;
        String sql = "SELECT * FROM user_files WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";

        List<UserFile> files = jdbcTemplate.query(
                sql,
                new Object[]{userId, pageSize, offset},
                userFileRowMapper
        );

        log.info("Repository: Found {} files for user {}", files.size(), userId);
        return files;
    }

    public int countUserFiles(Integer userId) {
        String sql = "SELECT COUNT(*) FROM user_files WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
        return count != null ? count : 0;
    }

    public void deleteFile(Long fileId) {
        log.info("Repository: Deleting file with ID: {}", fileId);

        String sql = "DELETE FROM user_files WHERE id = ?";

        int rowsAffected = jdbcTemplate.update(sql, fileId);

        if (rowsAffected == 0) {
            log.error("Repository: No file found to delete with ID: {}", fileId);
            throw new RuntimeException("File not found for deletion");
        }

        log.info("Repository: Successfully deleted file with ID: {}", fileId);
    }

    public List<UserFile> getAllUserFiles(Integer userId) {
        String sql = "SELECT * FROM user_files WHERE user_id = ?";
        return jdbcTemplate.query(sql, userFileRowMapper, userId);
    }
}
