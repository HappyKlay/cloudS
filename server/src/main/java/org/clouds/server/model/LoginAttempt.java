package org.clouds.server.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "login_attempts")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "ip_address", nullable = false)
    private String ipAddress;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "attempt_time", nullable = false)
    private Instant attemptTime;
    
    @Column(name = "is_blocked", nullable = false)
    private boolean blocked;
    
    @Column(name = "block_expires_at")
    private Instant blockExpiresAt;
} 