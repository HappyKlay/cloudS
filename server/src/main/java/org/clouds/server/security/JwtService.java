package org.clouds.server.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.clouds.server.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service class for handling JWT (JSON Web Token) operations including token generation,
 * validation, and claim extraction.
 *
 * @author Bohdan
 * @version 1.0
 */
@Service
@Slf4j
public class JwtService {
    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.expiration-time}")
    private long jwtExpiration;

    /**
     * Extracts the username from a JWT token.
     *
     * @param token The JWT token to extract the username from
     * @return The username stored in the token's subject claim
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts a specific claim from a JWT token using the provided claims resolver function.
     *
     * @param token          The JWT token to extract the claim from
     * @param claimsResolver Function to resolve the desired claim
     * @return The extracted claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Generates a JWT token for the given user details with no extra claims.
     *
     * @param userDetails The user details to generate a token for
     * @return Generated JWT token
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Generates a JWT token with extra claims for the given user details.
     *
     * @param extraClaims Additional claims to include in the token
     * @param userDetails The user details to generate a token for
     * @return Generated JWT token
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    /**
     * Gets the configured JWT expiration time.
     *
     * @return Token expiration time in milliseconds
     */
    public long getExpirationTime() {
        return jwtExpiration;
    }

    /**
     * Builds a JWT token with the specified claims and expiration.
     *
     * @param extraClaims      Additional claims to include
     * @param userDetails      User details for the token subject
     * @param expirationMillis Token expiration time in milliseconds
     * @return Built and signed JWT token
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expirationMillis
    ) {
        String subject = (userDetails instanceof User)
                ? ((User) userDetails).getEmail()
                : userDetails.getUsername();

        log.info("Setting JWT subject to: {}", subject);

        Instant now = Instant.now();
        Instant expiration = now.plusMillis(expirationMillis);

        Key key = getSignInKey();

        JwtBuilder builder = Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(key);

        return builder.compact();
    }

    /**
     * Validates if a token is valid for the given user details.
     *
     * @param token       The JWT token to validate
     * @param userDetails The user details to validate against
     * @return true if a token is valid, false otherwise
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String subject = extractUsername(token);

        boolean valid;
        if (userDetails instanceof User) {
            valid = subject.equals(((User) userDetails).getEmail()) && isTokenExpired(token);
        } else {
            valid = subject.equals(userDetails.getUsername()) && isTokenExpired(token);
        }

        return valid;
    }

    /**
     * Checks if a token has expired.
     *
     * @param token The JWT token to check
     * @return true if a token is not expired, false if expired
     */
    private boolean isTokenExpired(String token) {
        return !extractExpiration(token).before(new Date());
    }

    /**
     * Extracts the expiration date from a JWT token.
     *
     * @param token The JWT token
     * @return Token expiration date
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extracts all claims from a JWT token.
     *
     * @param token The JWT token to extract claims from
     * @return All token claims
     */
    private Claims extractAllClaims(String token) {
        JwtParserBuilder parserBuilder = Jwts.parser().verifyWith(getSignInKey());

        return parserBuilder.build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Gets the signing key used for JWT operations.
     *
     * @return SecretKey for signing/verifying tokens
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
