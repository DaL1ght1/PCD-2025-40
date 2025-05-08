import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

interface CaseStudy {
  id: string;
  title: string;
  challenge: string;
  solution: string;
  outcome: string;
  image: string;
  tags: string[];
}

@Component({
  selector: 'app-case-studies', // Changed selector for clarity, but file remains 'blog' for now
  templateUrl: './blog.component.html', // Keep pointing to the same HTML file
  styleUrls: ['./blog.component.scss'], // Keep pointing to the same SCSS file
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage] // Added NgOptimizedImage
})
export class BlogComponent { // Keep class name as BlogComponent to match file

  caseStudies: CaseStudy[] = [
    {
      id: 'contract-dispute-forgery',
      title: 'Uncovering Signature Forgery in High-Stakes Contract Dispute',
      challenge: 'A critical contract signature was disputed, potentially invalidating a multi-million dollar agreement. Visual inspection was inconclusive.',
      solution: 'FIDS AI analysis flagged inconsistencies in pixel noise and compression around the signature. Expert review using layer analysis confirmed digital insertion.',
      outcome: 'The court ruled the signature forged based on FIDS evidence, leading to a favorable settlement for our client.',
      image: 'assets/images/case-studies/signature-forgery.jpg', // Replace with actual image path
      tags: ['Legal', 'Contract Law', 'Signature Forgery']
    },
    {
      id: 'insurance-fraud-manipulation',
      title: 'Detecting Staged Accident Scene Photos in Insurance Claim',
      challenge: 'An insurance company suspected fraud based on inconsistencies in claimant photos of vehicle damage, but lacked definitive proof.',
      solution: 'FIDS metadata analysis revealed conflicting timestamps and GPS data across submitted photos. AI detected subtle object removal suggesting the scene was altered.',
      outcome: 'The fraudulent claim was denied, saving the insurer significant payout. FIDS report used in subsequent legal action.',
      image: 'assets/images/case-studies/insurance-fraud.jpg', // Replace with actual image path
      tags: ['Insurance', 'Fraud Detection', 'Metadata Analysis']
    },
    {
      id: 'criminal-evidence-tampering',
      title: 'Identifying Tampered Surveillance Footage in Criminal Investigation',
      challenge: 'Defense counsel questioned the integrity of surveillance footage presented by the prosecution, alleging key frames were removed or altered.',
      solution: 'FIDS analyzed video frames as images, detecting inconsistencies in compression artifacts and identifying temporal discontinuities using modification history analysis.',
      outcome: 'The analysis cast sufficient doubt on the footage integrity, leading to re-evaluation of the evidence and contributing to a more just outcome.',
      image: 'assets/images/case-studies/surveillance-tampering.jpg', // Replace with actual image path
      tags: ['Criminal Law', 'Evidence Tampering', 'Video Forensics']
    },
    {
      id: 'real-estate-misrepresentation',
      title: 'Exposing Altered Property Photos in Real Estate Litigation',
      challenge: 'A buyer sued a seller for misrepresentation after discovering significant undisclosed property damage not visible in listing photos.',
      solution: 'FIDS analysis of listing photos identified cloning artifacts used to conceal water damage and structural issues. Visual comparison tools highlighted the specific altered areas.',
      outcome: 'The buyer successfully sued for damages, with the FIDS report serving as key evidence of intentional misrepresentation.',
      image: 'assets/images/case-studies/real-estate.jpg', // Replace with actual image path
      tags: ['Real Estate Law', 'Misrepresentation', 'Object Removal']
    }
  ];

  // Keep constructor or add if needed, e.g., for services
  constructor() {}

  // You might want filtering logic later, but removed for now
  // selectedTag = 'All';
  // get filteredCaseStudies() { ... }
}
