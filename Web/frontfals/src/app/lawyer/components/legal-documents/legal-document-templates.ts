import { DocumentTemplate } from '../../../core/models/lawyer.model';

// Define the templates array
export const LAWYER_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // --- Motions ---
  {
    id: 'template-motion-exclude',
    name: 'Motion to Exclude Image Evidence',
    description: 'Motion to exclude specific photographic evidence based on FIDS analysis indicating manipulation.',
    category: 'Motions',
    content: `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">
        <p style="text-align: center;"><strong>[COURT NAME]</strong><br>
        [Jurisdiction, e.g., County of Example, State of Example]</p>
        <br>
        <p>
          [Plaintiff Name(s)],<br>
          Plaintiff(s),<br>
          <br>
          v.<br>
          <br>
          [Defendant Name(s)],<br>
          Defendant(s).
        </p>
        <p style="text-align: right;">Case No.: <span class="placeholder">[Case Number]</span></p>
        <br>
        <p style="text-align: center;"><strong>MOTION TO EXCLUDE PROFFERED PHOTOGRAPHIC EVIDENCE<br>DUE TO FALSIFICATION/MANIPULATION</strong></p>
        <br>
        <p>COMES NOW <span class="placeholder">[Your Client's Name/Party You Represent]</span>, by and through undersigned counsel, <span class="placeholder">[Your Law Firm Name]</span>, and respectfully moves this Honorable Court, pursuant to <span class="placeholder">[Relevant Rule of Evidence, e.g., Rule 901, Rule 403]</span> of the <span class="placeholder">[Jurisdiction]</span> Rules of Evidence, for an Order excluding the photographic evidence identified as <span class="placeholder">[Exhibit Number or Image Identifier]</span> ("the Image"), proffered by <span class="placeholder">[Opposing Party Name]</span>, on the grounds that the Image lacks authenticity due to digital manipulation, and its probative value is substantially outweighed by the danger of unfair prejudice, confusion of the issues, and misleading the jury.</p>
        <p>In support of this Motion, <span class="placeholder">[Your Client's Name/Party]</span> states as follows:</p>
        <ol>
          <li>The Image, purported to depict <span class="placeholder">[Briefly describe what the image allegedly shows]</span>, is critical to <span class="placeholder">[Opposing Party Name]</span>'s case regarding <span class="placeholder">[Issue the image relates to]</span>.</li>
          <li><span class="placeholder">[Your Client's Name/Party]</span> commissioned an analysis of the Image utilizing the Falsified Image Detection System (FIDS), a scientifically recognized platform for detecting digital image manipulation.</li>
          <li>The analysis was conducted by <span class="placeholder">[Expert Name]</span>, a qualified expert in digital image forensics. A copy of the Expert Report, detailing the methodology and findings, is attached hereto as Exhibit A <span class="placeholder">[or reference previously filed report]</span>.</li>
          <li>The FIDS analysis and subsequent expert review revealed significant indicators of manipulation within the Image, including, but not limited to: <span class="placeholder">[Summarize key findings, e.g., evidence of cloning in specific regions, inconsistent lighting patterns, metadata anomalies, ELA inconsistencies]</span>. (See Expert Report, Exhibit A, pp. <span class="placeholder">[Page Numbers]</span>).</li>
          <li>Based on these findings, <span class="placeholder">[Expert Name]</span> concluded with a reasonable degree of scientific certainty that the Image has been materially altered from its original state and is not an authentic representation of the scene it purports to depict. (Expert Report, Exhibit A, p. <span class="placeholder">[Page Number]</span>).</li>
          <li>Under <span class="placeholder">[Jurisdiction]</span> Rule of Evidence <span class="placeholder">[e.g., 901]</span>, the proponent of evidence must produce evidence sufficient to support a finding that the item is what the proponent claims it is. Given the compelling evidence of manipulation, <span class="placeholder">[Opposing Party Name]</span> cannot meet this burden of authentication.</li>
          <li>Furthermore, pursuant to <span class="placeholder">[Jurisdiction]</span> Rule of Evidence <span class="placeholder">[e.g., 403]</span>, even if minimally relevant, the Image's probative value is substantially outweighed by the danger of unfair prejudice, confusion, and misleading the trier of fact, as it presents a falsified depiction of events.</li>
        </ol>
        <p>WHEREFORE, <span class="placeholder">[Your Client's Name/Party]</span> respectfully requests this Court grant this Motion and issue an Order excluding the photographic evidence identified as <span class="placeholder">[Exhibit Number or Image Identifier]</span> from admission at trial, and for such other relief as the Court deems just and proper.</p>
        <br>
        <p>Respectfully submitted,</p>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Your Name]</span> (<span class="placeholder">[Your Bar Number]</span>)<br>
        <span class="placeholder">[Your Law Firm Name]</span><br>
        <span class="placeholder">[Your Address]</span><br>
        <span class="placeholder">[Your Phone Number]</span><br>
        <span class="placeholder">[Your Email Address]</span><br>
        <em>Counsel for <span class="placeholder">[Your Client's Name/Party]</span></em></p>
        <br>
        <p>Date: <span class="placeholder">[Date]</span></p>
        <br>
        <p><strong>CERTIFICATE OF SERVICE</strong></p>
        <p>I hereby certify that on this <span class="placeholder">[Date]</span> day of <span class="placeholder">[Month]</span>, <span class="placeholder">[Year]</span>, a true and correct copy of the foregoing Motion was served upon opposing counsel via <span class="placeholder">[Method of Service, e.g., email, mail, court filing system]</span> at:</p>
        <p><span class="placeholder">[Opposing Counsel Name]</span><br>
        <span class="placeholder">[Opposing Counsel Address]</span><br>
        <span class="placeholder">[Opposing Counsel Email]</span></p>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Your Name]</span></p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  },
  {
    id: 'template-affidavit-expert',
    name: 'Affidavit of Expert Witness',
    description: 'Affidavit template for the forensic expert detailing their qualifications and findings based on FIDS.',
    category: 'Affidavits',
    content: `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">
        <p style="text-align: center;"><strong>[COURT NAME]</strong><br>
        [Jurisdiction]</p>
        <br>
        <p>
          [Plaintiff Name(s)], Plaintiff(s),<br>
          v.<br>
          [Defendant Name(s)], Defendant(s).
        </p>
        <p style="text-align: right;">Case No.: <span class="placeholder">[Case Number]</span></p>
        <br>
        <p style="text-align: center;"><strong>AFFIDAVIT OF <span class="placeholder">[EXPERT NAME]</span></strong></p>
        <br>
        <p>STATE OF <span class="placeholder">[State]</span>)<br>
           COUNTY OF <span class="placeholder">[County]</span>)</p>
        <br>
        <p>BEFORE ME, the undersigned authority, personally appeared <span class="placeholder">[Expert Name]</span>, who, being duly sworn, deposes and states as follows:</p>
        <ol>
          <li>My name is <span class="placeholder">[Expert Name]</span>. I am over the age of 18 and competent to make this affidavit. The statements herein are based on my personal knowledge.</li>
          <li>My professional address is <span class="placeholder">[Expert's Business Address]</span>.</li>
          <li>I hold a <span class="placeholder">[Degree(s) Held, e.g., Ph.D. in Computer Science]</span> from <span class="placeholder">[University Name]</span> and possess certifications in <span class="placeholder">[Relevant Certifications, e.g., Certified Forensic Computer Examiner (CFCE)]</span>. My curriculum vitae detailing my qualifications, experience, and publications is attached hereto as Exhibit 1.</li>
          <li>I have specialized expertise in the field of digital image forensics, including the analysis of image authenticity and the detection of digital manipulation.</li>
          <li>I was retained by <span class="placeholder">[Your Law Firm Name]</span>, counsel for <span class="placeholder">[Your Client's Name/Party]</span>, in the above-captioned matter to analyze the authenticity of digital photographic evidence identified as <span class="placeholder">[Exhibit Number or Image Identifier]</span> ("the Image").</li>
          <li>In conducting my analysis, I utilized the Falsified Image Detection System (FIDS), a suite of scientifically validated tools for digital image forensic analysis, along with standard forensic practices. My methodology is detailed in my formal report, attached hereto as Exhibit 2 <span class="placeholder">[or reference previously filed report]</span>.</li>
          <li>Based upon my analysis using FIDS and my expertise, I identified the following indicators of manipulation in the Image: <span class="placeholder">[List key findings concisely, e.g., Inconsistent noise patterns across regions X and Y; Evidence of object removal/insertion at coordinates (a,b); Metadata inconsistencies suggesting modification after capture; Error Level Analysis (ELA) discrepancies indicating differential compression]</span>.</li>
          <li>These findings are inconsistent with an original, unaltered image captured directly from a digital camera or source device.</li>
          <li>It is my opinion, based upon a reasonable degree of scientific certainty in the field of digital image forensics, that the Image has been subjected to digital manipulation and does not accurately represent the scene or subject matter it purports to depict as originally captured.</li>
        </ol>
        <br>
        <p>Further Affiant sayeth naught.</p>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Expert Name]</span></p>
        <br>
        <p>Sworn to and subscribed before me this <span class="placeholder">[Day]</span> day of <span class="placeholder">[Month]</span>, <span class="placeholder">[Year]</span>.</p>
        <br>
        <p>_____________________________<br>
        Notary Public<br>
        My Commission Expires: <span class="placeholder">[Notary Expiration Date]</span></p>
        <p>[Notary Seal]</p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  },
  {
    id: 'template-expert-engagement',
    name: 'Expert Engagement Letter/Analysis Request',
    description: 'Letter to engage a forensic expert and request analysis using FIDS.',
    category: 'Expert Engagement',
    content: `
      <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
        <p><span class="placeholder">[Date]</span></p>
        <br>
        <p><span class="placeholder">[Expert Name]</span><br>
        <span class="placeholder">[Expert Title/Company]</span><br>
        <span class="placeholder">[Expert Address]</span></p>
        <br>
        <p><strong>Re: Engagement for Forensic Image Analysis</strong><br>
           <strong>Case:</strong> <span class="placeholder">[Case Name]</span>, Case No. <span class="placeholder">[Case Number]</span><br>
           <strong>Client:</strong> <span class="placeholder">[Your Client's Name]</span><br>
           <strong>Image(s) for Analysis:</strong> <span class="placeholder">[Image Identifier(s) or Exhibit Number(s)]</span></p>
        <br>
        <p>Dear <span class="placeholder">[Mr./Ms./Dr. Expert Last Name]</span>:</p>
        <p>This letter confirms the engagement of your services by <span class="placeholder">[Your Law Firm Name]</span> on behalf of our client, <span class="placeholder">[Your Client's Name]</span>, in connection with the above-referenced legal matter.</p>
        <p>We request that you conduct a forensic analysis of the digital image(s) identified above ("the Image(s)") to determine their authenticity and to identify any potential evidence of digital manipulation or falsification. We specifically request that your analysis incorporate the capabilities of the Falsified Image Detection System (FIDS) platform, in addition to standard forensic methodologies.</p>
        <p>The scope of your analysis should include, but is not limited to:</p>
        <ul>
          <li>Metadata examination (EXIF, IPTC, XMP, etc.)</li>
          <li>Error Level Analysis (ELA)</li>
          <li>Noise analysis</li>
          <li>Compression artifact analysis</li>
          <li>Lighting and shadow consistency analysis</li>
          <li>Detection of cloning, splicing, or object removal/insertion</li>
          <li>Any other relevant forensic tests available through FIDS or standard practice.</li>
        </ul>
        <p>Please provide us with a comprehensive written report detailing your methodology, findings, supporting data (including relevant FIDS outputs), and your expert opinion regarding the authenticity and integrity of the Image(s). The report should be suitable for potential submission as evidence.</p>
        <p>We have enclosed <span class="placeholder">[or state method of delivery, e.g., a secure link to]</span> the Image(s) for your review. Please confirm receipt and provide an estimated timeframe for completion and your fee schedule.</p>
        <p>Your work will be conducted under the attorney work-product doctrine and attorney-client privilege, as applicable. Please direct all communications regarding this matter to me.</p>
        <p>Thank you for your assistance. We look forward to working with you.</p>
        <br>
        <p>Sincerely,</p>
        <br>
        <p><span class="placeholder">[Your Name]</span><br>
        <span class="placeholder">[Your Title]</span><br>
        <span class="placeholder">[Your Law Firm Name]</span></p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  },
  {
    id: 'template-notice-intent',
    name: 'Notice of Intent to Use Expert Report',
    description: 'Formal notice to the court and opposing counsel of the intent to use the FIDS expert report.',
    category: 'Evidence Submission',
    content: `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">
        <p style="text-align: center;"><strong>[COURT NAME]</strong><br>
        [Jurisdiction]</p>
        <br>
        <p>
          [Plaintiff Name(s)], Plaintiff(s),<br>
          v.<br>
          [Defendant Name(s)], Defendant(s).
        </p>
        <p style="text-align: right;">Case No.: <span class="placeholder">[Case Number]</span></p>
        <br>
        <p style="text-align: center;"><strong>NOTICE OF INTENT TO USE EXPERT REPORT AND TESTIMONY</strong></p>
        <br>
        <p>PLEASE TAKE NOTICE that <span class="placeholder">[Your Client's Name/Party You Represent]</span>, through undersigned counsel, hereby provides notice, pursuant to <span class="placeholder">[Relevant Rule, e.g., Rule 26(a)(2)]</span> of the <span class="placeholder">[Jurisdiction]</span> Rules of Civil Procedure, of its intent to rely upon the expert report and potential testimony of <span class="placeholder">[Expert Name]</span> concerning the forensic analysis of digital image evidence in the above-captioned matter.</p>
        <p>The expert analysis pertains to the digital image(s) identified as <span class="placeholder">[Exhibit Number(s) or Image Identifier(s)]</span>.</p>
        <p>The expert utilized the Falsified Image Detection System (FIDS) among other standard forensic techniques.</p>
        <p>A true and correct copy of the Expert Report prepared by <span class="placeholder">[Expert Name]</span>, dated <span class="placeholder">[Date of Report]</span>, along with the expert's curriculum vitae, <span class="placeholder">[is attached hereto / was previously served on [Date Served]]</span>.</p>
        <p>The subject matter on which the expert is expected to testify includes the methodology employed, the findings of the forensic image analysis, the identification of manipulation indicators, and the expert's opinion regarding the authenticity and integrity of the analyzed image(s).</p>
        <br>
        <p>Dated: <span class="placeholder">[Date]</span></p>
        <br>
        <p>Respectfully submitted,</p>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Your Name]</span> (<span class="placeholder">[Your Bar Number]</span>)<br>
        <span class="placeholder">[Your Law Firm Name]</span><br>
        <span class="placeholder">[Your Address]</span><br>
        <em>Counsel for <span class="placeholder">[Your Client's Name/Party]</span></em></p>
        <br>
        <p><strong>CERTIFICATE OF SERVICE</strong></p>
        <p>I hereby certify that on this <span class="placeholder">[Date]</span> day of <span class="placeholder">[Month]</span>, <span class="placeholder">[Year]</span>, a true copy of the foregoing Notice was served upon opposing counsel via <span class="placeholder">[Method of Service]</span>.</p>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Your Name]</span></p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  },
  {
    id: 'template-letter-opposing',
    name: 'Letter to Opposing Counsel re: Image Concerns',
    description: 'Letter outlining concerns about image authenticity based on FIDS analysis.',
    category: 'Communication',
    content: `
      <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
        <p><span class="placeholder">[Date]</span></p>
        <br>
        <p><strong>VIA <span class="placeholder">[Method, e.g., EMAIL & CERTIFIED MAIL]</span></strong></p>
        <p><span class="placeholder">[Opposing Counsel Name]</span><br>
        <span class="placeholder">[Opposing Counsel Law Firm]</span><br>
        <span class="placeholder">[Opposing Counsel Address]</span></p>
        <br>
        <p><strong>Re: <span class="placeholder">[Case Name]</span>, Case No. <span class="placeholder">[Case Number]</span></strong><br>
           <strong>Authenticity Concerns Regarding Photographic Evidence <span class="placeholder">[Exhibit Number or Image Identifier]</span></strong></p>
        <br>
        <p>Dear <span class="placeholder">[Mr./Ms. Opposing Counsel Last Name]</span>:</p>
        <p>This correspondence addresses the photographic evidence identified as <span class="placeholder">[Exhibit Number or Image Identifier]</span> ("the Image"), which your client has proffered in the above-referenced matter.</p>
        <p>We have obtained a forensic analysis of the Image conducted by expert <span class="placeholder">[Expert Name]</span>, utilizing the Falsified Image Detection System (FIDS). The preliminary findings <span class="placeholder">[or state if final report is attached/served]</span> raise significant concerns regarding the authenticity and integrity of the Image.</p>
        <p>The analysis indicates <span class="placeholder">[Briefly summarize key concerns, e.g., strong evidence of digital manipulation, inconsistencies suggesting image splicing, metadata anomalies indicative of post-capture editing]</span>. A full report detailing these findings will be provided <span class="placeholder">[or state if attached/served]</span>.</p>
        <p>Given these findings, we have serious doubts as to the admissibility of the Image under the <span class="placeholder">[Jurisdiction]</span> Rules of Evidence, particularly regarding authentication (<span class="placeholder">[Rule 901]</span>) and potential for unfair prejudice (<span class="placeholder">[Rule 403]</span>).</p>
        <p>We request that you review these findings and reconsider the proffer of the Image as evidence. We are prepared to file a formal Motion to Exclude if necessary. We propose discussing this matter further at your earliest convenience to potentially resolve this evidentiary issue without court intervention.</p>
        <p>Please respond by <span class="placeholder">[Response Deadline Date]</span> regarding your position on this matter.</p>
        <br>
        <p>Sincerely,</p>
        <br>
        <p><span class="placeholder">[Your Name]</span><br>
        <span class="placeholder">[Your Law Firm Name]</span></p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  },
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a blank document to create custom legal content.',
    category: 'Custom',
    content: `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">
        <p style="text-align: center;"><strong><span class="placeholder">[DOCUMENT TITLE]</span></strong></p>
        <br>
        <p><span class="placeholder">[Start typing your document content here...]</span></p>
        <br>
        <br>
        <p>_____________________________<br>
        <span class="placeholder">[Your Name]</span> (<span class="placeholder">[Your Bar Number]</span>)<br>
        <span class="placeholder">[Your Law Firm Name]</span></p>
        <br>
        <p>Date: <span class="placeholder">[Date]</span></p>
      </div>
    `,
    metadata: { version: '1.0', jurisdiction: 'General', author: 'FIDS Legal Team' }
  }
];
