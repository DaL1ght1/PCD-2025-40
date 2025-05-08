// D:\Work-PCD\frontfals\src\app\landing-page\components\security\security.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SecurityComponent {
  // Replace the existing securityFeatures array
  securityFeatures = [
    {
      icon: 'enhanced_encryption', // Represents strong encryption
      title: 'JWT Authentication & Secure Sessions',
      description: 'Industry-standard JSON Web Tokens (JWT) secure user sessions with access and refresh token mechanisms.',
      details: 'Utilizes secure, HTTP-only cookies (when applicable) and robust token validation to protect against unauthorized access and session hijacking.'
    },
    {
      icon: 'admin_panel_settings', // Represents RBAC/Permissions
      title: 'Role-Based Access Control (RBAC)',
      description: 'Granular permissions based on user roles (Admin, Investigator, Expert, Lawyer, Judge) ensure users access only relevant data and features.',
      details: 'Leverages Spring Security with clearly defined roles and permissions, restricting actions like case creation, analysis, reporting, and user management.'
    },
    {
      icon: 'shield_lock', // Represents Data Security
      title: 'Data Encryption & Storage Security',
      description: 'Sensitive data like authentication tokens are securely stored, and database connections are protected.',
      details: 'Employs secure storage for tokens. Configured for authenticated access to databases (PostgreSQL, MongoDB). Assumes standard encryption for data at rest and in transit.'
    },
    {
      icon: 'history_edu', // Represents Auditing/Logging
      title: 'Comprehensive Auditing',
      description: 'Detailed logging and custody trails track critical actions performed on evidence and within the system.',
      details: 'Maintains a chain of custody for image evidence, recording events like uploads, access, and analysis. User actions are logged for accountability.'
    },
    {
      icon: 'rule', // Represents Validation
      title: 'Input Validation & Error Handling',
      description: 'Robust validation of user inputs and controlled error responses mitigate common web vulnerabilities.',
      details: 'Backend services utilize Jakarta Bean Validation for request data integrity. Centralized exception handling prevents exposure of sensitive system details.'
    },
    {
      icon: 'lan', // Represents Network/Gateway
      title: 'API Gateway Security Layer',
      description: 'A central API Gateway manages routing and applies initial security checks for all microservice requests.',
      details: 'Provides a single entry point, simplifying security policy enforcement. Includes CORS configuration and potential for future rate limiting or WAF integration.'
    }
  ];

  // Certifications remain the same as they are standard examples
  certifications = [
    {
      name: 'SOC 2 Type II',
      logo: 'assets/images/certifications/soc2.png',
      description: 'Verified security controls for data protection'
    },
    {
      name: 'GDPR Compliant',
      logo: 'assets/images/certifications/gdpr.png',
      description: 'Meets European data protection standards'
    },
    {
      name: 'HIPAA Compliant',
      logo: 'assets/images/certifications/hipaa.png',
      description: 'Secure handling of protected health information'
    },
    {
      name: 'ISO 27001',
      logo: 'assets/images/certifications/iso27001.png',
      description: 'International standard for information security'
    }
  ];
}
