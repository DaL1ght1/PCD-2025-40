package com.pcd.notificationservice.Exception;

import lombok.RequiredArgsConstructor;

/**
 * Exception for email service related errors
 */

@RequiredArgsConstructor
public class EmailServiceException extends RuntimeException {
    public EmailServiceException(String message) {
        super(message);
    }

    public EmailServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}