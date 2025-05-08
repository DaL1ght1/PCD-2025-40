# Falsified Image Detection System (FIDS)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/user/repo) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The Falsified Image Detection System (FIDS) is a comprehensive, full-stack web application designed for forensic analysis of digital images. It leverages a microservices architecture built with Spring Boot and Spring Cloud, coupled with a sophisticated Angular frontend. The core functionality revolves around AI-powered detection of image manipulations (e.g., signature forgery, splicing, copy-move) using PyTorch models, supported by Explainable AI (XAI) techniques (Grad-CAM, LIME, SHAP) to provide insights into the AI's decision-making process.

FIDS provides role-based access control for various legal and forensic professionals (Administrators, Investigators, Experts, Lawyers, Judges), enabling secure evidence management, detailed analysis reporting, case tracking, and collaboration within a secure, auditable environment.

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
  - [Running Locally (Manual Setup)](#running-locally-manual-setup)
- [Usage](#usage)
- [Machine Learning Model Details](#machine-learning-model-details)
- [API Documentation](#api-documentation)
- [Monitoring & Infrastructure](#monitoring--infrastructure)
- [Contributing](#contributing)
- [License](#license)

## Features

* **Role-Based Access Control (RBAC):** Dedicated workflows and permissions tailored for Administrators, Investigators, Experts, Lawyers, and Judges.
* **Secure User Management:** Robust authentication using JWT (Access & Refresh Tokens), user registration with email activation (via Kafka & Notification Service), role management, and secure profile handling.
* **Case Management:** Create, track, update, and manage investigation cases; assign cases to experts; link evidence and analysis results; record judicial decisions and notes.
* **Secure Image Handling & Evidence Management:**
  * Upload and storage of image evidence (JPEG, PNG, TIFF, etc.).
  * MongoDB GridFS for efficient storage and retrieval of potentially large image files.
  * Automatic extraction of image metadata (EXIF, GPS, etc.) upon upload.
  * Immutable Chain of Custody logging for all evidence actions (upload, access, download, deletion, status changes).
* **AI-Powered Falsification Detection:**
  * Utilizes PyTorch deep learning models (e.g., MobileNetV3, ViT) trained for binary classification (Authentic vs. Falsified).
  * Asynchronous analysis triggered via Image Analysis Service.
  * Provides confidence scores indicating the model's certainty.
* **Explainable AI (XAI) Visualizations:**
  * Generates visual explanations (Grad-CAM, LIME, SHAP heatmaps) to highlight image regions that influenced the AI's prediction.
* **Comprehensive Reporting:**
  * Generate detailed analysis reports in PDF and DOCX formats.
  * Utilizes customizable HTML templates managed by the Report Service (using Thymeleaf).
  * Supports different report types (Preliminary, Expert Opinion, Final, Judicial).
  * Report versioning and comparison capabilities.
* **Microservices Architecture:**
  * Modular, scalable, and resilient backend built with Spring Boot.
  * **Service Discovery (Eureka):** Dynamic registration and discovery of services.
  * **Centralized Configuration (Spring Cloud Config):** Manages external configurations for all services.
  * **API Gateway (Spring Cloud Gateway):** Single entry point, handles routing, CORS, and potentially rate limiting/security.
* **Asynchronous Communication:**
  * **Kafka:** Used for events like analysis completion (triggering report generation) and user registration (triggering notification service).
* **System Monitoring & Tracing:**
  * **Spring Boot Actuator:** Provides health checks and metrics for each service.
  * **Zipkin:** Distributed tracing for monitoring requests across microservices.
  * **Prometheus:** Metrics collection for monitoring system performance.
* **Modern Frontend:** Responsive and interactive user interface built with Angular, featuring role-specific dashboards and functionalities.

## System Architecture

The system is designed using a microservices architecture to promote scalability, resilience, and independent development. Key components include:

1. **User Interface (Angular Frontend):** The single-page application (SPA) providing user interaction for all roles.
2. **API Gateway (Spring Cloud Gateway - Port `8222`):** Centralizes incoming requests, performs routing to appropriate backend services, handles cross-origin resource sharing (CORS), and acts as the primary security enforcement point.
3. **Discovery Service (Eureka Server - Port `8761`):** Enables microservices to dynamically register themselves and discover the locations of other services within the network.
4. **Config Server (Spring Cloud Config - Port `8888`):** Provides externalized configuration properties to all microservices from a central source (e.g., Git repository, local files).
5. **User Service (Port `8090`):** Handles user registration, authentication (JWT generation/validation), authorization (roles, permissions), profile management, and activation token handling. Uses PostgreSQL for persistence.
6. **Image Management Service (Port `8050`):** Responsible for uploading, storing (using MongoDB GridFS), retrieving, deleting image evidence, extracting metadata, and maintaining the chain of custody. Uses MongoDB.
7. **Image Analysis Service (Port `8051`):** Orchestrates the forensic analysis. It fetches images, executes Python scripts containing PyTorch models and XAI logic, saves analysis results, updates image status, and publishes `analysis-completed` events to Kafka. Uses MongoDB.
8. **Report Service (Port `8053`):** Manages the case lifecycle, generates detailed reports (PDF/DOCX) from templates based on case and analysis data, listens for analysis completion events from Kafka, and manages report templates. Uses MongoDB.
9. **Notification Service (Port `8668`):** Listens for specific Kafka events (like `user-registration`) and sends notifications, primarily email (e.g., account activation links) via SMTP.
10. **Databases:**
    * **PostgreSQL (Port `5432`):** Relational database for the User Service.
    * **MongoDB (Port `27017`):** NoSQL database used by Image Management, Image Analysis, and Report Services, leveraging GridFS for image file storage.
11. **Message Queues:**
    * **Apache Kafka (Port `9092`):** Event streaming platform for asynchronous communication between services.
12. **Monitoring & Utility Services:**
    * **Zipkin (Port `9411`):** Distributed tracing system.
    * **Prometheus (Port `9090`):** Metrics collection and monitoring.
    * **pgAdmin (Port `5050`):** Web UI for managing PostgreSQL.
    * **Mongo Express (Port `8081`):** Web UI for managing MongoDB.
    * **MailDev (Ports `1080`, `1025`):** Development SMTP server for testing email notifications.

## Technology Stack

### Frontend
| Category | Technologies |
|----------|--------------|
| **Core** | Angular (v19), TypeScript, RxJS |
| **UI/UX** | HTML5, SCSS, Bootstrap 5, Angular Material |
| **Visualization** | Chart.js (via ng2-charts) |
| **File Handling** | NgxDropzone |
| **Notifications** | Toastr (ngx-toastr) |

### Backend (Microservices)
| Category | Technologies |
|----------|--------------|
| **Core** | Java 17, Spring Boot 3.4 |
| **Cloud Components** | Spring Cloud (Gateway, Config, Eureka Client/Server) |
| **Data Access** | Spring Data JPA, Spring Data MongoDB |
| **Security** | Spring Security (JWT Authentication/Authorization) |
| **Messaging** | Spring Kafka |
| **Monitoring** | Spring Boot Actuator |
| **Build Tools** | Maven |
| **Development** | Lombok |
| **Documentation** | Swagger/OpenAPI (Springdoc) |
| **Templating** | Thymeleaf (Report Service Templates) |
| **Document Generation** | iText/html2pdf (PDF), Apache POI (DOCX) |

### Machine Learning / Image Analysis
| Category | Technologies |
|----------|--------------|
| **Core** | Python 3.10+, PyTorch |
| **Models** | Timm (PyTorch Image Models), Hugging Face Transformers (ViT) |
| **Image Processing** | Albumentations, OpenCV-Python (cv2), Pillow (PIL Fork) |
| **Optimization** | Optuna (Hyperparameter Optimization) |
| **Explainable AI** | pytorch-grad-cam, LIME, SHAP |
| **Data Science** | NumPy, SciKit-Image, Matplotlib, Seaborn |

### Infrastructure & Databases
| Category | Technologies |
|----------|--------------|
| **Databases** | PostgreSQL (≥ v14), MongoDB (≥ v5, Replica Set for GridFS) |
| **Message Brokers** | Apache Kafka |
| **Containerization** | Docker & Docker Compose |

### Monitoring & Development Tools
| Category | Technologies |
|----------|--------------|
| **Monitoring** | Zipkin (Distributed Tracing), Prometheus (Metrics) |
| **Database UIs** | pgAdmin 4 (PostgreSQL), Mongo Express (MongoDB) |
| **Development** | MailDev (SMTP Server), Git & GitHub |
| **IDEs** | IntelliJ IDEA / Web Storm IDEA |
| **API Testing** | Postman / Swagger |

## Prerequisites

* **Core:**
  * Git
  * JDK 17+
  * Maven 3.6+
  * Node.js (Latest LTS)
  * Python 3.10+
  * pip
* **Infrastructure (Manual Setup OR Docker):**
  * PostgreSQL Server
  * MongoDB Server (Replica Set Recommended)
  * Apache Kafka (+ Zookeeper)
* **Strongly Recommended:**
  * Docker Desktop (or Docker Engine + Docker Compose)

## Getting Started

Two main ways to run the system: using Docker Compose for the full infrastructure and backend, or running services manually.

### Running with Docker Compose (Recommended)

This is the preferred method as it simplifies the setup of databases, message queues, and monitoring tools.

1. **Ensure Docker is Running:** Make sure Docker Desktop or Docker Engine with Compose is active on your system.
2. **Clone the Repository:**
   ```bash
   git clone https://github.com/DaL1ght1/PCD-2025-40
   cd PCD-2025-40/Web/falsiified
   ```
3. **(Optional) Configure Environment:** Review the `.env` file (if provided) or the `environment` sections within the `docker-compose.yml` file. Adjust settings like JWT secrets, database passwords, absolute paths, smtp email and password or external URLs (if necessary).
4. **Build Service Images:** The provided `docker-compose.yml` uses pre-built image names (e.g., `user-service-image`). You need to build these images first. Navigate to each service directory (e.g., `services/user-service`) and build the image using the Spring Boot Maven plugin:
   ```bash
   # Example for user-service
   cd services/user-service
   mvn spring-boot:build-image -Dspring-boot.build-image.imageName=user-service-image
   cd ../ # Go back to root
   
   # Repeat for: imageanalysis-service, imagemanagement-service, report-service
   ```
5. **Start Services:** From the project root directory (where `docker-compose.yml` is located):
   ```bash
   docker-compose up -d
   ```
   This command will:
   * Pull required base images (Postgres, Mongo, Kafka, etc.).
   * Create containers for infrastructure (databases, queues, monitoring).
   * Create containers for the Spring Boot backend services defined in the compose file (User, ImageAnalysis, ImageManagement, Report services).
   * Connect all containers to the `microservices-net` network.
   * Start all services in detached mode (`-d`).

6. **Verify Services:** Check the status of containers:
   ```bash
   docker ps
   ```
   Monitor logs if needed:
   ```bash
   docker-compose logs -f <service_name> # e.g., docker-compose logs -f user-service
   ```

7. **Access Infrastructure UIs:**
   * pgAdmin: `http://localhost:5050`
   * Mongo Express: `http://localhost:8081`
   * Zipkin: `http://localhost:9411`
   * Prometheus: `http://localhost:9090`
   * MailDev: `http://localhost:1080` (Web UI), SMTP on `localhost:1025`

8. **Run Frontend:** Even with the backend containerized, the frontend is typically run locally for development:
   ```bash
   cd frontfals # Or your frontend directory name
   npm install
   npm start
   ```
   Access the application at `http://localhost:4200`.

**Note on Missing Services in Docker Compose:** The provided `docker-compose.yml` doesn't include entries for `config-server`, `discovery-service`, `gateway-service`, and `notification-service`. You will need to either:
    a) Run these services manually locally (see next section) *before* starting the dependent services in Docker Compose.
    b) Add service definitions for them to the `docker-compose.yml` file and build their respective Docker images.

**Note on Port Differences:** The `docker-compose.yml` maps some services to different external ports than their default internal ports defined in configuration (e.g., User Service runs on 8090 internally but is mapped to 8091 externally in the compose file). Be mindful of which port to use when accessing services directly vs. through the gateway.

### Running Locally (Manual Setup)

This requires manually setting up all infrastructure components and running each service individually.

1. **Infrastructure Setup:**
   * Install and run PostgreSQL, MongoDB, Kafka (+ Zookeeper).
   * Ensure database credentials, Kafka brokers, etc., match the configurations in the `services/<service-name>/src/main/resources/configurations/*.yml` files within the **Config Server** project (or the individual `application.yml` files if not using Config Server initially).

2. **Build & Run Backend Services (Order is Crucial):**
   * Open separate terminals for each service.
   * **Config Server:** `cd services/config-server && mvn spring-boot:run` (Port 8888)
   * Wait for Config Server to start.
   * **Discovery Service (Eureka):** `cd ../discovery && mvn spring-boot:run` (Port 8761)
   * Wait for Eureka to start and be accessible at `http://localhost:8761`.
   * **Gateway Service:** `cd ../gateway && mvn spring-boot:run` (Port 8222)
   * **User Service:** `cd ../user-service && mvn spring-boot:run` (Port 8090)
   * **Image Management Service:** `cd ../imageManagement-service && mvn spring-boot:run` (Port 8050)
   * **Image Analysis Service (Requires Python Setup):**
     * `cd ../imageAnalysis-service`
     * Setup Python environment: Navigate to `src/main/resources/python`, run `pip install -r requirements.txt` (if exists).
     * Ensure model (`.pth`) file is in `src/main/resources/models/`.
     * Ensure SHAP background dir exists and path is correct in config.
     * Run: `mvn spring-boot:run` (Port 8051)
   * **Report Service:** `cd ../report-service && mvn spring-boot:run` (Port 8053)
   * **Notification Service:** `cd ../notification-service && mvn spring-boot:run` (Port 8668)
   * Monitor logs and Eureka dashboard (`http://localhost:8761`) to ensure services start and register correctly.

3. **Run Frontend Application:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Access at `http://localhost:4200`.

## Usage

1. **Navigate** to the frontend application URL (`http://localhost:4200` by default).
2. **Register** a new account or **Login** with existing credentials. New accounts require email activation.
3. The application will redirect you to a dashboard tailored to your **assigned role** (Admin, Investigator, Expert, Lawyer, Judge).
4. **Perform actions** based on your role:
   * **Investigators:** Submit cases via the 'Submit New Case' feature, upload associated images.
   * **Experts:** Access assigned cases, select images for forensic analysis (triggering AI/XAI), view results, add annotations, and generate detailed expert reports.
   * **Lawyers:** Review case details, associated evidence, expert reports, and manage/create legal documents using templates.
   * **Judges:** Review case summaries, evidence, reports, and expert opinions; record final judicial verdicts and notes.
   * **Admins:** Access the User Management dashboard to create, view, update, and delete user accounts; monitor system statistics and health.
5. Use the **sidebar navigation** to access different modules like Cases, Images, Reports, Profile, and Settings.

## Machine Learning Model Details

* **Task:** Binary Image Classification (Authentic vs. Falsified). Primarily demonstrated with signature verification but adaptable.
* **Architecture:** Flexible, supports various pre-trained backbones loaded via `timm` (e.g., MobileNetV3_Large, EfficientNet) or Hugging Face `transformers` (e.g., ViT_Base).
* **Training:**
  * The notebook `falsified-images-pytorch.ipynb` provides a complete pipeline.
  * Includes data splitting, augmentation using Albumentations.
  * Demonstrates fine-tuning (unfreezing specific layers).
  * Integrates Optuna for hyperparameter optimization (learning rate, batch size, dropout, etc.).
* **Inference:** Performed by the Python script (`detect_falsification.py`) called by the Image Analysis Service.
* **Explainability (XAI):**
  * The `xai-version.ipynb` notebook and the analysis script generate explanations.
  * Methods: Grad-CAM, LIME, SHAP.
  * Output: Heatmap visualizations saved as image files, paths are stored in the analysis results (MongoDB).

## API Documentation

RESTful APIs are provided by the backend microservices and documented using OpenAPI (Swagger).

* **Aggregated Documentation (via Gateway):** The easiest way to explore all APIs is through the API Gateway's Swagger UI. Access it at:
  `http://localhost:8222/swagger-ui.html` (Adjust port if changed).
* **Individual Service Documentation:** Each service typically exposes its own Swagger UI. This can be useful for testing specific services in isolation:
  * User Service: `http://localhost:8090/swagger-ui.html`
  * Image Management: `http://localhost:8050/swagger-ui.html`
  * Image Analysis: `http://localhost:8051/swagger-ui.html`
  * Report Service: `http://localhost:8053/swagger-ui.html`

## Monitoring & Infrastructure

Several tools are included (especially when using Docker Compose) for monitoring and managing the system:

* **Eureka Dashboard:** `http://localhost:8761` - View registered microservices and their status.
* **Zipkin UI:** `http://localhost:9411` - Visualize distributed traces to understand request flow and identify bottlenecks.
* **Prometheus UI:** `http://localhost:9090` - Query and visualize metrics exposed by services via Actuator.
* **pgAdmin:** `http://localhost:5050` - Web interface for managing the PostgreSQL database (User Service data).
* **Mongo Express:** `http://localhost:8081` - Web interface for managing the MongoDB database (Image, Analysis, Report data).
* **MailDev:** `http://localhost:1080` - Web interface to view emails sent by the Notification Service during development.

## Contributing

We welcome contributions to improve FIDS! Please follow these steps:

1. **Fork** the repository on GitHub.
2. Create a dedicated **branch** for your feature or bug fix (`git checkout -b feature/your-idea` or `bugfix/issue-description`).
3. Implement your changes, adhering to the existing code style and conventions.
4. Add unit tests or integration tests for new functionality.
5. Ensure all tests pass locally.
6. **Commit** your changes with clear, descriptive messages (`git commit -m 'feat: Add X feature'`).
7. **Push** your branch to your fork (`git push origin feature/your-idea`).
8. Open a **Pull Request (PR)** against the `main` branch of the original repository.
9. Clearly describe the purpose and changes of your PR.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.
