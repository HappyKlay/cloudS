package org.clouds.server.service;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.dto.responses.LoginSaltsAndPrivateKeyResponseDto;
import org.clouds.server.exception.InvalidRegistrationDataException;
import org.clouds.server.exception.UnauthorizedException;
import org.clouds.server.exception.UserAlreadyExistsException;
import org.clouds.server.model.Role;
import org.clouds.server.model.User;
import org.clouds.server.model.UserSecurity;
import org.clouds.server.model.UserVerification;
import org.clouds.server.model.LoginAttempt;
import org.clouds.server.model.UserSession;
import org.clouds.server.dto.request.LoginUserFirstAttemptRequestDto;
import org.clouds.server.dto.responses.LoginInitResponseDto;
import org.clouds.server.dto.request.RegistrationRequestDto;
import org.clouds.server.repository.UserRepository;
import org.clouds.server.repository.UserSecurityRepository;
import org.clouds.server.repository.UserVerificationRepository;
import org.clouds.server.repository.LoginAttemptRepository;
import org.clouds.server.repository.UserSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j(topic = "authentication.security")
public class AuthenticationService {
    private final UserRepository userRepository;
    private final UserSecurityRepository userSecurityRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserSessionRepository userSessionRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final SessionCookieService sessionCookieService;
    
    private static final int MAX_LOGIN_ATTEMPTS = 15;
    private static final long BLOCK_DURATION_SECONDS = 1800; // 30 minutes
    private static final long ATTEMPT_WINDOW_SECONDS = 3600; // 1 hour
    private static final long SESSION_DURATION_SECONDS = 86400; // 24 hours

    @Transactional
    public void signup(RegistrationRequestDto input) throws UserAlreadyExistsException, InvalidRegistrationDataException {
        if (userRepository.findByEmail(input.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("Email is already in use");
        }
        
        if (userRepository.findByUsername(input.getUsername()).isPresent()) {
            throw new UserAlreadyExistsException("Username is already in use");
        }

        User user = createUser(input);
        user = userRepository.save(user);

        UserSecurity userSecurity = createUserSecurity(input, user);
        userSecurityRepository.save(userSecurity);

        UserVerification verification = generateUserVerification(user);
        userVerificationRepository.save(verification);

        sendVerificationEmail(user, verification.getVerificationCode());
    }

    private UserVerification generateUserVerification(User user) {
        UserVerification verification;
        try {
            verification = UserVerification.builder()
                    .user(user)
                    .verificationCode(generateSecureToken())
                    .verificationCodeExpiresAt(Instant.now().plusSeconds(86400))
                    .isVerified(false)
                    .build();


        } catch (Exception e) {
            throw new InvalidRegistrationDataException("Error creating user verification");
        }
        return verification;
    }

    private static UserSecurity createUserSecurity(RegistrationRequestDto input, User user) {
        UserSecurity userSecurity;
        try {
            userSecurity = UserSecurity.builder()
                    .user(user)
                    .salt(input.getSalt())
                    .saltAuthentication(input.getAuthSalt())
                    .saltEncryption(input.getEncSalt())
                    .saltMk(input.getEncMKSalt())
                    .publicKey(input.getPublicKey())
                    .hashedAuthenticationKey(input.getHashedAuthenticationKey())
                    .encryptedMasterKey(input.getEncryptedMasterKey())
                    .encryptedMasterKeyIv(input.getEncryptedMasterKeyIv())
                    .encryptedPrivateKey(input.getEncryptedPrivateKey())
                    .encryptedPrivateKeyIv(input.getEncryptedPrivateKeyIv())
                    .encryptedPrivateKeySalt(input.getEncryptedPrivateKeySalt())
                    .mfaEnabled(false)
                    .build();

        } catch (Exception e) {
            throw new InvalidRegistrationDataException("Invalid User's security data");
        }
        return userSecurity;
    }

    private User createUser(RegistrationRequestDto input) {
        User user;
        try {
            user = User.builder()
                    .name(input.getName())
                    .surname(input.getSurname())
                    .email(input.getEmail())
                    .username(input.getUsername())
                    .registrationDate(Instant.now())
                    .signupIp(input.getIp())
                    .role(Role.user)
                    .isVerified(false)
                    .usedSpaceBytes(0L)
                    .limitSpaceBytes(100L * 1024 * 1024) // 100MB
                    .build();
        } catch (Exception e) {
            throw new InvalidRegistrationDataException("Invalid User's data");
        }
        return user;
    }

    public User checkEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User authenticate(LoginUserFirstAttemptRequestDto input) {
        Optional<User> userOptional = userRepository.findByEmail(input.getEmail());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        return userOptional.get();
    }

    /**
     * Generates a secure random token (128 bits) for email verification
     * Uses SecureRandom to ensure cryptographic randomness
     */
    private String generateSecureToken() {
        byte[] randomBytes = new byte[16]; // 128 bits
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
    
    /**
     * Verifies a user's email using the provided verification code
     * @param email The user's email
     * @param verificationCode The verification code to validate
     * @return true if verification was successful, false otherwise
     */
    @Transactional
    public boolean verifyUser(String email, String verificationCode) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return false;
        }
        
        User user = optionalUser.get();
        Optional<UserVerification> optionalVerification = userVerificationRepository.findById(user.getId());
        
        if (optionalVerification.isEmpty()) {
            return false;
        }
        
        UserVerification verification = optionalVerification.get();
        
        if (verification.getVerificationCodeExpiresAt().isBefore(Instant.now())) {
            return false;
        }
        
        if (!verification.getVerificationCode().equals(verificationCode)) {
            return false;
        }
        
        verification.setIsVerified(true);
        verification.setVerificationCode(null);
        verification.setVerificationCodeExpiresAt(null);
        userVerificationRepository.save(verification);
        
        user.setIsVerified(true);
        userRepository.save(user);
        
        return true;
    }
    
    /**
     * Resends a verification email with a new verification code
     * @param email The user's email
     */
    @Transactional
    public void resendVerificationCode(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = optionalUser.get();
        Optional<UserVerification> optionalVerification = userVerificationRepository.findById(user.getId());
        
        if (optionalVerification.isEmpty()) {
            throw new RuntimeException("Verification record not found");
        }
        
        UserVerification verification = optionalVerification.get();
        
        if (verification.getIsVerified()) {
            throw new RuntimeException("Account is already verified");
        }
        
        verification.setVerificationCode(generateSecureToken());
        verification.setVerificationCodeExpiresAt(Instant.now().plusSeconds(86400)); // 24 hours
        userVerificationRepository.save(verification);
        
        sendVerificationEmail(user, verification.getVerificationCode());
    }
    
    /**
     * Sends a verification email with the verification link
     * @param user The user to send the email to
     * @param verificationCode The verification code to include in the email
     */
    private void sendVerificationEmail(User user, String verificationCode) {
        String verificationLink = "http://localhost:8080/api/auth/confirm/" + verificationCode + "?email=" + user.getEmail();
        String subject = "CloudS - Verify Your Email";
        
        StringBuilder htmlContent = new StringBuilder();
        htmlContent.append("<html><body>");
        htmlContent.append("<h2>Welcome to CloudS, ").append(user.getName()).append("!</h2>");
        htmlContent.append("<p>Thank you for registering. Please click the link below to verify your email address:</p>");
        htmlContent.append("<p><a href=\"").append(verificationLink).append("\">Verify My Email</a></p>");
        htmlContent.append("<p>This link will expire in 24 hours.</p>");
        htmlContent.append("<p>If you did not create an account, please ignore this email.</p>");
        htmlContent.append("<p>Best regards,<br/>The CloudS Team</p>");
        htmlContent.append("</body></html>");
        
        try {
            emailService.sendVerificationEmail(user.getEmail(), subject, htmlContent.toString());
        } catch (MessagingException e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
    }

    /**
     * Verifies a user by verification code only
     * @param verificationCode The verification code to validate
     * @return true if verification was successful, false otherwise
     */
    @Transactional
    public boolean verifyUserByCode(String verificationCode) {
        Optional<UserVerification> optionalVerification = userVerificationRepository.findByVerificationCode(verificationCode);
        
        if (optionalVerification.isEmpty()) {
            return false;
        }
        
        UserVerification verification = optionalVerification.get();
        
        if (verification.getVerificationCodeExpiresAt().isBefore(Instant.now())) {
            return false;
        }
        
        User user = verification.getUser();
        
        verification.setIsVerified(true);
        verification.setVerificationCode(null);
        verification.setVerificationCodeExpiresAt(null);
        userVerificationRepository.save(verification);
        
        user.setIsVerified(true);
        userRepository.save(user);
        
        return true;
    }

    /**
     * Initializes login process by checking if the email exists and returning appropriate salts
     * Includes anti-enumeration protection
     * 
     * @param email The user's email
     * @param ipAddress The client's IP address
     * @return LoginInitResponseDto with appropriate values
     */
    @Transactional
    public LoginInitResponseDto initializeLogin(String email, String ipAddress) {
        if (isBlocked(email, ipAddress)) {
            return LoginInitResponseDto.builder()
                    .success(false)
                    .message("Too many failed attempts. Try again in 30 minutes.")
                    .build();
        }
        
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        recordLoginAttempt(email, ipAddress, userOptional.isEmpty());
        
        if (userOptional.isEmpty()) {
            return generateFakeLoginResponse();
        }
        
        User user = userOptional.get();
        Optional<UserSecurity> securityOptional = userSecurityRepository.findById(user.getId());
        
        if (securityOptional.isEmpty()) {
            return generateFakeLoginResponse();
        }
        
        UserSecurity security = securityOptional.get();
        
        return LoginInitResponseDto.builder()
                .success(true)
                .salt(security.getSalt())
                .authSalt(security.getSaltAuthentication())
                .build();
    }
    
    /**
     * Generates a fake login response with random values to prevent email enumeration
     * 
     * @return LoginInitResponseDto with random values
     */
    private LoginInitResponseDto generateFakeLoginResponse() {
        return LoginInitResponseDto.builder()
                .success(true)
                .salt(generateRandomHexString(32))
                .authSalt(generateRandomHexString(32))
                .message("No account found for that email.")
                .build();
    }
    
    /**
     * Generates a random hex string of specified length
     * 
     * @param length The length of the hex string to generate
     * @return Random hex string
     */
    private String generateRandomHexString(int length) {
        byte[] randomBytes = new byte[length / 2];
        secureRandom.nextBytes(randomBytes);
        return bytesToHex(randomBytes);
    }
    
    /**
     * Converts bytes to hex string
     * 
     * @param bytes Byte array to convert
     * @return Hex string representation
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
    
    /**
     * Records a login attempt and manages blocking
     * 
     * @param email The email used in the attempt
     * @param ipAddress The IP address of the client
     * @param failed Whether the attempt failed (email not found)
     */
    private void recordLoginAttempt(String email, String ipAddress, boolean failed) {
        Instant now = Instant.now();
        
        if (failed) {
            LoginAttempt attempt = LoginAttempt.builder()
                    .email(email)
                    .ipAddress(ipAddress)
                    .attemptTime(now)
                    .blocked(false)
                    .build();
            
            loginAttemptRepository.save(attempt);
            
            Instant windowStart = now.minusSeconds(ATTEMPT_WINDOW_SECONDS);
            
            List<LoginAttempt> ipAttempts = loginAttemptRepository.findRecentAttemptsByIpAddress(ipAddress, windowStart);
            if (ipAttempts.size() >= MAX_LOGIN_ATTEMPTS) {
                LoginAttempt blockAttempt = LoginAttempt.builder()
                        .email(email)
                        .ipAddress(ipAddress)
                        .attemptTime(now)
                        .blocked(true)
                        .blockExpiresAt(now.plusSeconds(BLOCK_DURATION_SECONDS))
                        .build();
                
                loginAttemptRepository.save(blockAttempt);
            }
            
            if (email != null && !email.isEmpty()) {
                List<LoginAttempt> emailAttempts = loginAttemptRepository.findRecentAttemptsByEmail(email, windowStart);
                if (emailAttempts.size() >= MAX_LOGIN_ATTEMPTS) {
                    LoginAttempt blockAttempt = LoginAttempt.builder()
                            .email(email)
                            .ipAddress(ipAddress)
                            .attemptTime(now)
                            .blocked(true)
                            .blockExpiresAt(now.plusSeconds(BLOCK_DURATION_SECONDS))
                            .build();
                    
                    loginAttemptRepository.save(blockAttempt);
                }
            }
        }
    }
    
    /**
     * Checks if an IP or email is currently blocked
     * 
     * @param email The email to check
     * @param ipAddress The IP address to check
     * @return true if blocked, false otherwise
     */
    private boolean isBlocked(String email, String ipAddress) {
        Instant now = Instant.now();
        
        List<LoginAttempt> ipBlocks = loginAttemptRepository.findActiveBlocksByIpAddress(ipAddress, now);
        if (!ipBlocks.isEmpty()) {
            return true;
        }
        
        if (email != null && !email.isEmpty()) {
            List<LoginAttempt> emailBlocks = loginAttemptRepository.findActiveBlocksByEmail(email, now);
            return !emailBlocks.isEmpty();
        }
        
        return false;
    }

    /**
     * Authenticates a user based on the provided authentication hash
     * 
     * @param email The user's email
     * @param authHash The authentication hash to validate
     * @param ipAddress The client's IP address
     * @return LoginSaltsAndPrivateKeyResponseDto with crypto materials or error message
     */
    @Transactional
    public LoginSaltsAndPrivateKeyResponseDto authenticateUser(String email, String authHash, String ipAddress) {
        if (isBlocked(email, ipAddress)) {
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Too many failed attempts. Try again in 30 minutes.")
                    .build();
        }
        
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            recordLoginAttempt(email, ipAddress, true);
            
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
        }
        
        User user = userOptional.get();
        
        if (!user.getIsVerified()) {
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Account not verified. Please check your email for verification instructions.")
                    .build();
        }
        
        Optional<UserSecurity> securityOptional = userSecurityRepository.findById(user.getId());
        if (securityOptional.isEmpty()) {
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Authentication failed. Account security data not found.")
                    .build();
        }
        
        UserSecurity security = securityOptional.get();
        
        if (!security.getHashedAuthenticationKey().equals(authHash)) {
            recordLoginAttempt(email, ipAddress, true);
            
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
        }
        
        String sessionId = generateSecureToken();
        
        UserSession session = new UserSession();
        session.setUser(user);
        session.setSessionId(sessionId);
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusSeconds(SESSION_DURATION_SECONDS));
        session.setIpAddress(ipAddress);
        
        userSessionRepository.save(session);
        
        return LoginSaltsAndPrivateKeyResponseDto.builder()
                .success(true)
                .encryptedMasterKey(security.getEncryptedMasterKey())
                .encryptedMasterKeyIv(security.getEncryptedMasterKeyIv())
                .saltMk(security.getSaltMk())
                .saltEncryption(security.getSaltEncryption())
                .encryptedPrivateKey(security.getEncryptedPrivateKey())
                .encryptedPrivateKeyIv(security.getEncryptedPrivateKeyIv())
                .encryptedPrivateKeySalt(security.getEncryptedPrivateKeySalt())
                .sessionId(sessionId)
                .build();
    }
    
    /**
     * Verifies if a session is valid and not expired
     * 
     * @param sessionId The session ID to verify
     * @return true if session is valid and not expired, false otherwise
     */
    @Transactional
    public boolean verifySession(Optional<String> sessionId) {
        if (sessionId.isEmpty()) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        Optional<UserSession> sessionOpt = userSessionRepository.findActiveSessionBySessionId(String.valueOf(sessionId), now);
        
        return sessionOpt.isPresent();
    }
    
    /**
     * Gets the user ID associated with a session ID
     * 
     * @param sessionId The session ID
     * @return The user ID if session is valid, null otherwise
     */
    @Transactional
    public Integer getUserIdFromSession(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            return null;
        }
        
        LocalDateTime now = LocalDateTime.now();
        Optional<UserSession> sessionOpt = userSessionRepository.findActiveSessionBySessionId(sessionId, now);
        
        if (sessionOpt.isEmpty()) {
            return null;
        }
        
        UserSession session = sessionOpt.get();
        return Math.toIntExact(session.getUser().getId());
    }
    
    /**
     * Invalidates a session by its ID
     * 
     * @param sessionId The session ID to invalidate
     */
    @Transactional
    public void invalidateSession(String sessionId) {
        Optional<UserSession> sessionOptional = userSessionRepository.findBySessionId(sessionId);
        
        if (sessionOptional.isPresent()) {
            UserSession session = sessionOptional.get();
            // Set expiry to now to invalidate
            session.setExpiresAt(LocalDateTime.now());
            userSessionRepository.save(session);
        }
    }

    /**
     * Verifies a user's password for password change functionality
     * 
     * @param email The user's email
     * @param authHash The authentication hash to validate
     * @param ipAddress The client's IP address
     * @return LoginSaltsAndPrivateKeyResponseDto with crypto materials or error message
     */
    @Transactional
    public LoginSaltsAndPrivateKeyResponseDto verifyPassword(String email, String authHash, String ipAddress) {
        if (isBlocked(email, ipAddress)) {
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Too many failed attempts. Try again in 30 minutes.")
                    .build();
        }
        
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            recordLoginAttempt(email, ipAddress, true);
            
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
        }
        
        User user = userOptional.get();
        
        Optional<UserSecurity> securityOptional = userSecurityRepository.findById(user.getId());
        if (securityOptional.isEmpty()) {
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Authentication failed. Account security data not found.")
                    .build();
        }
        
        UserSecurity security = securityOptional.get();
        
        if (!security.getHashedAuthenticationKey().equals(authHash)) {
            recordLoginAttempt(email, ipAddress, true);
            
            return LoginSaltsAndPrivateKeyResponseDto.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
        }
        
        return LoginSaltsAndPrivateKeyResponseDto.builder()
                .success(true)
                .encryptedMasterKey(security.getEncryptedMasterKey())
                .encryptedMasterKeyIv(security.getEncryptedMasterKeyIv())
                .saltMk(security.getSaltMk())
                .saltEncryption(security.getSaltEncryption())
                .build();
    }
    
    /**
     * Updates a user's password and associated cryptographic materials
     * 
     * @param email The user's email
     * @param currentAuthHash The current authentication hash for verification
     * @param newSalt The new password salt
     * @param newAuthSalt The new authentication salt
     * @param newEncSalt The new encryption salt
     * @param newHashedAuthKey The new hashed authentication key
     * @param newEncryptedMasterKey The re-encrypted master key
     * @param newEncryptedMasterKeyIv The IV for the re-encrypted master key
     * @param sessionId The current session ID
     * @param ipAddress The client's IP address
     * @return true if password was updated successfully, false otherwise
     */
    @Transactional
    public boolean updatePassword(
            String email,
            String currentAuthHash,
            String newSalt,
            String newAuthSalt,
            String newEncSalt,
            String newHashedAuthKey,
            String newEncryptedMasterKey,
            String newEncryptedMasterKeyIv,
            String sessionId,
            String ipAddress) {
        
        Integer sessionUserId = getUserIdFromSession(sessionId);
        if (sessionUserId == null) {
            throw new RuntimeException("Invalid or expired session");
        }
        
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOptional.get();
        
        if (!sessionUserId.equals(Math.toIntExact(user.getId()))) {
            throw new RuntimeException("Session does not match the user");
        }
        
        Optional<UserSecurity> securityOptional = userSecurityRepository.findById(user.getId());
        if (securityOptional.isEmpty()) {
            throw new RuntimeException("User security data not found");
        }
        
        UserSecurity security = securityOptional.get();
        
        if (!security.getHashedAuthenticationKey().equals(currentAuthHash)) {
            recordLoginAttempt(email, ipAddress, true);
            throw new RuntimeException("Current password is incorrect");
        }
        
        security.setSalt(newSalt);
        security.setSaltAuthentication(newAuthSalt);
        security.setSaltEncryption(newEncSalt);
        security.setHashedAuthenticationKey(newHashedAuthKey);
        security.setEncryptedMasterKey(newEncryptedMasterKey);
        security.setEncryptedMasterKeyIv(newEncryptedMasterKeyIv);
        
        userSecurityRepository.save(security);
        
        return true;
    }

    /**
     * Authenticates and authorizes a user based on session information.
     *
     * @param request HTTP servlet request containing session information
     * @return The authenticated user ID
     * @throws UnauthorizedException if authentication fails
     */
    public Integer authenticateUser(HttpServletRequest request) {
        Optional<String> sessionId = sessionCookieService.extractSessionId(request);

        if (sessionId.isEmpty()) {
            log.warn("No session ID found in request");
            throw new UnauthorizedException("No valid session found");
        }

        Integer userId = getUserIdFromSession(sessionId.get());

        if (userId == null) {
            log.warn("Invalid or expired session: {}", sessionId.get());
            throw new UnauthorizedException("Invalid or expired session");
        }

        log.debug("User authenticated successfully: userId={}", userId);
        return userId;
    }
}
