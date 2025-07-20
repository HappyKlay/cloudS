package org.clouds.server.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_files_secure", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFilesSecure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long fileId;
    private String wrappedKey;
    private String fileIv;
    private String fileTag;
    private String keyIv;
    private LocalDateTime createdAt;
}

