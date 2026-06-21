package com.careersuccex.auth;

import com.careersuccex.auth.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class CareerSucceXApplicationTests {

    @Autowired
    private JwtService jwtService;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @Test
    void contextLoads() {
        assertNotNull(jwtService);
    }
}
