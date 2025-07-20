package org.clouds.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.dto.request.LoginAuthRequestDto;
import org.clouds.server.dto.request.LoginInitRequestDto;
import org.clouds.server.dto.request.RegistrationRequestDto;
import org.clouds.server.dto.request.VerifyUserRequestDto;
import org.clouds.server.dto.request.PasswordUpdateRequestDto;
import org.clouds.server.dto.responses.ApiResponse;
import org.clouds.server.dto.responses.SessionVerificationResponse;
import org.clouds.server.service.SessionCookieService;
import org.springframework.http.MediaType;
import org.clouds.server.service.AuthenticationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;


import java.util.Optional;

/**
 * Controller class handling authentication-related endpoints and operations.
 * This class provides REST APIs for user registration, authentication, session management,
 * and password-related operations.
 *
 * @author Bohdan
 * @version 1.0
 */
@RestController
@Slf4j(topic = "authentication.controller")
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private static final String SESSION_COOKIE_NAME = "sessionId";
    private static final String VERIFICATION_SUCCESS_TEMPLATE = "verification-success";
    private static final String VERIFICATION_FAILED_TEMPLATE = "verification-failed";

    private final AuthenticationService authenticationService;
    private final TemplateEngine templateEngine;
    private final SessionCookieService sessionCookieService;

    /**
     * Handles user registration requests.
     *
     * @param registrationDto DTO containing registration details
     * @param request         HTTP request object
     * @return ResponseEntity with a registration result
     */
    @PostMapping("/register")
    public ResponseEntity<?> signup(@Valid @RequestBody RegistrationRequestDto registrationDto,
                                    HttpServletRequest request) {
        try {
            String clientIp = getClientIp(request);
            registrationDto.setIp(clientIp);

            authenticationService.signup(registrationDto);

            log.info("User registration successful for username: {}", registrationDto.getUsername());

            return ResponseEntity.ok(
                    ApiResponse.success("Registration successful. Please check your email for verification.")
            );
        } catch (Exception e) {
            log.error("Registration failed for username: {}", registrationDto.getUsername(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Registration failed. Please try again."));
        }
    }

    /**
     * Verifies a user account using verification code.
     *
     * @param verifyUserDto DTO containing verification details
     * @return ResponseEntity with a verification result
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@Valid @RequestBody VerifyUserRequestDto verifyUserDto) {
        try {
            boolean verified = performUserVerification(verifyUserDto);

            if (verified) {
                return ResponseEntity.ok(
                        ApiResponse.success("Email verification successful. You can now log in.")
                );
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid verification code or email."));
            }
        } catch (Exception e) {
            log.error("Email verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Verification failed. Please try again."));
        }
    }

    /**
     * Handles email confirmation through token URL.
     *
     * @param token Verification token
     * @param email User's email (optional)
     * @return ResponseEntity containing HTML response
     */
    @GetMapping("/confirm/{token}")
    public ResponseEntity<String> confirmEmail(@PathVariable String token,
                                               @RequestParam(required = false) String email) {
        try {
            boolean verified = performTokenVerification(email, token);

            String templateName = verified ? VERIFICATION_SUCCESS_TEMPLATE : VERIFICATION_FAILED_TEMPLATE;
            String htmlContent = templateEngine.process(templateName, new Context());
            HttpStatus status = verified ? HttpStatus.OK : HttpStatus.BAD_REQUEST;

            return ResponseEntity.status(status)
                    .contentType(MediaType.TEXT_HTML)
                    .body(htmlContent);
        } catch (Exception e) {
            log.error("Email confirmation failed for token: {}", token, e);
            String errorHtml = templateEngine.process(VERIFICATION_FAILED_TEMPLATE, new Context());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_HTML)
                    .body(errorHtml);
        }
    }

    /**
     * Handles user login requests.
     *
     * @param loginAuthDto DTO containing login credentials
     * @param request      HTTP request object
     * @param response     HTTP response object
     * @return ResponseEntity with a login result
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginAuthRequestDto loginAuthDto,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        try {
            String clientIp = getClientIp(request);

            var loginResponse = authenticationService.authenticateUser(
                    loginAuthDto.getEmail(),
                    loginAuthDto.getAuthHash(),
                    clientIp
            );

            if (!loginResponse.isSuccess()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(loginResponse.getMessage()));
            }

            response.addCookie(sessionCookieService.createSessionCookie(loginResponse.getSessionId()));

            return ResponseEntity.ok(loginResponse);
        } catch (Exception e) {
            log.error("Login failed for email: {}", loginAuthDto.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Login failed. Please try again."));
        }
    }

    /**
     * Initializes a login process by providing necessary salts.
     *
     * @param loginInitDto DTO containing initialization request details
     * @param request      HTTP request object
     * @return ResponseEntity with initialization data
     */
    @PostMapping("/init")
    public ResponseEntity<?> initializeLogin(@Valid @RequestBody LoginInitRequestDto loginInitDto,
                                             HttpServletRequest request) {
        try {
            String clientIp = getClientIp(request);

            var responseDto = authenticationService.initializeLogin(loginInitDto.getEmail(), clientIp);

            if (!responseDto.isSuccess()) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ApiResponse.error(responseDto.getMessage()));
            }

            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            log.error("Login initialization failed for email: {}", loginInitDto.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Login initialization failed. Please try again."));
        }
    }

    /**
     * Verifies user session validity.
     *
     * @param request HTTP request object
     * @return ResponseEntity with a session verification result
     */
    @GetMapping("/verify-session")
    public ResponseEntity<SessionVerificationResponse> verifySession(HttpServletRequest request) {
        try {
            Optional<String> sessionId = sessionCookieService.extractSessionId(request);

            if (sessionId.isEmpty()) {
                return ResponseEntity.ok(SessionVerificationResponse.error("No session found"));
            }

            if (!authenticationService.verifySession(sessionId)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(SessionVerificationResponse.error("Session is invalid or expired"));
            }

            return ResponseEntity.ok(SessionVerificationResponse.valid());
        } catch (Exception e) {
            log.error("Error verifying session", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SessionVerificationResponse.error("Error verifying session"));
        }
    }

    /**
     * Handles user logout requests.
     *
     * @param request  HTTP request object
     * @param response HTTP response object
     * @return ResponseEntity with a logout result
     */
    @PostMapping("/logout")
    public ResponseEntity<SessionVerificationResponse> logout(HttpServletRequest request,
                                                              HttpServletResponse response) {
        try {
            Optional<String> sessionId = sessionCookieService.extractSessionId(request);

            if (sessionId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT)
                        .body(SessionVerificationResponse.error("Already logged out"));
            }

            authenticationService.invalidateSession(sessionId.get());
            response.addCookie(sessionCookieService.clearSessionCookie());

            return ResponseEntity.ok(SessionVerificationResponse.valid("Logged out successfully"));
        } catch (Exception e) {
            log.error("Error during logout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SessionVerificationResponse.error("Error logging out: " + e.getMessage()));
        }
    }

    /**
     * Verifies user password without creating a session.
     *
     * @param loginAuthDto DTO containing login credentials
     * @param request      HTTP request object
     * @return ResponseEntity with a verification result
     */
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@Valid @RequestBody LoginAuthRequestDto loginAuthDto,
                                            HttpServletRequest request) {
        try {
            String clientIp = getClientIp(request);

            var verifyResponse = authenticationService.verifyPassword(
                    loginAuthDto.getEmail(),
                    loginAuthDto.getAuthHash(),
                    clientIp
            );

            if (!verifyResponse.isSuccess()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(verifyResponse.getMessage()));
            }

            return ResponseEntity.ok(verifyResponse);

        } catch (Exception e) {
            log.error("Password verification failed for email: {}", loginAuthDto.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred during password verification"));
        }
    }

    /**
     * Updates user password.
     *
     * @param passwordUpdateDto DTO containing password update details
     * @param sessionId         Current session ID from cookie
     * @param request           HTTP request object
     * @param response          HTTP response object
     * @return ResponseEntity with an update result
     */
    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@Valid @RequestBody PasswordUpdateRequestDto passwordUpdateDto,
                                            @CookieValue(value = SESSION_COOKIE_NAME, required = false) String sessionId,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        try {
            if (sessionId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("No active session found"));
            }

            String clientIp = getClientIp(request);

            boolean passwordUpdated = authenticationService.updatePassword(
                    passwordUpdateDto.getEmail(),
                    passwordUpdateDto.getCurrentAuthHash(),
                    passwordUpdateDto.getSalt(),
                    passwordUpdateDto.getAuthSalt(),
                    passwordUpdateDto.getEncSalt(),
                    passwordUpdateDto.getHashedAuthenticationKey(),
                    passwordUpdateDto.getEncryptedMasterKey(),
                    passwordUpdateDto.getEncryptedMasterKeyIv(),
                    sessionId,
                    clientIp
            );

            if (!passwordUpdated) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Failed to update password"));
            }

            authenticationService.invalidateSession(sessionId);
            response.addCookie(sessionCookieService.clearSessionCookie());

            return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
        } catch (Exception e) {
            log.error("Password update failed for email: {}", passwordUpdateDto.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Password update failed. Please try again."));
        }
    }

    /**
     * Extracts client IP address from request.
     *
     * @param request HTTP request object
     * @return Client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = request.getRemoteAddr();
        }
        return clientIp;
    }

    /**
     * Performs user verification using email and verification code.
     *
     * @param verifyUserDto DTO containing verification details
     * @return true if verification successful, false otherwise
     */
    private boolean performUserVerification(VerifyUserRequestDto verifyUserDto) {
        if (hasValidEmail(verifyUserDto.getEmail())) {
            return authenticationService.verifyUser(
                    verifyUserDto.getEmail(),
                    verifyUserDto.getVerificationCode()
            );
        } else {
            return authenticationService.verifyUserByCode(verifyUserDto.getVerificationCode());
        }
    }

    /**
     * Performs token-based verification.
     *
     * @param email User email
     * @param token Verification token
     * @return true if verification successful, false otherwise
     */
    private boolean performTokenVerification(String email, String token) {
        if (hasValidEmail(email)) {
            return authenticationService.verifyUser(email, token);
        } else {
            return authenticationService.verifyUserByCode(token);
        }
    }

    /**
     * Validates if email is present and non-empty.
     *
     * @param email Email to validate
     * @return true if email is valid, false otherwise
     */
    private boolean hasValidEmail(String email) {
        return email != null && !email.trim().isEmpty();
    }
}