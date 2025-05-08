// import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '../../../core/services/auth.service';
// import { CommonModule, NgOptimizedImage } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { trigger, transition, style, animate } from '@angular/animations';
//
// interface Particle {
//   x: number;
//   y: number;
//   size: number;
//   speed: number;
//   opacity: number;
// }
//
// interface Faq {
//   question: string;
//   answer: string;
// }
//
// interface FormData {
//   name: string;
//   email: string;
//   subject: string;
//   role: string;
//   message: string;
// }
//
// @Component({
//   selector: 'app-contact',
//   templateUrl: './contact.component.html',
//   styleUrls: ['./contact.component.scss'],
//   standalone: true,
//   imports: [CommonModule, RouterModule, NgOptimizedImage, FormsModule],
//   animations: [
//     trigger('fadeInOut', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('600ms ease-in', style({ opacity: 1 })),
//       ]),
//       transition(':leave', [
//         animate('600ms ease-out', style({ opacity: 0 })),
//       ]),
//     ]),
//   ],
// })
// export class ContactComponent implements OnInit, OnDestroy {
//   // Authentication
//   isAuthenticated = false;
//   currentUser: any = null;
//   currentYear: number = new Date().getFullYear();
//
//   // UI State
//   isScrolled = false;
//   menuOpen = false;
//   activeFaq: number | null = null;
//
//   // Animation Elements
//   particles: Particle[] = [];
//
//   // Form Data
//   formData: FormData = {
//     name: '',
//     email: '',
//     subject: '',
//     role: '',
//     message: '',
//   };
//
//   // FAQs
//   faqs: Faq[] = [
//     {
//       question: 'What is the response time for inquiries?',
//       answer: 'Our team typically responds within 24 hours during business days.',
//     },
//     {
//       question: 'Can I schedule a demo of FIDS?',
//       answer: 'Yes, you can schedule a demo by selecting "See Demo" or contacting our sales team.',
//     },
//     {
//       question: 'What roles does FIDS support?',
//       answer: 'FIDS supports investigators, experts, lawyers, and judges with tailored interfaces.',
//     },
//     {
//       question: 'Is there a free trial available?',
//       answer: 'Yes, we offer a free trial. Sign up to get started.',
//     },
//   ];
//
//   constructor(private authService: AuthService, private router: Router) {}
//
//   ngOnInit(): void {
//     // Check authentication status
//     this.isAuthenticated = this.authService.isAuthenticated();
//     this.authService.currentUser$.subscribe((user) => {
//       this.currentUser = user;
//     });
//
//     // Initialize animations
//     this.generateParticles();
//   }
//
//   ngOnDestroy(): void {}
//
//   // Scroll detection for navbar
//   @HostListener('window:scroll')
//   onWindowScroll(): void {
//     this.isScrolled = window.scrollY > 50;
//   }
//
//   // Menu toggle
//   toggleMenu(): void {
//     this.menuOpen = !this.menuOpen;
//     if (this.menuOpen) {
//       document.body.classList.add('menu-open');
//     } else {
//       document.body.classList.remove('menu-open');
//     }
//   }
//
//   closeMenu(): void {
//     this.menuOpen = false;
//     document.body.classList.remove('menu-open');
//   }
//
//   // Authentication methods
//   logout(): void {
//     this.authService.logout();
//     this.router.navigate(['/login']);
//   }
//
//   navigateToDashboard(): void {
//     this.router.navigate(['/dashboard']);
//   }
//
//   // Particles animation
//   generateParticles(): void {
//     this.particles = Array(30)
//       .fill(0)
//       .map(() => ({
//         x: Math.random() * 100,
//         y: Math.random() * 100,
//         size: Math.random() * 4 + 1,
//         speed: Math.random() * 0.5 + 0.1,
//         opacity: Math.random() * 0.5 + 0.1,
//       }));
//   }
//
//   // FAQ toggle
//   toggleFaq(index: number): void {
//     this.activeFaq = this.activeFaq === index ? null : index;
//   }
//
//   // Form submission
//   onSubmit(): void {
//     if (
//       this.formData.name &&
//       this.formData.email &&
//       this.formData.subject &&
//       this.formData.message
//     ) {
//       console.log('Form submitted:', this.formData);
//       // Here you would typically call a service to send the form data to a backend
//       alert('Thank you for your message! We will get back to you soon.');
//       this.formData = { name: '', email: '', subject: '', role: '', message: '' };
//     }
//   }
// }
