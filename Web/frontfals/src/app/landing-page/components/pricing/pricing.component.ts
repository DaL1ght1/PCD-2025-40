import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class PricingComponent {
  plans = [
    {
      name: 'Basic',
      price: '99TND',
      period: 'per month',
      description: 'For individuals and small teams getting started with image verification',
      features: [
        'Up to 50 image analyses per month',
        'AI-powered detection',
        'Basic reporting',
        'Email support',
        '1 user account'
      ],
      cta: 'Start Free Trial',
      highlight: false
    },
    {
      name: 'Professional',
      price: '299TND',
      period: 'per month',
      description: 'For professional investigators and legal teams with regular verification needs',
      features: [
        'Up to 200 image analyses per month',
        'Advanced detection features',
        'Court-ready reporting',
        'Priority support',
        'Up to 5 user accounts',
        'Case management',
        'API access'
      ],
      cta: 'Start Free Trial',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'tailored pricing',
      description: 'For organizations with high-volume needs and custom requirements',
      features: [
        'Unlimited image analyses',
        'Full feature access',
        'Custom reporting',
        'Dedicated support manager',
        'Unlimited user accounts',
        'Advanced case management',
        'Custom API integration',
        'On-premise deployment options',
        'Custom SLA'
      ],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  faqs = [
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes, we offer a 20% discount when you choose annual billing for any of our plans.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan at any time. If you upgrade, you\'ll be charged the prorated difference. If you downgrade, the new rate will apply at the start of your next billing cycle.'
    },
    {
      question: 'What happens if I exceed my monthly analysis limit?',
      answer: 'If you reach your monthly limit, you can purchase additional analyses at a per-image rate, or upgrade to a higher tier plan.'
    },
    {
      question: 'Do you offer special pricing for government or educational institutions?',
      answer: 'Yes, we offer special rates for government agencies, educational institutions, and non-profit organizations. Please contact our sales team for details.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a 14-day free trial of our Professional plan with no credit card required. This includes 20 image analyses to help you evaluate our service.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual Enterprise plans.'
    }
  ];
}
