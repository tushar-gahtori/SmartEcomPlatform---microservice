package com.example.common.exception;

public class ServiceUnavailableException extends RuntimeException {

    private final String serviceName;

    public ServiceUnavailableException(String serviceName) {
        super(serviceName + " is currently unavailable. Please try again later.");
        this.serviceName = serviceName;
    }

    public String getServiceName() { return serviceName; }
}