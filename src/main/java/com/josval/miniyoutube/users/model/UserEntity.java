/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.josval.miniyoutube.users.model;

import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 *
 * @author josva
 */
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "usuarios")
public class UserEntity {
    @Id
    private String id;
    private String username;
    private String email;
    private String password;
    private String channelName;
    private String avatarURL;
    
    @CreatedDate
    private Date createdAt;
}
