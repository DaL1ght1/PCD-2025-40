import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ContactComponent {
  contactForm = {
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    reason: 'general'
  };

  contactReasons = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'sales', label: 'Sales Information' },
    { value: 'support', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership Opportunity' },
    { value: 'press', label: 'Press & Media' },
    { value: 'careers', label: 'Careers' }
  ];

  offices = [
    {
      city: 'Tunisia',
      address: 'Campus Universitaire de, Manouba 2010',
      phone: '+216 71 71 71 71',
      email: 'pcdjudge@gmail.com',
      hours: 'Monday-Friday: 9am-4pm '
    },

  ];

  faqs = [
    {
      question: 'How quickly will I receive a response?',
      answer: 'We aim to respond to all inquiries within 24 business hours. For urgent matters, please call our support line directly.'
    },
    {
      question: 'Can I schedule a demo of your platform?',
      answer: 'Yes, you can request a demo by selecting "Sales Information" as your inquiry reason. One of our representatives will contact you to schedule a personalized demonstration.'
    },
    {
      question: 'Do you offer technical support outside business hours?',
      answer: 'Enterprise clients have access to 24/7 emergency support. For all other clients, we offer standard support during business hours with next-business-day response for after-hours inquiries.'
    },
    {
      question: 'How can I report a security vulnerability?',
      answer: 'Please email security@fids.io directly with details of the vulnerability. Do not include sensitive information in this form.'
    }
  ];

  submitForm() {
    // Implement form submission logic
    console.log('Form submitted:', this.contactForm);
    // Reset form after submission
    this.contactForm = {
      name: '',
      email: '',
      company: '',
      phone: '',
      subject: '',
      message: '',
      reason: 'general'
    };
    alert('Your message has been sent. We will get back to you shortly.');
  }
}
