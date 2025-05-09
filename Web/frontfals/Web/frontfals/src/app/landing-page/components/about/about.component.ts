import { Component } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage]
})
export class AboutComponent {
  milestones = [
    {
      year: 'March 2025',
      title: 'Foundation',
      description: 'FIDS was founded by a team of forensic experts and AI researchers with a mission to combat the growing problem of image manipulation in legal proceedings.'
    },
    {
      year: 'April 2025',
      title: 'First Algorithm',
      description: 'Developed our first proprietary algorithm capable of detecting common image manipulation techniques with 85% accuracy.'
    },
    {
      year: 'September 2026',
      title: 'Beta Launch',
      description: 'Released our beta platform to select law enforcement agencies and legal firms for real-world testing and refinement.'
    },
    {
      year: 'August 2027',
      title: 'Series A Funding',
      description: 'Secured $12 million in Series A funding to expand our team and enhance our detection capabilities.'
    },
    {
      year: 'December 2029',
      title: 'Public Launch',
      description: 'Officially launched FIDS to the public, offering our services to legal professionals worldwide.'
    },
    {
      year: 'March 2030',
      title: 'AI Breakthrough',
      description: 'Achieved 99.7% accuracy in detecting image manipulations through our advanced AI models and expert review process.'
    }
  ];

  leadershipTeam = [
    {
      name: 'Krifi Khalil',
      role: 'Chief Executive Officer',
      bio: 'Former forensic analyst with 15 years of experience in digital evidence examination. PhD in Computer Science from MIT.',
      image: 'assets/images/team/Krifi-Khalil.jpg'
    },
    {
      name: 'Haddad Siwar ',
      role: 'Chief Technology Officer',
      bio: 'AI researcher with expertise in computer vision and deep learning. Previously led R&D at Google\'s image analysis division.',
      image: 'assets/images/team/Haddad-Siwar.jpg'
    },
    {
      name: 'Souid Mohammed Aziz',
      role: 'Chief Science Officer',
      bio: 'Renowned expert in digital forensics with over 50 published papers on image authentication techniques.',
      image: 'assets/images/team/Souid-Mohammed-Aziz.jpg'
    },
    {
      name: 'Mr Jaouhar Fattahi',
      role: 'Chief Operating Officer',
      bio: 'Former prosecutor with extensive experience in evidence handling and legal procedures. JD from Harvard Law School.',
      image: 'assets/images/team/Jaouhar-Fattahi.jpg'
    }
  ];

  values = [
    {
      icon: 'verified',
      title: 'Integrity',
      description: 'We maintain the highest standards of honesty and ethical conduct in all our operations.'
    },
    {
      icon: 'balance',
      title: 'Justice',
      description: 'We are committed to supporting the pursuit of truth and justice through accurate image analysis.'
    },
    {
      icon: 'science',
      title: 'Innovation',
      description: "We continuously push the boundaries of what's possible in image forensics through research and development."
    },
    {
      icon: 'security',
      title: 'Security',
      description: 'We prioritize the protection of sensitive case data and maintain rigorous security protocols.'
    },
    {
      icon: 'diversity_3',
      title: 'Diversity',
      description: 'We value diverse perspectives and experiences in our team and our approach to problem-solving.'
    },
    {
      icon: 'handshake',
      title: 'Partnership',
      description: 'We work collaboratively with our clients, understanding their unique needs and challenges.'
    }
  ];

  partners =  [
    {name: "ENSI", logo: "/assets/images/partners/ensi-logo.png"},
    {name: "Université Laval", logo: "assets/images/partners/Université-Laval-logo.svg"},
    {name: "Conseil supérieur de la magistrature", logo: "assets/images/partners/Logo-Tunisie.png" },
];
}
