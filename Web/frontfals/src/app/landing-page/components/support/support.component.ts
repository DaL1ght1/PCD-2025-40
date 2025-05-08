import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class SupportComponent {
  supportCategories = [
    {
      icon: 'help_outline',
      title: 'General Help',
      description: 'Answers to common questions about using FIDS',
      link: '/support/general'
    },
    {
      icon: 'account_circle',
      title: 'Account Issues',
      description: 'Help with login, billing, and account management',
      link: '/support/account'
    },
    {
      icon: 'upload_file',
      title: 'Upload Problems',
      description: 'Troubleshooting image upload issues',
      link: '/support/upload'
    },
    {
      icon: 'analytics',
      title: 'Analysis Questions',
      description: 'Understanding analysis results and reports',
      link: '/support/analysis'
    },
    {
      icon: 'integration_instructions',
      title: 'API Support',
      description: 'Help with API integration and usage',
      link: '/support/api'
    },
    {
      icon: 'security',
      title: 'Security Concerns',
      description: 'Questions about data security and privacy',
      link: '/support/security'
    }
  ];

  popularArticles = [
    {
      title: 'How to Reset Your Password',
      link: '/support/articles/reset-password'
    },
    {
      title: 'Supported Image Formats',
      link: '/support/articles/supported-formats'
    },
    {
      title: 'Understanding Confidence Scores',
      link: '/support/articles/confidence-scores'
    },
    {
      title: 'Exporting Analysis Reports',
      link: '/support/articles/export-reports'
    },
    {
      title: 'Adding Team Members',
      link: '/support/articles/add-team-members'
    }
  ];

  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  };

  priorities = [
    { value: 'low', label: 'Low - General question' },
    { value: 'medium', label: 'Medium - Need assistance' },
    { value: 'high', label: 'High - Experiencing issues' },
    { value: 'urgent', label: 'Urgent - System down' }
  ];

  submitForm() {
    // Implement form submission logic
    console.log('Form submitted:', this.contactForm);
    // Reset form after submission
    this.contactForm = {
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'medium'
    };
    // Show success message
    alert('Your support request has been submitted. We will get back to you shortly.');
  }
}
