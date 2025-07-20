package org.clouds.server.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.model.User;
import org.clouds.server.model.UserSecurity;
import org.clouds.server.repository.UserRepository;
import org.clouds.server.repository.UserSecurityRepository;
import org.clouds.server.repository.UserVerificationRepository;
import org.clouds.server.repository.UserSessionRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j(topic = "user.management")
@AllArgsConstructor
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final UserSecurityRepository userSecurityRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final UserSessionRepository userSessionRepository;

    /**
     * Retrieves all users from the repository
     *
     * @return List of all users in the system
     */
    public List<User> allUsers() {
        List<User> users = new ArrayList<>();
        userRepository.findAll().forEach(users::add);
        return users;
    }

    /**
     * Loads a user's details by their email address for Spring Security authentication.
     * This method is required by the UserDetailsService interface and is used during the authentication process.
     *
     * @param email The email address of the user to load
     * @return UserDetails object containing the user's authentication information
     * @throws UsernameNotFoundException if no user is found with the given email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return (UserDetails) userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    /**
     * Gets the user security information by email
     * 
     * @param email The email of the user
     * @return The UserSecurity object or null if not found
     */
    public UserSecurity getUserSecurityByEmail(String email) {
        log.info("Service: Getting user security by email: {}", email);
        
        try {
            Integer userId = userRepository.findUserIdByEmail(email);
            if (userId == null) {
                log.warn("Service: User not found with email: {}", email);
                return null;
            }
            
            return getUserSecurityByUserId(userId);
        } catch (Exception e) {
            log.error("Service: Error getting user security by email: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Gets the user security information by user ID
     * 
     * @param userId The ID of the user
     * @return The UserSecurity object or null if not found
     */
    public UserSecurity getUserSecurityByUserId(Integer userId) {
        log.info("Service: Getting user security by user ID: {}", userId);
        
        try {
            UserSecurity userSecurity = userSecurityRepository.getUserSecurityByUserId(userId);
            if (userSecurity == null) {
                log.warn("Service: Security information not found for user ID: {}", userId);
                return null;
            }
            
            return userSecurity;
        } catch (Exception e) {
            log.error("Service: Error getting user security by user ID: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Gets the user security information by name or username
     * 
     * @param name The name or username of the user
     * @return The UserSecurity object or null if not found
     */
    public UserSecurity getUserSecurityByName(String name) {
        log.info("Service: Getting user security by name: {}", name);
        
        try {
            Integer userId = userRepository.findUserIdByUsername(name);
            if (userId == null) {
                log.warn("Service: User not found with name: {}", name);
                return null;
            }
            
            return getUserSecurityByUserId(userId);
        } catch (Exception e) {
            log.error("Service: Error getting user security by name: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Find a user's public key by their ID
     * 
     * @param userId The user ID to search for
     * @return The user's public key, or null if no user or key was found
     */
    public String findUserPublicKeyById(Integer userId) {
        try {
            UserSecurity userSecurity = userSecurityRepository.getUserSecurityByUserId(userId);
            if (userSecurity == null) {
                log.warn("Service: Security information not found for user ID: {}", userId);
                return null;
            }
            
            return userSecurity.getPublicKey();
        } catch (Exception e) {
            log.error("Service: Error getting user public key by ID: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Gets a user by their ID
     * 
     * @param userId The ID of the user
     * @return Optional containing the User if found
     */
    public Optional<User> getUserById(Long userId) {
        log.info("Service: Getting user by ID: {}", userId);
        return userRepository.findById(userId);
    }

    /**
     * Deletes a user account and all associated data
     * 
     * @param userId The ID of the user to delete
     */
    @Transactional
    public void deleteUserAccount(Integer userId) {
        log.info("Service: Deleting user account with ID: {}", userId);
        
        Optional<User> userOpt = userRepository.findById(userId.longValue());
        if (userOpt.isEmpty()) {
            log.warn("Service: User not found with ID: {}", userId);
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        log.info("Service: Found user to delete: {}", user.getEmail());
        
        try {
            userSessionRepository.deleteAllByUserId(userId.longValue());
            log.info("Service: Deleted all sessions for user: {}", userId);
            
            userVerificationRepository.deleteById(userId.longValue());
            log.info("Service: Deleted verification data for user: {}", userId);
            
            userSecurityRepository.deleteById(userId.longValue());
            log.info("Service: Deleted security data for user: {}", userId);
            
            userRepository.delete(user);
            log.info("Service: Successfully deleted user with ID: {}", userId);
        } catch (Exception e) {
            log.error("Service: Error deleting user with ID: {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Error deleting user account: " + e.getMessage());
        }
    }
}
