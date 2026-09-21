package com.Tasksphere;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void fullUserJourneyTest() throws Exception {

        // ==========================================
        // 1. REGISTER A NEW USER
        // ==========================================
        String registerJson = "{\"email\": \"testuser@tasksphere.com\", \"password\": \"Password123!\", \"role\": \"USER\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson))
                .andExpect(status().isCreated());

        // ==========================================
        // 2. LOGIN AND EXTRACT JWT TOKEN
        // ==========================================
        String loginJson = "{\"email\": \"testuser@tasksphere.com\", \"password\": \"Password123!\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        // Extract token cleanly using JsonPath (Bypasses Jackson casting warnings)
        String responseString = loginResult.getResponse().getContentAsString();
        String token = JsonPath.read(responseString, "$.token");

        // ==========================================
        // 3. CREATE A PROJECT (Using JWT)
        // ==========================================
        String projectJson = "{\"name\": \"Integration Test Project\"}";

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isCreated())
                .andReturn();

        // Extract the newly generated Project ID
        String projectResponseString = projectResult.getResponse().getContentAsString();
        Integer projectId = JsonPath.read(projectResponseString, "$.id");

        // ==========================================
        // 4. CREATE A TASK LINKED TO THE PROJECT
        // ==========================================
        String taskJson = "{\"title\": \"Automated Testing Task\", \"status\": \"TODO\", \"projectId\": " + projectId + "}";

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(taskJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Automated Testing Task"))
                .andExpect(jsonPath("$.projectId").value(projectId));
    }
}