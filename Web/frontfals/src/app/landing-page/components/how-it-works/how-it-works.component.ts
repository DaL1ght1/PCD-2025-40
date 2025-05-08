import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HowItWorksComponent {
  workflowSteps = [
    {
      number: '01',
      title: 'Upload Images',
      description: 'Securely upload images that require authentication verification',
      details: 'Our secure upload system accepts all common image formats (JPEG, PNG, TIFF, RAW) and preserves all metadata. Files are encrypted during transit and storage to maintain chain of custody and protect sensitive case information.',
      image:  'assets/images/workflow/UploadImage.png'
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Our advanced algorithms automatically detect potential manipulations',
      details: 'FIDS employs multiple AI models to analyze different aspects of the image. The system generates a preliminary report highlighting areas of concern.',
      image: 'assets/images/workflow/AnalyseImage.png'
    },
    {
      number: '03',
      title: 'Expert Review',
      description: 'Qualified experts review and validate the automated findings',
      details: 'Our network of certified forensic analysts reviews the AI findings, applying human expertise to confirm or refine the results. Experts can use our suite of specialized tools to conduct deeper analysis of flagged areas.',
      image: 'assets/images/workflow/ExpertView.png'
    },
    {
      number: '04',
      title: 'Generate Reports',
      description: 'Create comprehensive, court-ready documentation of findings',
      details: 'FIDS generates detailed reports documenting the entire analysis process, findings, and expert interpretations. Reports are formatted to meet legal standards for evidence admissibility and include visualizations that clearly communicate technical findings to non-experts.',
      image: 'assets/images/workflow/Report.png'
    }
  ];

  faqs = [
    {
      question: 'How accurate is the AI detection system?',
      answer: 'Our AI system achieves 94% accuracy in controlled tests and over 92.3% accuracy with real-world manipulated images. The expert review process further improves accuracy by eliminating false positives and refining analysis of complex cases.'
    },
    {
      question: 'How long does the analysis process take?',
      answer: 'The AI analysis is typically completed within a minute. Expert review timing depends on case complexity and queue status, but is usually completed within 24 hours. Rush processing is available for time-sensitive cases.'
    },
    {
      question: 'Is my data secure during the process?',
      answer: 'Yes, FIDS employs end-to-end encryption for all uploads and stored data. Our system is compliant with major security standards including GDPR. All experts sign confidentiality agreements and access is strictly controlled.'
    },
    {
      question: 'Can FIDS detect AI-generated images?',
      answer: "No, FIDS still doesn't includes specialized models trained to detect images created by AI systems like DALL-E, Midjourney, and Stable Diffusion but we are working on it ."
    },
    {
      question: 'Are the reports admissible in court?',
      answer: 'Yes, FIDS reports are designed to meet legal standards for evidence admissibility. Our methodology has been successfully used in numerous court cases, and our experts are available to provide testimony when needed.'
    }
  ];
}
