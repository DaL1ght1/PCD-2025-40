import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page.component';
import { FeaturesComponent } from './components/features/features.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { SecurityComponent } from './components/security/security.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { ApiComponent } from './components/api/api.component';
import { BlogComponent } from './components/blog/blog.component';
import { SupportComponent } from './components/support/support.component';
import { CareersComponent } from './components/careers/careers.component';
import { ContactComponent } from './components/contact/contact.component';
import { AboutComponent } from './components/about/about.component';

export const LANDING_ROUTES: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'features', component: FeaturesComponent },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'security', component: SecurityComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'docs', component: DocumentationComponent },
  { path: 'api', component: ApiComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'support', component: SupportComponent },
  { path: 'about', component: AboutComponent },
  { path: 'careers', component: CareersComponent },
  { path: 'contact', component: ContactComponent },
];
