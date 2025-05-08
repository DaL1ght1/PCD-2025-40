package com.pcd;

import com.pcd.authentication.AuthenticationService;
import com.pcd.authentication.RegisterRequest;
import com.pcd.user.model.Address;
import com.pcd.user.model.User;
import com.pcd.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import static com.pcd.dto.enums.Role.ADMIN;

@SpringBootApplication
@RequiredArgsConstructor
@EnableDiscoveryClient
@EnableJpaAuditing
public class UserApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserApplication.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner(AuthenticationService service, UserRepository userRepository) {
		return args -> {
			var exists = userRepository.findByEmail("admin@Role.tn");
			if (exists.isEmpty()) { // Check if the admin user does not exist
				var admin = User.builder()
						.firstname("Admin")
						.lastname("Admin")
						.email("admin@Role.tn")
						.password("admin123")
						.role(ADMIN)
						.active(true)
						.address(new Address("Compus", "Technopol", "Mannouba", "2010", "Tunisia"))
						.build();
				userRepository.save(admin);
			}
		};
	}

}
