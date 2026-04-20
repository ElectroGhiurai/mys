package com.electroghiurai.mys.config;

import org.h2.server.web.JakartaWebServlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Manually registers the H2 web console servlet.
 * Spring Boot 4 does not auto-register it reliably, so we do it explicitly.
 * Only active when NOT in production (dev/default profiles).
 */
@Configuration
@Profile("!prod")
public class H2ConsoleConfig {

    @Bean
    public ServletRegistrationBean<JakartaWebServlet> h2Console() {
        ServletRegistrationBean<JakartaWebServlet> bean =
                new ServletRegistrationBean<>(new JakartaWebServlet(), "/h2-console/*");
        bean.addInitParameter("webAllowOthers", "false"); // local access only
        bean.setLoadOnStartup(1);
        return bean;
    }
}
