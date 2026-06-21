package com.careersuccex.common.config;

import com.careersuccex.common.enums.SkillCategory;
import com.careersuccex.common.util.JsonUtil;
import com.careersuccex.skills.dto.SkillDtos;
import com.careersuccex.skills.entity.Skill;
import com.careersuccex.skills.entity.TargetRole;
import com.careersuccex.skills.repository.SkillRepository;
import com.careersuccex.skills.repository.TargetRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final SkillRepository skillRepository;
    private final TargetRoleRepository targetRoleRepository;
    private final JsonUtil jsonUtil;

    @Override
    public void run(String... args) {
        if (skillRepository.count() > 0) {
            return;
        }
        log.info("Seeding skills and target roles...");
        Map<String, Skill> skills = seedSkills();
        seedRoles(skills);
        log.info("Seed complete: {} skills, {} roles", skills.size(), targetRoleRepository.count());
    }

    private Map<String, Skill> seedSkills() {
        List<String[]> data = List.of(
                new String[]{"Java", "LANGUAGE", "Object-oriented programming language"},
                new String[]{"Python", "LANGUAGE", "Versatile programming language"},
                new String[]{"JavaScript", "LANGUAGE", "Web programming language"},
                new String[]{"TypeScript", "LANGUAGE", "Typed JavaScript superset"},
                new String[]{"C++", "LANGUAGE", "Systems programming language"},
                new String[]{"C#", "LANGUAGE", "Microsoft .NET language"},
                new String[]{"Go", "LANGUAGE", "Cloud-native language"},
                new String[]{"Rust", "LANGUAGE", "Memory-safe systems language"},
                new String[]{"Kotlin", "LANGUAGE", "Modern JVM language"},
                new String[]{"Swift", "LANGUAGE", "Apple platform language"},
                new String[]{"PHP", "LANGUAGE", "Web backend language"},
                new String[]{"Ruby", "LANGUAGE", "Dynamic web language"},
                new String[]{"SQL", "LANGUAGE", "Database query language"},
                new String[]{"HTML", "LANGUAGE", "Web markup language"},
                new String[]{"CSS", "LANGUAGE", "Web styling language"},
                new String[]{"React", "FRAMEWORK", "Frontend UI library"},
                new String[]{"Angular", "FRAMEWORK", "Frontend framework"},
                new String[]{"Vue.js", "FRAMEWORK", "Progressive frontend framework"},
                new String[]{"Spring Boot", "FRAMEWORK", "Java backend framework"},
                new String[]{"Django", "FRAMEWORK", "Python web framework"},
                new String[]{"Flask", "FRAMEWORK", "Lightweight Python framework"},
                new String[]{"Node.js", "FRAMEWORK", "JavaScript runtime"},
                new String[]{"Express.js", "FRAMEWORK", "Node.js web framework"},
                new String[]{"FastAPI", "FRAMEWORK", "Modern Python API framework"},
                new String[]{".NET", "FRAMEWORK", "Microsoft application framework"},
                new String[]{"Flutter", "FRAMEWORK", "Cross-platform mobile framework"},
                new String[]{"React Native", "FRAMEWORK", "Mobile UI framework"},
                new String[]{"TensorFlow", "FRAMEWORK", "Machine learning framework"},
                new String[]{"PyTorch", "FRAMEWORK", "Deep learning framework"},
                new String[]{"Git", "TOOL", "Version control system"},
                new String[]{"Docker", "TOOL", "Container platform"},
                new String[]{"Kubernetes", "TOOL", "Container orchestration"},
                new String[]{"AWS", "TOOL", "Cloud platform"},
                new String[]{"Azure", "TOOL", "Microsoft cloud platform"},
                new String[]{"GCP", "TOOL", "Google cloud platform"},
                new String[]{"Linux", "TOOL", "Operating system"},
                new String[]{"Postman", "TOOL", "API testing tool"},
                new String[]{"Jenkins", "TOOL", "CI/CD automation"},
                new String[]{"GitHub Actions", "TOOL", "CI/CD workflows"},
                new String[]{"Maven", "TOOL", "Java build tool"},
                new String[]{"Gradle", "TOOL", "Build automation tool"},
                new String[]{"JUnit", "TOOL", "Java testing framework"},
                new String[]{"PostgreSQL", "TOOL", "Relational database"},
                new String[]{"MongoDB", "TOOL", "NoSQL database"},
                new String[]{"Redis", "TOOL", "In-memory data store"},
                new String[]{"Figma", "TOOL", "Design tool"},
                new String[]{"Jira", "TOOL", "Project management"},
                new String[]{"REST API", "TOOL", "API architectural style"},
                new String[]{"GraphQL", "TOOL", "Query language for APIs"},
                new String[]{"Microservices", "TOOL", "Architecture pattern"},
                new String[]{"Agile", "SOFT_SKILL", "Iterative development methodology"},
                new String[]{"Scrum", "SOFT_SKILL", "Agile framework"},
                new String[]{"Communication", "SOFT_SKILL", "Effective verbal and written communication"},
                new String[]{"Teamwork", "SOFT_SKILL", "Collaboration in teams"},
                new String[]{"Problem Solving", "SOFT_SKILL", "Analytical thinking"},
                new String[]{"Data Structures", "TOOL", "Core CS fundamentals"},
                new String[]{"Algorithms", "TOOL", "Computational problem solving"},
                new String[]{"OOP", "TOOL", "Object-oriented design"},
                new String[]{"System Design", "TOOL", "Architecture design skills"},
                new String[]{"CI/CD", "TOOL", "Continuous integration and delivery"},
                new String[]{"Unit Testing", "TOOL", "Automated testing practice"},
                new String[]{"Debugging", "SOFT_SKILL", "Finding and fixing defects"},
                new String[]{"Technical Writing", "SOFT_SKILL", "Documentation skills"},
                new String[]{"Leadership", "SOFT_SKILL", "Leading teams and initiatives"},
                new String[]{"Time Management", "SOFT_SKILL", "Prioritization and deadlines"},
                new String[]{"Networking", "SOFT_SKILL", "Professional relationship building"},
                new String[]{"Presentation", "SOFT_SKILL", "Public speaking skills"},
                new String[]{"Critical Thinking", "SOFT_SKILL", "Evaluating information objectively"},
                new String[]{"Adaptability", "SOFT_SKILL", "Learning and adjusting quickly"},
                new String[]{"HTML/CSS", "TOOL", "Web frontend fundamentals"},
                new String[]{"Bootstrap", "FRAMEWORK", "CSS framework"},
                new String[]{"Tailwind CSS", "FRAMEWORK", "Utility-first CSS"},
                new String[]{"Selenium", "TOOL", "Browser automation testing"},
                new String[]{"Cypress", "TOOL", "Frontend testing framework"},
                new String[]{"Webpack", "TOOL", "Module bundler"},
                new String[]{"Vite", "TOOL", "Frontend build tool"},
                new String[]{"Nginx", "TOOL", "Web server and reverse proxy"},
                new String[]{"Terraform", "TOOL", "Infrastructure as code"},
                new String[]{"Ansible", "TOOL", "Configuration management"},
                new String[]{"Spark", "FRAMEWORK", "Big data processing"},
                new String[]{"Hadoop", "FRAMEWORK", "Distributed data processing"},
                new String[]{"Pandas", "FRAMEWORK", "Data analysis library"},
                new String[]{"NumPy", "FRAMEWORK", "Numerical computing library"},
                new String[]{"Scikit-learn", "FRAMEWORK", "Machine learning library"}
        );

        Map<String, Skill> map = new LinkedHashMap<>();
        for (String[] row : data) {
            Skill skill = skillRepository.save(Skill.builder()
                    .name(row[0])
                    .category(SkillCategory.valueOf(row[1]))
                    .description(row[2])
                    .build());
            map.put(row[0], skill);
        }
        return map;
    }

    private void seedRoles(Map<String, Skill> skills) {
        createRole("Software Engineering Intern", "Technology",
                "Build and maintain software applications",
                List.of("Java", "Python", "Git", "SQL", "Data Structures", "Algorithms", "Spring Boot", "REST API", "Agile"),
                skills);
        createRole("Frontend Developer Intern", "Technology",
                "Create responsive web user interfaces",
                List.of("JavaScript", "TypeScript", "React", "HTML", "CSS", "Git", "REST API", "Communication"),
                skills);
        createRole("Backend Developer Intern", "Technology",
                "Develop server-side applications and APIs",
                List.of("Java", "Python", "Spring Boot", "SQL", "PostgreSQL", "Docker", "Git", "REST API", "System Design"),
                skills);
        createRole("Full Stack Developer Intern", "Technology",
                "Work across frontend and backend stacks",
                List.of("JavaScript", "React", "Node.js", "SQL", "Git", "Docker", "REST API", "Agile", "Problem Solving"),
                skills);
        createRole("Data Science Intern", "Technology",
                "Analyze data and build ML models",
                List.of("Python", "SQL", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "Communication", "Problem Solving"),
                skills);
        createRole("DevOps Intern", "Technology",
                "Automate deployment and infrastructure",
                List.of("Linux", "Docker", "Kubernetes", "AWS", "Git", "CI/CD", "Jenkins", "Python", "Networking"),
                skills);
        createRole("Mobile Developer Intern", "Technology",
                "Build iOS/Android applications",
                List.of("Kotlin", "Swift", "Flutter", "React Native", "Git", "REST API", "OOP", "Problem Solving"),
                skills);
        createRole("QA Engineer Intern", "Technology",
                "Test software quality and reliability",
                List.of("JUnit", "Selenium", "Cypress", "Git", "Agile", "Communication", "Problem Solving", "SQL"),
                skills);
        createRole("Cloud Engineer Intern", "Technology",
                "Design and manage cloud infrastructure",
                List.of("AWS", "Azure", "Docker", "Kubernetes", "Linux", "Terraform", "Python", "Networking", "Git"),
                skills);
        createRole("Cybersecurity Intern", "Technology",
                "Protect systems and analyze threats",
                List.of("Linux", "Networking", "Python", "Problem Solving", "Critical Thinking", "Communication", "Git"),
                skills);
    }

    private void createRole(String title, String industry, String description, List<String> skillNames, Map<String, Skill> skills) {
        List<SkillDtos.RequiredSkillEntry> required = new ArrayList<>();
        for (String name : skillNames) {
            Skill skill = skills.get(name);
            if (skill == null) continue;
            SkillDtos.RequiredSkillEntry entry = new SkillDtos.RequiredSkillEntry();
            entry.setSkillId(skill.getId());
            entry.setSkillName(skill.getName());
            entry.setWeight(1);
            entry.setMinLevel(3);
            required.add(entry);
        }
        targetRoleRepository.save(TargetRole.builder()
                .title(title)
                .industry(industry)
                .description(description)
                .requiredSkills(jsonUtil.toJson(required))
                .build());
    }
}
