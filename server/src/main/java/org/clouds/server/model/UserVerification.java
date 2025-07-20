package org.clouds.server.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Builder
@NoArgsConstructor
@Entity
@Table(name = "user_verification")
@Getter
@Setter
@AllArgsConstructor
public class UserVerification {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String verificationCode;

    private Instant verificationCodeExpiresAt;

    @Column(nullable = false)
    private Boolean isVerified = false;

}