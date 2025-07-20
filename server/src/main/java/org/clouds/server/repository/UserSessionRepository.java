package org.clouds.server.repository;

import org.clouds.server.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);

    @Query("SELECT s FROM UserSession s WHERE s.sessionId = :sessionId AND s.expiresAt > :now")
    Optional<UserSession> findActiveSessionBySessionId(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);

    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId AND s.expiresAt > :now")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
} 