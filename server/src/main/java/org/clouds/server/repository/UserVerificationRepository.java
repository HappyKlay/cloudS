package org.clouds.server.repository;

import org.clouds.server.model.UserVerification;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserVerificationRepository extends CrudRepository<UserVerification, Long> {

    Optional<UserVerification> findByVerificationCode(String verificationCode);
} 