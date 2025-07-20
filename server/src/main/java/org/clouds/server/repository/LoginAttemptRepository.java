package org.clouds.server.repository;

import org.clouds.server.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("SELECT l FROM LoginAttempt l WHERE l.ipAddress = :ipAddress AND l.attemptTime > :startTime")
    List<LoginAttempt> findRecentAttemptsByIpAddress(@Param("ipAddress") String ipAddress, @Param("startTime") Instant startTime);


    @Query("SELECT l FROM LoginAttempt l WHERE l.email = :email AND l.attemptTime > :startTime")
    List<LoginAttempt> findRecentAttemptsByEmail(@Param("email") String email, @Param("startTime") Instant startTime);


    @Query("SELECT l FROM LoginAttempt l WHERE l.ipAddress = :ipAddress AND l.blocked = true AND l.blockExpiresAt > :now")
    List<LoginAttempt> findActiveBlocksByIpAddress(@Param("ipAddress") String ipAddress, @Param("now") Instant now);


    @Query("SELECT l FROM LoginAttempt l WHERE l.email = :email AND l.blocked = true AND l.blockExpiresAt > :now")
    List<LoginAttempt> findActiveBlocksByEmail(@Param("email") String email, @Param("now") Instant now);
} 