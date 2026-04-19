package com.electroghiurai.mys.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class MysController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }
}
