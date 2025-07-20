package org.clouds.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.dto.responses.ApiResponse;
import org.clouds.server.dto.responses.PublicKeyResponseDto;
import org.clouds.server.dto.responses.UserProfileResponseDto;
import org.clouds.server.exception.UserNotFoundException;
import org.clouds.server.model.User;
import org.clouds.server.model.UserSecurity;
import org.clouds.server.service.AuthenticationService;
import org.clouds.server.service.FileService;
import org.clouds.server.service.SessionCookieService;
import org.clouds.server.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.Optional;

/**
 * REST controller for user-related operations including profile management,
 * public key retrieval, and account deletion.
 * 
 * @author Bohdan
 * @version 1.0
 */
@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j(topic = "user.controller")
@Validated
public class UserController {

    private static final DateTimeFormatter REGISTRATION_DATE_FORMAT = 
            DateTimeFormatter.ofPattern("MMMM yyyy").withZone(ZoneId.systemDefault());
    
    private static final String CURRENT_USER_IDENTIFIER = "You";
    
    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final FileService fileService;
    private final SessionCookieService sessionCookieService;

    /**
     * Retrieves the current user's profile information.
     * 
     * @param request HTTP servlet request for authentication
     * @return ResponseEntity containing user profile data
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getCurrentUserProfile(HttpServletRequest request) {
        log.info("Retrieving current user profile");
        
        Integer userId = authenticationService.authenticateUser(request);
        UserProfileResponseDto profile = buildUserProfile(userId);
        
        log.info("User profile retrieved successfully for userId: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Retrieves a user's public key by email address.
     * 
     * @param email The email address of the user
     * @return ResponseEntity containing the public key
     */
    @GetMapping("/public-key/email/{email}")
    public ResponseEntity<ApiResponse<PublicKeyResponseDto>> getUserPublicKey(@PathVariable String email) {
        log.info("Retrieving public key for email: {}", email);
        
        UserSecurity userSecurity = findUserSecurityByEmail(email);
        PublicKeyResponseDto publicKey = new PublicKeyResponseDto(userSecurity.getPublicKey());
        
        log.info("Public key retrieved successfully for email: {}", email);
        return ResponseEntity.ok(ApiResponse.success("Public key retrieved successfully", publicKey));
    }
    
    /**
     * Retrieves a user's public key by username or handles "You" for the current user.
     * 
     * @param name The username or "You" for the current user
     * @param request HTTP servlet request for authentication when needed
     * @return ResponseEntity containing the public key
     */
    @GetMapping("/public-key/name/{name}")
    public ResponseEntity<ApiResponse<PublicKeyResponseDto>> getUserPublicKeyByName(
            @PathVariable String name, 
            HttpServletRequest request) {
        
        log.info("Retrieving public key for name: {}", name);
        
        PublicKeyResponseDto publicKey = isCurrentUserRequest(name)
                ? getCurrentUserPublicKey(request)
                : getUserPublicKeyByUsername(name);
        
        log.info("Public key retrieved successfully for name: {}", name);
        return ResponseEntity.ok(ApiResponse.success("Public key retrieved successfully", publicKey));
    }
    
    /**
     * Deletes all files belonging to the current user.
     * 
     * @param request HTTP servlet request for authentication
     * @return ResponseEntity with a success message
     */
    @PostMapping("/delete-files")
    public ResponseEntity<ApiResponse<Void>> deleteUserFiles(HttpServletRequest request) {
        log.info("Deleting all user files");
        
        Integer userId = authenticationService.authenticateUser(request);
        fileService.deleteAllUserFiles(userId);
        
        log.info("All files deleted successfully for userId: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("All user files deleted successfully"));
    }
    
    /**
     * Deletes the current user's account and all associated data.
     * 
     * @param request HTTP servlet request for authentication
     * @param response HTTP servlet response for clearing session
     * @return ResponseEntity with a success message
     */
    @PostMapping("/delete-account")
    public ResponseEntity<ApiResponse<Void>> deleteUserAccount(
            HttpServletRequest request, 
            HttpServletResponse response) {
        
        log.info("Deleting user account");
        
        Integer userId = authenticationService.authenticateUser(request);
        userService.deleteUserAccount(userId);
        
        // Clear session after successful account deletion
        response.addCookie(sessionCookieService.clearSessionCookie());
        
        log.info("User account deleted successfully for userId: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully"));
    }
    
    /**
     * Builds a user profile DTO from user ID.
     * 
     * @param userId The user ID
     * @return UserProfileDto containing profile information
     */
    private UserProfileResponseDto buildUserProfile(Integer userId) {
        Optional<User> userOpt = userService.getUserById(userId.longValue());
        
        if (userOpt.isEmpty()) {
            throw new UserNotFoundException("User not found with ID: " + userId);
        }
        
        User user = userOpt.get();
        String formattedDate = formatRegistrationDate(user);
        
        return UserProfileResponseDto.builder()
                .username(user.getUsername())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .registrationDate(formattedDate)
                .build();
    }
    
    /**
     * Formats the user's registration date for display.
     * 
     * @param user The user entity
     * @return Formatted registration date string
     */
    private String formatRegistrationDate(User user) {
        if (user.getRegistrationDate() == null) {
            return "";
        }
        
        return REGISTRATION_DATE_FORMAT.format(user.getRegistrationDate());
    }
    
    /**
     * Finds user security information by email address.
     * 
     * @param email The email address
     * @return UserSecurity entity
     * @throws UserNotFoundException if user not found
     */
    private UserSecurity findUserSecurityByEmail(String email) {
        UserSecurity userSecurity = userService.getUserSecurityByEmail(email);
        
        if (userSecurity == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        
        return userSecurity;
    }
    
    /**
     * Checks if the request is for the current user.
     * 
     * @param name The name parameter
     * @return true if requesting current user's data
     */
    private boolean isCurrentUserRequest(String name) {
        return CURRENT_USER_IDENTIFIER.equalsIgnoreCase(name);
    }
    
    /**
     * Retrieves the current user's public key.
     * 
     * @param request HTTP servlet request for authentication
     * @return PublicKeyResponseDto containing the public key
     */
    private PublicKeyResponseDto getCurrentUserPublicKey(HttpServletRequest request) {
        Integer userId = authenticationService.authenticateUser(request);
        UserSecurity userSecurity = userService.getUserSecurityByUserId(userId);
        
        if (userSecurity == null) {
            throw new UserNotFoundException("User security information not found for user ID: " + userId);
        }
        
        return new PublicKeyResponseDto(userSecurity.getPublicKey());
    }
    
    /**
     * Retrieves a user's public key by username.
     * 
     * @param username The username
     * @return PublicKeyResponseDto containing the public key
     */
    private PublicKeyResponseDto getUserPublicKeyByUsername(String username) {
        UserSecurity userSecurity = userService.getUserSecurityByName(username);
        
        if (userSecurity == null) {
            throw new UserNotFoundException("User not found with username: " + username);
        }
        
        return new PublicKeyResponseDto(userSecurity.getPublicKey());
    }
}