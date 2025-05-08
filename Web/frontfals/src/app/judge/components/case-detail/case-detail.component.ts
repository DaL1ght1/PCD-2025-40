import { Component, OnInit, AfterViewInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CaseService } from "../../../core/services/case.service";
import { ImageService } from "../../../core/services/image.service";
import { ReportService } from "../../../core/services/report.service";
import { ToastrService } from "ngx-toastr";
import { CaseDTO, CaseStatus } from "../../../core/models/case.model";
import { ImageDetails } from "../../../core/models/image.model";
import { ReportResponse, ReportComparisonResultDTO } from "../../../core/models/report.model";
import { ReportType } from "../../../core/models/report.model";
import { DatePipe, NgForOf, NgIf, NgClass, DecimalPipe } from "@angular/common";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { catchError, finalize, forkJoin, of } from "rxjs";

// Declare bootstrap variable
declare var bootstrap: any;

@Component({
  imports: [
    RouterLink,
    NgIf,
    NgClass,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    DatePipe,
    NgForOf,
    ReactiveFormsModule,
    DecimalPipe,
  ],
  standalone: true,
  selector: "app-case-detail",
  templateUrl: "./case-detail.component.html",
  styleUrls: ["./case-detail.component.scss"],
})
export class CaseDetailComponent implements OnInit, AfterViewInit {
  id = "";
  caseData: CaseDTO | null = null;
  caseImages: ImageDetails[] = [];
  caseReports: ReportResponse[] = [];
  loading = true;
  loadingImages = false;
  loadingReports = false;
  submitting = false;
  error: string | null = null;
  imageError: string | null = null;
  reportError: string | null = null;
  decisionForm: FormGroup;
  showDecisionForm = false;
  formSubmitted = false;
  reportTypes = ReportType;

  // Report comparison
  showComparisonForm = false;
  comparisonForm: FormGroup;
  comparisonResult: ReportComparisonResultDTO | null = null;
  loadingComparison = false;
  comparisonError: string | null = null;

  // Track image loading state
  imageLoadingStates: { [key: string]: boolean } = {};
  imageErrors: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private caseService: CaseService,
    private imageService: ImageService,
    private reportService: ReportService,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.decisionForm = this.fb.group({
      verdict: ["", Validators.required],
      judicialNotes: ["", [Validators.required, Validators.minLength(10)]],
    });

    this.comparisonForm = this.fb.group({
      reportId1: ["", Validators.required],
      reportId2: ["", Validators.required],
    });
  }

  // Track accordion state for each report
  accordionStates: { [key: number]: boolean } = {};

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get("id") || "";
    if (this.id) {
      this.loadCaseDetails();
    } else {
      this.error = "Case ID is missing";
      this.toastr.error(this.error, "Error");
      this.router.navigate(["/judge/reports"]);
    }
  }

  // Toggle accordion manually
  toggleReportAccordion(index: number): void {
    this.accordionStates[index] = !this.accordionStates[index];
  }

  loadCaseDetails(): void {
    this.loading = true;
    this.error = null;

    this.caseService
      .getCaseById(this.id)
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((err) => {
          this.error = "Failed to load case details: " + err.message;
          this.toastr.error(this.error, "Error");
          console.error("Error loading case details:", err);
          return of(null);
        }),
      )
      .subscribe((caseData) => {
        if (caseData) {
          this.caseData = caseData;

          // Load case images and reports in parallel
          this.loadCaseImagesAndReports(this.id);

          // Pre-fill form if there's existing data
          if (this.caseData.verdict) {
            this.decisionForm.patchValue({
              verdict: this.caseData.verdict,
              judicialNotes: this.caseData.judicialNotes || "",
            });
          }
        } else {
          this.router.navigate(["/judge/reports"]);
        }
      });
  }

  loadCaseImagesAndReports(caseId: string): void {
    console.log(`Loading images and reports for case: ${caseId}`);
    this.loadingImages = true;
    this.loadingReports = true;

    // Load both images and reports in parallel
    forkJoin({
      images: this.imageService.getImagesByCase(caseId).pipe(
        catchError((err) => {
          this.imageError = "Failed to load case images: " + err.message;
          console.error("Error loading case images:", err);
          return of([]);
        }),
      ),
      reports: this.reportService.getReportsByCase(caseId).pipe(
        catchError((err) => {
          this.reportError = "Failed to load case reports: " + err.message;
          console.error("Error loading case reports:", err);
          return of([]);
        }),
      ),
    }).subscribe({
      next: (results) => {
        console.log("forkJoin results:", results);

        // Handle images
        this.loadingImages = false;
        this.caseImages = results.images;
        console.log(`Loaded ${this.caseImages.length} images`);
        if (this.caseImages.length) {
          this.caseImages.forEach((image) => {
            this.imageLoadingStates[image.id] = true;
            this.imageErrors[image.id] = false;
          });
        }

        // Handle reports
        this.loadingReports = false;
        this.caseReports = results.reports;
        console.log(`Loaded ${this.caseReports.length} reports:`, this.caseReports);

        // Sort reports by creation date (newest first)
        this.caseReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Initialize accordion after reports are loaded
        setTimeout(() => this.initializeAccordions(), 100);
      },
      error: (err) => {
        console.error("Error in forkJoin:", err);
        this.loadingImages = false;
        this.loadingReports = false;
      },
    });
  }

  onImageLoad(imageId: string): void {
    this.imageLoadingStates[imageId] = false;
  }

  onImageError(event: Event, imageId: string): void {
    this.imageLoadingStates[imageId] = false;
    this.imageErrors[imageId] = true;
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = "assets/images/image-not-available.jpg";
    imgElement.alt = "Image not available";
  }

  toggleDecisionForm(): void {
    this.showDecisionForm = !this.showDecisionForm;
    if (!this.showDecisionForm) {
      this.formSubmitted = false;
    }
  }

  submitDecision(): void {
    this.formSubmitted = true;
    if (this.decisionForm.invalid) {
      this.toastr.error("Please complete all required fields correctly", "Form Error");
      return;
    }

    this.submitting = true;
    const { verdict, judicialNotes } = this.decisionForm.value;

    this.caseService
      .submitDecision(this.id, verdict, judicialNotes)
      .pipe(
        finalize(() => (this.submitting = false)),
        catchError((err) => {
          this.toastr.error("Failed to submit decision: " + err.message, "Error");
          console.error("Error submitting decision:", err);
          return of(null);
        }),
      )
      .subscribe((updatedCase) => {
        if (updatedCase) {
          this.caseData = updatedCase;
          this.showDecisionForm = false;
          this.formSubmitted = false;
          this.toastr.success("Decision submitted successfully", "Success");

          // Reload reports to include the new judicial report
          this.loadCaseReports(this.id);
        }
      });
  }

  loadCaseReports(caseId: string): void {
    this.loadingReports = true;
    this.reportError = null;

    this.reportService
      .getReportsByCase(caseId)
      .pipe(
        finalize(() => (this.loadingReports = false)),
        catchError((err) => {
          this.reportError = "Failed to load case reports: " + err.message;
          console.error("Error loading case reports:", err);
          return of([]);
        }),
      )
      .subscribe((reports) => {
        this.caseReports = reports;

        // Sort reports by creation date (newest first)
        this.caseReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Initialize accordion after reports are loaded
        setTimeout(() => this.initializeAccordions(), 100);
      });
  }

  toggleComparisonForm(): void {
    this.showComparisonForm = !this.showComparisonForm;
    if (!this.showComparisonForm) {
      this.comparisonForm.reset();
      this.comparisonResult = null;
      this.comparisonError = null;
    }
  }

  compareReports(): void {
    if (this.comparisonForm.invalid) {
      this.toastr.error("Please select two reports to compare", "Form Error");
      return;
    }

    const { reportId1, reportId2 } = this.comparisonForm.value;

    if (reportId1 === reportId2) {
      this.toastr.error("Please select two different reports to compare", "Form Error");
      return;
    }

    this.loadingComparison = true;
    this.comparisonError = null;
    this.comparisonResult = null;

    this.reportService
      .compareReports(reportId1, reportId2)
      .pipe(
        finalize(() => (this.loadingComparison = false)),
        catchError((err) => {
          this.comparisonError = "Failed to compare reports: " + err.message;
          console.error("Error comparing reports:", err);
          this.toastr.error(this.comparisonError, "Error");
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.comparisonResult = result;
        }
      });
  }

  canSubmitDecision(): boolean {
    return this.caseData?.status === CaseStatus.UNDER_REVIEW;
  }

  getVerdictClass(verdict?: string): string {
    if (!verdict) return "bg-secondary";
    switch (verdict.toLowerCase()) {
      case "authentic":
        return "bg-success";
      case "falsified":
        return "bg-danger";
      case "inconclusive":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  }

  getReportTypeClass(reportType: ReportType): string {
    switch (reportType) {
      case ReportType.PRELIMINARY:
        return "bg-info";
      case ReportType.ANALYSIS:
        return "bg-primary";
      case ReportType.EXPERT_OPINION:
        return "bg-warning";
      case ReportType.FINAL:
        return "bg-success";
      case ReportType.JUDICIAL:
        return "bg-dark";
      default:
        return "bg-secondary";
    }
  }

  getReportTypeLabel(reportType: ReportType): string {
    return reportType.replace("_", " ");
  }

  viewReportPdf(pdfUrl: string): void {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else {
      this.toastr.error("PDF not available for this report", "Error");
    }
  }

  ngAfterViewInit(): void {
    // Wait for DOM to be ready
    setTimeout(() => this.initializeAccordions(), 500);
  }

  private initializeAccordions(): void {
    try {
      console.log("Initializing accordions...");

      // Check if Bootstrap is available
      if (typeof bootstrap === "undefined") {
        console.error("Bootstrap is not available. Make sure Bootstrap JS is loaded.");
        this.setupManualAccordion();
        return;
      }

      // Get all accordion buttons
      const accordionButtons = document.querySelectorAll('.accordion-button');
      console.log(`Found ${accordionButtons.length} accordion buttons`);

      // Add manual click handlers for each button
      accordionButtons.forEach((button, index) => {
        button.addEventListener('click', (event) => {
          const target = (event.currentTarget as HTMLElement).getAttribute('data-bs-target');
          if (target) {
            const collapseElement = document.querySelector(target);
            if (collapseElement) {
              // Check if Bootstrap Collapse is available
              if (bootstrap && bootstrap.Collapse) {
                const bsCollapse = new bootstrap.Collapse(collapseElement, {
                  toggle: true
                });
              } else {
                // Fallback to manual toggle
                collapseElement.classList.toggle('show');
              }
            }
          }
        });
      });
    } catch (error) {
      console.error("Error initializing accordions:", error);
      // Fallback to manual implementation
      this.setupManualAccordion();
    }
  }

  private setupManualAccordion(): void {
    console.log("Setting up manual accordion functionality");

    // Select all accordion buttons
    const accordionButtons = document.querySelectorAll('.accordion-button');

    // Add click event to each button
    accordionButtons.forEach((button) => {
      button.addEventListener('click', function(this: HTMLElement) {
        // Get the target from data-bs-target attribute
        const targetId = this.getAttribute('data-bs-target')?.replace('#', '');
        if (!targetId) return;

        // Find the target collapse element
        const collapseElement = document.getElementById(targetId);
        if (!collapseElement) return;

        // Toggle the 'show' class
        collapseElement.classList.toggle('show');

        // Toggle the expanded state of the button
        const isExpanded = collapseElement.classList.contains('show');
        this.setAttribute('aria-expanded', isExpanded.toString());
        this.classList.toggle('collapsed', !isExpanded);
      });
    });
  }
}
