package org.clouds.server.model;

import jakarta.persistence.*;
import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "user_security")
@Getter
@Setter
public class UserSecurity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String salt;

    @Column(nullable = false)
    private String saltAuthentication;

    @Column(nullable = false)
    private String saltEncryption;

    @Column(nullable = false)
    private String saltMk;

    @Column(nullable = false)
    private String publicKey;

    @Column(nullable = false)
    private String encryptedMasterKey;

    @Column(nullable = false)
    private String encryptedMasterKeyIv;

    @Column(nullable = false)
    private String hashedAuthenticationKey;

    @Column(nullable = false)
    private String encryptedPrivateKey;

    @Column(nullable = false)
    private String encryptedPrivateKeyIv;

    @Column(nullable = false)
    private String encryptedPrivateKeySalt;

    private Boolean mfaEnabled = false;

    private String mfaSecret;

}

