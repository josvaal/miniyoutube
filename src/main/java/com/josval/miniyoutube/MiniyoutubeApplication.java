package com.josval.miniyoutube;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories
public class MiniyoutubeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MiniyoutubeApplication.class, args);
    }

}
