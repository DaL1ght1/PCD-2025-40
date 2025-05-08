import {Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {SlugifyPipe} from '../../../core/services/slugify.service';


@Component({
  selector: 'app-careers',
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SlugifyPipe]
})
export class CareersComponent {
  benefits = [
    {
      icon: 'health_and_safety',
      title: 'Comprehensive Healthcare',
      description: 'Full medical, dental, and vision coverage for you and your dependents.'
    },
    {
      icon: 'schedule',
      title: 'Flexible Work Hours',
      description: "Work when you're most productive with our flexible scheduling policy."
    },
    {
      icon: 'home',
      title: 'Remote-First Culture',
      description: 'Work from anywhere with our distributed team across the globe.'
    },
    {
      icon: 'school',
      title: 'Learning Stipend',
      description: '$2,000 annual budget for conferences, courses, and educational materials.'
    },
    {
      icon: 'savings',
      title: 'Competitive Compensation',
      description: 'Salary packages in the top 25% of the market plus equity options.'
    },
    {
      icon: 'battery_charging_full',
      title: 'Paid Time Off',
      description: 'Unlimited PTO policy with a 3-week minimum to ensure you recharge.'
    }
  ];

  departments = [
    {
      name: 'Engineering',
      description: 'Build the technology that powers our image analysis platform.',
      image: 'assets/images/careers/engineering.jpg',
      positions: 3
    },
    {
      name: 'Data Science',
      description: 'Develop the AI models that detect image manipulation.',
      image: 'assets/images/careers/data-science.jpg',
      positions: 2
    },
    {
      name: 'Forensic Analysis',
      description: 'Apply your expertise to verify AI findings and testify in court.',
      image: 'assets/images/careers/forensic.jpg',
      positions: 4
    },
    {
      name: 'Product',
      description: 'Shape the future of our platform and user experience.',
      image: 'assets/images/careers/product.jpg',
      positions: 1
    },
    {
      name: 'Sales & Marketing',
      description: 'Connect our solutions with legal professionals who need them.',
      image: 'assets/images/careers/sales.jpg',
      positions: 2
    },
    {
      name: 'Customer Success',
      description: 'Help our clients get the most out of our platform.',
      image: 'assets/images/careers/customer-success.jpg',
      positions: 2
    }
  ];

  openPositions = [
    {
      title: 'Senior Machine Learning Engineer',
      department: 'Engineering',
      location: 'Remote (US)',
      type: 'Full-time'
    },
    {
      title: 'Computer Vision Researcher',
      department: 'Data Science',
      location: 'Remote (Worldwide)',
      type: 'Full-time'
    },
    {
      title: 'Forensic Image Analyst',
      department: 'Forensic Analysis',
      location: 'Remote (US)',
      type: 'Full-time'
    },
    {
      title: 'Expert Witness Coordinator',
      department: 'Forensic Analysis',
      location: 'New York, NY',
      type: 'Full-time'
    },
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote (Worldwide)',
      type: 'Full-time'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote (US)',
      type: 'Full-time'
    },
    {
      title: 'Sales Director - Legal Sector',
      department: 'Sales & Marketing',
      location: 'Remote (US)',
      type: 'Full-time'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote (US)',
      type: 'Full-time'
    },
    {
      title: 'Technical Support Specialist',
      department: 'Customer Success',
      location: 'Remote (Worldwide)',
      type: 'Full-time'
    },
    {
      title: 'Digital Forensics Intern',
      department: 'Forensic Analysis',
      location: 'Remote (US)',
      type: 'Internship'
    }
  ];

  testimonials = [
    {
      quote: 'Working at FIDS has been the most rewarding experience of my career. I get to apply cutting-edge AI research to solve real-world problems that impact the justice system.',
      name: 'Dr. Maya Patel',
      role: 'Lead Data Scientist',
      avatar: 'assets/images/team/maya-patel.jpg',
      years: '3 years at FIDS'
    },
    {
      quote: "The culture at FIDS is unlike anywhere I've worked before. Everyone is passionate about our mission, and there's a genuine commitment to work-life balance and professional growth.",
      name: 'Thomas Wright',
      role: 'Senior Software Engineer',
      avatar: 'assets/images/team/thomas-wright.jpg',
      years: '2 years at FIDS'
    },
    {
      quote: 'As a former forensic analyst, joining FIDS allowed me to multiply my impact. Now I help build tools that empower thousands of legal professionals to find the truth in visual evidence.',
      name: 'Sophia Kim',
      role: 'Product Manager',
      avatar: 'assets/images/team/sophia-kim.jpg',
      years: '4 years at FIDS'
    }
  ];
}
