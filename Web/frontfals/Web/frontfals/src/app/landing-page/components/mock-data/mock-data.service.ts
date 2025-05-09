import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Partner logos
  getPartnerLogos() {
    return [
      { name: "ENSI", src: "assets/images/partners/ensi-logo.png" },
      { name: "Université Laval", src: "assets/images/partners/Université-Laval-logo.svg" },
      { name: "Conseil supérieur de la magistrature", src: "assets/images/partners/Logo-Tunisie.png" },
    ];
  }

  // Workflow steps visuals
  getWorkflowSteps() {
    return [
      {
        title: 'Upload Images',
        description: 'Securely upload images that require authentication verification',
        visual: 'assets/images/workflow/UploadImage.png',
      },
      {
        title: 'AI Analysis',
        description: 'Our advanced algorithms automatically detect potential manipulations',
        visual: 'assets/images/workflow/AnalyseImage.png'
      },
      {
        title: 'Expert Review',
        description: 'Qualified experts review and validate the automated findings',
        visual: 'assets/images/workflow/ExpertView.png'
      },
      {
        title: 'Generate Reports',
        description: 'Create comprehensive, court-ready documentation of findings',
        visual: 'assets/images/workflow/Report.png'
      }
    ];
  }

  // User roles
  getRoles() {
    return [
      {
        icon: 'search',
        title: 'Investigator',
        description: 'Upload images and create cases for investigation with powerful detection tools',
        features: [
          'Case management dashboard',
          'Bulk image upload',
          'Analysis queue management',
          'Chain of custody tracking'
        ],
        screenshot: 'assets/images/roles/investigator.png'
      },
      {
        icon: 'science',
        title: 'Expert',
        description: 'Analyze images with advanced tools and provide professional assessments',
        features: [
          'Advanced analysis workbench',
          'Annotation tools',
          'Forensic filter suite',
          'Historical case comparison'
        ],
        screenshot: 'assets/images/roles/Expert.png'
      },
      {
        icon: 'balance',
        title: 'Lawyer',
        description: 'Access case materials and prepare legal documentation based on findings',
        features: [
          'Case evidence viewer',
          'Expert testimony access',
          'Document preparation tools',
          'Client sharing portal'
        ],
        screenshot: 'assets/images/roles/Lawyer.png'
      },
      {
        icon: 'gavel',
        title: 'Judge',
        description: 'Review comprehensive analysis and make informed decisions',
        features: [
          'Case summary dashboard',
          'Evidence comparison tools',
          'Expert qualification review',
          'Methodology verification'
        ],
        screenshot: 'assets/images/roles/judge.png'
      }
    ];
  }

  // Testimonials
  getTestimonials() {
    return [
      {
        quote: "The detailed reports from FIDS are invaluable in court. Presenting clear, objective analysis of image manipulation significantly strengthens our cases and ensures evidence integrity.",
        name: "Mr. Amine Fathallah",
        role: "Senior Prosecutor, Digital Crimes Unit", // Updated Role
        avatar: "assets/images/testimonials/testimonial-1.jpg" // Keep placeholder, replace with actual image if available
      },
      {
        quote: "As a digital forensics expert, FIDS is indispensable. Its AI catches subtle manipulations, and the suite of analysis tools allows for deep, verifiable investigation. It's raised the bar for image authentication.",
        name: "Dr. Riadh Belgassem",
        role: "Certified Forensic Image Analyst", // Updated Role
        avatar: "assets/images/testimonials/testimonial-2.jpg" // Keep placeholder
      },
      {
        quote: "FIDS streamlines our entire investigative workflow for image evidence. From secure upload to rapid AI analysis and clear reporting, it saves my team countless hours and improves our case turnaround time.",
        name: "Mr. Nadhem Benhadjali",
        role: "Lead Investigator, Cyber Forensics Division",
        avatar: "assets/images/testimonials/testimonial-3.jpg"
      },
      {
        quote: "Developing the core analysis engine for FIDS was challenging but rewarding. Seeing our blend of AI models and forensic techniques provide such reliable results for users is fantastic.",
        name: "Mr. Mohammed Aziz Souid",
        role: "Lead AI Engineer, FIDS Development Team",
        avatar: "assets/images/testimonials/testimonial-4.jpg"
      },
      {
        quote: "In the courtroom, clarity is paramount. FIDS provides concise, understandable reports backed by solid science, enabling informed judicial decisions regarding disputed image evidence.",
        name: "Mrs. Siwar Haddad",
        role: "Presiding Judge, Technology Court",
        avatar: "assets/images/testimonials/testimonial-5.jpg"
      },
      {
        quote: "We built FIDS to bring trust back to visual evidence in critical proceedings. Seeing its adoption and impact across different legal roles confirms the vital need for this technology.",
        name: "Mr. Krifi Khalil",
        role: "Founder & Chief Scientist, FIDS",
        avatar: "assets/images/testimonials/testimonial-6.jpg"
      }
    ];
  }
}
