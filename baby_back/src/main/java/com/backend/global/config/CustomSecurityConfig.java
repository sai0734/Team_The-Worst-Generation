package com.backend.global.config;

import java.util.Arrays;

import com.backend.auth.service.AuthTokenService;
import com.backend.global.security.filter.OpenClawInternalKeyFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.backend.global.security.SecurityPaths;
import com.backend.global.security.filter.APILoginFilter;
import com.backend.global.security.filter.JWTCheckFilter;
import com.backend.global.security.handler.APILoginFailHandler;
import com.backend.global.security.handler.APILoginSuccessHandler;
import com.backend.global.security.handler.CustomAccessDeniedHandler;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Configuration
@Log4j2
@RequiredArgsConstructor
@EnableMethodSecurity
public class CustomSecurityConfig {

  private final AuthenticationConfiguration authenticationConfiguration;
  private final AuthTokenService authTokenService;

  @Value("${openclaw.internal-key:}")
  private String openClawInternalKey;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    log.info("---------------------security config---------------------------");

    AuthenticationManager authenticationManager = authenticationConfiguration.getAuthenticationManager();

    http.cors(config -> config.configurationSource(corsConfigurationSource()));

    http.sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

    http.csrf(config -> config.disable());

    http.formLogin(config -> config.disable());

    http.httpBasic(config -> config.disable());

    http.authorizeHttpRequests(auth -> {
      auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
      auth.requestMatchers(HttpMethod.POST, "/api/member/refresh", "/api/member/logout").permitAll();
      auth.requestMatchers(SecurityPaths.PUBLIC_URLS).permitAll();
      auth.anyRequest().authenticated();
    });

    APILoginFilter apiLoginFilter = new APILoginFilter("/api/member/login");
    apiLoginFilter.setAuthenticationManager(authenticationManager);
    apiLoginFilter.setAuthenticationSuccessHandler(new APILoginSuccessHandler(authTokenService));
    apiLoginFilter.setAuthenticationFailureHandler(new APILoginFailHandler());

    http.authenticationManager(authenticationManager);
    http.addFilterBefore(new OpenClawInternalKeyFilter(openClawInternalKey), UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(apiLoginFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(new JWTCheckFilter(), UsernamePasswordAuthenticationFilter.class);

    http.exceptionHandling(config -> config.accessDeniedHandler(new CustomAccessDeniedHandler()));

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
    configuration.setAllowedMethods(Arrays.asList("HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);

    return source;
  }
}



