package com.pcd.exception;


import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper=true)
@Data
public class UserNotFoundException extends RuntimeException{
    private final String msg ;
}
