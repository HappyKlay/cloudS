package org.clouds.server.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.Cookie;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Optional;


/**
 * Service class for handling session cookie operations.
 * Manages the creation, deletion, and extraction of session cookies used for user authentication.
 * The cookie properties like secure flag, path, and max age can be configured via application properties.
 *
 * @author Bohdan
 * @version 1.0
 */
@Component
@Slf4j(topic = "session.cookie")
public class SessionCookieService {

    private static final String SESSION_COOKIE_NAME = "sessionId";

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.cookie.path:/}")
    private String cookiePath;

    @Value("${app.cookie.max-age:3600}")
    private int cookieMaxAge;

    /**
     * Creates a session cookie with the provided session ID.
     * The cookie is configured with an HTTP-only flag, secure flag (configurable),
     * custom path, and max age settings.
     *
     * @param sessionId The session ID to store in the cookie
     * @return A configured Cookie object containing the session ID
     */
    public Cookie createSessionCookie(String sessionId) {
        Cookie sessionCookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(cookieSecure);
        sessionCookie.setPath(cookiePath);
        sessionCookie.setMaxAge(cookieMaxAge);
        log.debug("Created session cookie with ID: {}", sessionId);
        return sessionCookie;
    }

    /**
     * Creates an expired session cookie to clear the existing session.
     * The cookie is configured with an HTTP-only flag, secure flag (configurable),
     * custom path, and max age of 0 to expire it immediately.
     *
     * @return A configured Cookie object that will clear the session when set
     */
    public Cookie clearSessionCookie() {
        Cookie sessionCookie = new Cookie(SESSION_COOKIE_NAME, "");
        sessionCookie.setHttpOnly(true);
        sessionCookie.setSecure(cookieSecure);
        sessionCookie.setPath(cookiePath);
        sessionCookie.setMaxAge(0);
        log.debug("Created session cookie to clear session");
        return sessionCookie;
    }

    /**
     * Extracts the session ID from the request cookies if present.
     *
     * @param request The HttpServletRequest containing the cookies
     * @return Optional containing the session ID if found, empty Optional otherwise
     */
    public Optional<String> extractSessionId(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        return Arrays.stream(cookies)
                .filter(cookie -> SESSION_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}