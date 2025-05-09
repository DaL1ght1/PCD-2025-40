import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../core/services/auth.service';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {animate, style, transition, trigger} from '@angular/animations';
import {interval, Subscription} from 'rxjs';
import {MockDataService} from './components/mock-data/mock-data.service';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface WorkflowStep {
  title: string;
  description: string;
  visual: string;
}

interface Role {
  icon: string;
  title: string;
  description: string;
  features: string[];
  screenshot: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

interface PartnerLogo {
  name: string;
  src: string;
}

interface AnalysisMarker {
  x: number;
  y: number;
  size: number;
  color: string;
}

@Component({
  selector: 'app-workflow-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('600ms ease-out', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  // Authentication
  isAuthenticated = false;
  currentUser: any = null;
  currentYear: number = new Date().getFullYear();

  // UI State
  isScrolled = false;
  menuOpen = false;

  // Animation Elements
  particles: Particle[] = [];
  analysisMarkers: AnalysisMarker[] = [];

  // Workflow Steps
  activeStep = 0;
  workflowInterval: Subscription | null = null;
  workflowSteps: WorkflowStep[] = [];

  // User Roles
  activeRole = 0;
  roles: Role[] = [];

  // Features
  features: Feature[] = [
    {
      icon: 'auto_fix_high', // Represents AI/Automation
      title: 'AI-Powered Falsification Detection',
      description: 'Leverage advanced AI models to detect subtle manipulation signatures invisible to the naked eye.'
    },
    {
      icon: 'shield', // Represents Security/Management
      title: 'Secure Evidence Management',
      description: 'Upload, store, and track images securely with a verifiable chain of custody.'
    },
    {
      icon: 'assessment', // Represents Reports/Analysis
      title: 'Comprehensive Analysis Reports',
      description: 'Generate detailed, customizable reports documenting analysis findings, methodology, and expert opinions.'
    },
    {
      icon: 'account_tree', // Represents Workflow/Roles
      title: 'Role-Based Workflow',
      description: 'Tailored interfaces and tools streamline the process for Investigators, Experts, Lawyers, and Judges.'
    },
    {
      icon: 'summarize', // Represents Metadata/Details
      title: 'Image Metadata Analysis',
      description: 'Extract and analyze EXIF, IPTC, and other metadata for inconsistencies and origin verification.'
    },
    {
      icon: 'visibility', // Represents Explainability/Insight
      title: 'Explainable AI (XAI) Visualizations',
      description: 'Understand AI decisions with integrated visualizations like Grad-CAM, LIME, and SHAP.'
    }
  ];

  // Testimonials
  currentSlide = 0;
  testimonialsTranslate = 0;
  testimonialInterval: Subscription | null = null;
  testimonials: Testimonial[] = [];
  numberOfSlides = 0

  get testimonialDots(): number[] {
    return Array(this.numberOfSlides).fill(0).map((_, i) => i);
  }

  // Partner Logos
  partnerLogos: PartnerLogo[] = [];

  // Navigation links
  navLinks = [
    { title: 'Features', href: '#features' },
    { title: 'How It Works', href: '#workflow' },
    { title: 'User Roles', href: '#roles' }
  ];

  // Footer links
  platformLinks = [
    { title: 'Features', routerLink: '/features' },
    { title: 'How It Works', routerLink: '/how-it-works' },
    { title: 'Security', routerLink: '/security' },
    { title: 'Pricing', routerLink: '/pricing' }
  ];

  resourceLinks = [
    { title: 'Documentation', routerLink: '/docs' },
    { title: 'API', routerLink: '/api' },
    { title: 'Blog', routerLink: '/blog' },
    { title: 'Support', routerLink: '/support' }
  ];

  companyLinks = [
    { title: 'About Us', routerLink: '/about' },
    { title: 'Careers', routerLink: '/careers' },
    { title: 'Contact', routerLink: '/contact' },
    { title: 'Legal', routerLink: '/legal' }
  ];

  legalLinks = [
    { title: 'Privacy Policy', routerLink: '/privacy' },
    { title: 'Terms of Service', routerLink: '/terms' },
    { title: 'Cookies', routerLink: '/cookies' }
  ];

  socialLinks = [
    { icon: 'fab fa-twitter', href: 'https://twitter.com/fids' },
    { icon: 'fab fa-linkedin', href: 'https://linkedin.com/company/fids' },
    { icon: 'fab fa-facebook', href: 'https://facebook.com/fids' },
    { icon: 'fab fa-instagram', href: 'https://instagram.com/fids' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private mockDataService: MockDataService
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.isAuthenticated = this.authService.isAuthenticated();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    // Load data from service
    this.workflowSteps = this.mockDataService.getWorkflowSteps();
    this.roles = this.mockDataService.getRoles();
    this.testimonials = this.mockDataService.getTestimonials();
    this.partnerLogos = this.mockDataService.getPartnerLogos();

    // Initialize animations
    this.generateParticles();
    this.generateAnalysisMarkers();

    // Start timers for animations
    this.startWorkflowInterval();
    this.numberOfSlides = Math.ceil(this.testimonials.length / 2);
    this.startTestimonialInterval();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.workflowInterval) {
      this.workflowInterval.unsubscribe();
    }
    if (this.testimonialInterval) {
      this.testimonialInterval.unsubscribe();
    }
  }

  // Scroll detection for navbar
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  // Menu toggle
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }

  closeMenu(): void {
    this.menuOpen = false;
    document.body.classList.remove('menu-open');
  }

  // Authentication methods
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Particles animation
  generateParticles(): void {
    this.particles = Array(30).fill(0).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }

  // Analysis markers
  generateAnalysisMarkers(): void {
    this.analysisMarkers = [
      {x: 25, y: 15, size: 8, color: '#FF4B4B'},
      {x: 68, y: 32, size: 12, color: '#FF4B4B'},
      {x: 42, y: 58, size: 10, color: '#FFA64B'},
      {x: 78, y: 65, size: 14, color: '#FFA64B'},
      {x: 35, y: 78, size: 8, color: '#FF4B4B'}
    ];
  }

  // Workflow steps
  startWorkflowInterval(): void {
    this.workflowInterval = interval(5000).subscribe(() => {
      this.activeStep = (this.activeStep + 1) % this.workflowSteps.length;
    });
  }

  setActiveStep(index: number): void {
    this.activeStep = index;
    // Reset the interval when manually changed
    if (this.workflowInterval) {
      this.workflowInterval.unsubscribe();
      this.startWorkflowInterval();
    }
  }

  getProgressWidth(index: number): number {
    if (index < this.activeStep) {
      return 100;
    } else if (index === this.activeStep) {
      return 50;
    } else {
      return 0;
    }
  }

  // Role tabs
  setActiveRole(index: number): void {
    this.activeRole = index;
  }

  // Testimonial slider
  startTestimonialInterval(): void {
    if (this.numberOfSlides <= 1) return; // No need to interval if only one slide
    this.testimonialInterval = interval(8000).subscribe(() => {
      this.nextTestimonial();
    });
  }

  nextTestimonial(): void {
    if (this.numberOfSlides <= 1) return;
    this.currentSlide = (this.currentSlide + 1) % this.numberOfSlides;
    this.updateTestimonialPosition();
    this.resetTestimonialInterval();
  }

  prevTestimonial(): void {
    if (this.numberOfSlides <= 1) return;
    this.currentSlide = (this.currentSlide - 1 + this.numberOfSlides) % this.numberOfSlides;
    this.updateTestimonialPosition();
    this.resetTestimonialInterval();
  }

  goToTestimonial(index: number): void {
    if (index >= 0 && index < this.numberOfSlides) {
      this.currentSlide = index;
      this.updateTestimonialPosition();
      this.resetTestimonialInterval();
    }
  }

  updateTestimonialPosition(): void {
    // Assuming each slide takes 100% width (displaying 2 items at 50% each on wider screens)
    this.testimonialsTranslate = -100 * this.currentSlide;
  }

  resetTestimonialInterval(): void {
    if (this.testimonialInterval) {
      this.testimonialInterval.unsubscribe();
    }
    this.startTestimonialInterval();
  }
  subscribeToNewsletter(email: string): void {
    console.log('Subscribing email:', email);
  }
}
