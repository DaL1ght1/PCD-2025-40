package com.pcd.report;

import com.pcd.report.model.Case;
import com.pcd.report.model.CaseStatus;
import com.pcd.report.repository.CaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.stereotype.Component;

@SpringBootApplication
@EnableDiscoveryClient
public class ReportApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReportApplication.class, args);
	}

	@Component
	public static class DataInitializer implements CommandLineRunner {

		private final CaseRepository caseRepository;

		@Autowired
		public DataInitializer(CaseRepository caseRepository) {
			this.caseRepository = caseRepository;
		}

		@Override
		public void run(String... args) throws Exception {
			if (caseRepository.count() == 0) {
				Case testCase = Case.builder()
						.id("1")
						.title("Test Case")
						.description("Test Description")
						.status(CaseStatus.PENDING)
						.investigatorId("inv123")
						.build();
				testCase.generateCaseNumberIfMissing();
				caseRepository.save(testCase);
			}
		}
	}
}
