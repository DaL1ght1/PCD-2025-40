import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class FeaturesComponent {
  features = [
    {
      icon: 'auto_fix_high',
      title: 'AI Falsification Analysis',
      description: 'Utilizes advanced AI models to automatically detect image manipulations and provide authenticity assessments.',
      details: 'Our backend leverages PyTorch models to identify common tampering techniques such as splicing and copy-move, returning confidence scores and detailed detection metrics.'
    },
    {
      icon: 'account_tree',
      title: 'Role-Based Workflow',
      description: 'Tailored interfaces and permissions ensure secure and efficient collaboration across legal roles.',
      details: 'Distinct modules and features for Investigators (case submission), Experts (analysis, reporting), Lawyers (document management), Judges (review, decisions), and Admins (user management, stats).'
    },
    {
      icon: 'shield',
      title: 'Secure Evidence Management',
      description: 'Safely upload, store, and track case images with metadata extraction and audit trails.',
      details: 'Utilizes MongoDB GridFS for robust storage. Automatically extracts metadata (EXIF, GPS) and maintains a custody trail for each image, ensuring evidence integrity.'
    },
    {
      icon: 'assessment',
      title: 'Detailed Reporting',
      description: 'Generate comprehensive, court-admissible reports documenting analysis findings and expert conclusions.',
      details: 'Create customizable reports using HTML templates. Reports can include analysis summaries, visualizations, expert notes, and can be exported to PDF format.'
    },
    {
      icon: 'folder',
      title: 'Integrated Case Management',
      description: 'Manage the entire case lifecycle from submission and expert assignment to review and final decision.',
      details: 'Track case status (Pending, Assigned, In Progress, Completed, etc.), link images and analyses, assign experts, and record judicial verdicts and notes.'
    },
    {
      icon: 'visibility',
      title: 'Explainable AI Insights',
      description: "Gain deeper understanding of the AI's analysis through integrated visualization techniques.",
      details: "Leverages XAI methods like Grad-CAM, LIME, and SHAP (processed via Python backend) to visually highlight the image regions contributing to the AI's authenticity assessment."}
  ];

}
