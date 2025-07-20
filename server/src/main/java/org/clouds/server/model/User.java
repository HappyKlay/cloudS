package org.clouds.server.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;


@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String surname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private Instant registrationDate;

    private Instant lastLoginDate;

    @Column(nullable = false)
    private Boolean isVerified = false;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    private String profileImageKey;

    @Column(nullable = false)
    private Long usedSpaceBytes;

    @Column(nullable = false)
    private Long limitSpaceBytes;

    private String signupIp;
    private String lastLoginIp;

    private LocalDateTime passwordChangedAt;

}
