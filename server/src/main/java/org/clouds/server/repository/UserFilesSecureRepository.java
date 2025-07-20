package org.clouds.server.repository;

import org.clouds.server.model.UserFilesSecure;
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
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Repository
public class UserFilesSecureRepository {
    private static final Logger logger = LoggerFactory.getLogger(UserFilesSecureRepository.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public UserFilesSecure saveSecureDetails(UserFilesSecure secureDetails) {
        logger.info("Repository: Saving secure file details for fileId: {}", secureDetails.getFileId());
        
        String sql = "INSERT INTO user_files_secure (user_id, file_id, wrapped_key, file_iv, file_tag, key_iv, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, secureDetails.getUserId());
            ps.setLong(2, secureDetails.getFileId());
            ps.setString(3, secureDetails.getWrappedKey());
            ps.setString(4, secureDetails.getFileIv());
            ps.setString(5, secureDetails.getFileTag());
            ps.setString(6, secureDetails.getKeyIv());
            ps.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
            return ps;
        }, keyHolder);
        
        Long id = keyHolder.getKeys().get("id") != null ? 
                ((Number) keyHolder.getKeys().get("id")).longValue() : null;
        
        if (id == null) {
            logger.error("Repository: Failed to get generated ID for secure file details");
            throw new RuntimeException("Failed to get generated ID for secure file details");
        }
        
        secureDetails.setId(id);
        logger.info("Repository: Secure file details saved successfully with ID: {}", id);
        
        return secureDetails;
    }

    public UserFilesSecure getSecureDetailsByFileId(Long fileId) {
        logger.info("Repository: Fetching secure details for fileId: {}", fileId);
        
        String sql = "SELECT * FROM user_files_secure WHERE file_id = ?";
        
        try {
            return jdbcTemplate.queryForObject(sql, new UserFilesSecureRowMapper(), fileId);
        } catch (Exception e) {
            logger.error("Repository: Error fetching secure details for fileId {}: {}", fileId, e.getMessage());
            return null;
        }
    }

    public void deleteByFileId(Long fileId) {
        logger.info("Repository: Deleting secure file details for fileId: {}", fileId);
        
        String sql = "DELETE FROM user_files_secure WHERE file_id = ?";
        
        int rowsAffected = jdbcTemplate.update(sql, fileId);
        
        logger.info("Repository: Deleted {} rows from user_files_secure for fileId: {}", rowsAffected, fileId);
    }
    
    private static final class UserFilesSecureRowMapper implements RowMapper<UserFilesSecure> {
        @Override
        public UserFilesSecure mapRow(ResultSet rs, int rowNum) throws SQLException {
            return UserFilesSecure.builder()
                .id(rs.getLong("id"))
                .userId(rs.getLong("user_id"))
                .fileId(rs.getLong("file_id"))
                .wrappedKey(rs.getString("wrapped_key"))
                .fileIv(rs.getString("file_iv"))
                .fileTag(rs.getString("file_tag"))
                .keyIv(rs.getString("key_iv"))
                .createdAt(rs.getObject("created_at", LocalDateTime.class))
                .build();
        }
    }
} 