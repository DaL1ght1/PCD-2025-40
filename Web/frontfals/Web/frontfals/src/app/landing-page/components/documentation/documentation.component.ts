import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DocumentationComponent {
  categories = [
    {
      title: 'Getting Started',
      icon: 'play_circle',
      docs: [
        { title: 'Introduction to FIDS', link: '/docs/introduction' },
        { title: 'Creating Your Account', link: '/docs/account-setup' },
        { title: 'System Requirements', link: '/docs/system-requirements' },
        { title: 'Quick Start Guide', link: '/docs/quick-start' }
      ]
    },
    {
      title: 'Core Features',
      icon: 'auto_awesome',
      docs: [
        { title: 'Uploading Images', link: '/docs/uploading-images' },
        { title: 'AI Analysis Process', link: '/docs/ai-analysis' },
        { title: 'Expert Review', link: '/docs/expert-review' },
        { title: 'Generating Reports', link: '/docs/reports' },
        { title: 'Case Management', link: '/docs/case-management' }
      ]
    },
    {
      title: 'Advanced Usage',
      icon: 'insights',
      docs: [
        { title: 'Batch Processing', link: '/docs/batch-processing' },
        { title: 'Analysis Filters', link: '/docs/analysis-filters' },
        { title: 'Comparison Tools', link: '/docs/comparison-tools' },
        { title: 'Metadata Analysis', link: '/docs/metadata-analysis' },
        { title: 'Custom Reporting', link: '/docs/custom-reporting' }
      ]
    },
    {
      title: 'Integrations',
      icon: 'integration_instructions',
      docs: [
        { title: 'API Overview', link: '/docs/api-overview' },
        { title: 'Authentication', link: '/docs/api-authentication' },
        { title: 'Webhooks', link: '/docs/webhooks' },
        { title: 'Third-Party Integrations', link: '/docs/third-party' }
      ]
    },
    {
      title: 'User Management',
      icon: 'people',
      docs: [
        { title: 'User Roles & Permissions', link: '/docs/user-roles' },
        { title: 'Team Management', link: '/docs/team-management' },
        { title: 'Single Sign-On (SSO)', link: '/docs/sso' }
      ]
    },
    {
      title: 'Security',
      icon: 'security',
      docs: [
        { title: 'Data Security', link: '/docs/data-security' },
        { title: 'Compliance', link: '/docs/compliance' },
        { title: 'Audit Logs', link: '/docs/audit-logs' }
      ]
    }
  ];

  popularArticles = [
    { title: 'How to Interpret AI Analysis Results', link: '/docs/interpreting-results' },
    { title: 'Best Practices for Image Submission', link: '/docs/image-submission-best-practices' },
    { title: 'Understanding Detection Confidence Scores', link: '/docs/confidence-scores' },
    { title: 'Preparing Court-Admissible Reports', link: '/docs/court-admissible-reports' }
  ];
}
