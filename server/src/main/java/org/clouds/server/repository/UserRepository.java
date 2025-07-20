package org.clouds.server.repository;

import org.clouds.server.model.User;
import org.clouds.server.repository.UserSecurityRepository;
import org.clouds.server.model.UserSecurity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends CrudRepository<User, Long> {
    Logger logger = LoggerFactory.getLogger(UserRepository.class);

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    default Integer findUserIdByEmail(String email) {
        Optional<User> user = findByEmail(email);
        return user.map(u -> u.getId().intValue()).orElse(null);
    }
    
    default Integer findUserIdByUsername(String username) {
        Optional<User> user = findByUsername(username);
        return user.map(u -> u.getId().intValue()).orElse(null);
    }
    
    default String findUserNameById(Integer userId) {
        logger.debug("Finding user name for ID: {}", userId);
        Optional<User> user = findById(Long.valueOf(userId));
        
        if (user.isPresent()) {
            String fullName = user.get().getName() + " " + user.get().getSurname();
            logger.debug("Found user: {}, name: {}, surname: {}, fullName: {}", 
                user.get().getId(), user.get().getName(), user.get().getSurname(), fullName);
            return fullName;
        } else {
            logger.warn("No user found with ID: {}", userId);
            return null;
        }
    }
    
    default String findUserPublicKeyById(Integer userId) {
        logger.warn("findUserPublicKeyById is not implemented directly in UserRepository interface");
        return null;
    }
}
