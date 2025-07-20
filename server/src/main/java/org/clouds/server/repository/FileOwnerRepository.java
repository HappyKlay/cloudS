package org.clouds.server.repository;

import org.clouds.server.model.FileOwner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
public class FileOwnerRepository {
    
    private static final Logger logger = LoggerFactory.getLogger(FileOwnerRepository.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public FileOwner saveFileOwner(FileOwner fileOwner) {
        try {
            String sql = "INSERT INTO file_owner (owner_user_id, file_id) VALUES (?, ?) RETURNING id";
            
            Long generatedId = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                fileOwner.getOwnerUserId(),
                fileOwner.getFileId()
            );
            
            if (generatedId != null) {
                fileOwner.setId(generatedId);
            }
            
            logger.info("Repository: Successfully saved file owner: {}", fileOwner);
            
            return fileOwner;
        } catch (DataAccessException e) {
            logger.error("Repository: Error saving file owner: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    public FileOwner getFileOwnerByFileId(Long fileId) {
        String sql = "SELECT * FROM file_owner WHERE file_id = ?";
        
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                FileOwner fileOwner = new FileOwner();
                fileOwner.setId(rs.getLong("id"));
                fileOwner.setOwnerUserId(rs.getLong("owner_user_id"));
                fileOwner.setFileId(rs.getLong("file_id"));
                return fileOwner;
            }, fileId);
        } catch (Exception e) {
            logger.debug("Repository: No file owner found for fileId: {}", fileId);
            return null;
        }
    }
    
    public void deleteByFileId(Long fileId) {
        String sql = "DELETE FROM file_owner WHERE file_id = ?";
        try {
            int rowsAffected = jdbcTemplate.update(sql, fileId);
            logger.info("Repository: Deleted {} file owner records for fileId: {}", rowsAffected, fileId);
        } catch (Exception e) {
            logger.error("Repository: Error deleting file owner for fileId: {}", fileId, e);
            throw e;
        }
    }
} 