package org.clouds.server.exception;

import org.clouds.server.exception.base.CloudsBusinessException;

import java.util.List;

/**
 * Exception thrown when validation fails.
 *
 * @author Bohdan
 * @version 1.0
 */
public class ValidationException extends CloudsBusinessException {

  public static final String ERROR_CODE = "VALIDATION_FAILED";

  private final List<String> validationErrors;

  public ValidationException(String message, List<String> validationErrors) {
    super(message, ERROR_CODE);
    this.validationErrors = validationErrors;
  }

  public ValidationException(String message, Throwable cause, List<String> validationErrors) {
    super(message, cause, ERROR_CODE);
    this.validationErrors = validationErrors;
  }

  public List<String> getValidationErrors() {
    return validationErrors;
  }

  public static ValidationException single(String field, String error) {
    return new ValidationException("Validation failed for field: " + field, List.of(error));
  }

  public static ValidationException multiple(List<String> errors) {
    return new ValidationException("Multiple validation errors occurred", errors);
  }
}