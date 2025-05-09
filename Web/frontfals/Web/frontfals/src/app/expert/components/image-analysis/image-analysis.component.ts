import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CaseService } from "../../../core/services/case.service";
import { ImageService } from "../../../core/services/image.service";
import { AnalysisService } from "../../../core/services/analysis.service";
import { ToastrService } from "ngx-toastr";
import {CaseDTO, CaseStatus, PageResponse} from "../../../core/models/case.model";
import { ImageDetails } from "../../../core/models/image.model";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router"; // Import Router along with RouterLink
import { AnalysisDto } from "../../../core/models/report.model";
import { CaseSearchResponse } from "../../../core/models/case.model";
import { catchError, finalize, tap } from "rxjs/operators";
import { of } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-image-analysis",
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, StatusBadgeComponent, ReactiveFormsModule, RouterLink],
  templateUrl: "./image-analysis.component.html",
  styleUrls: ["./image-analysis.component.scss"],
})
export class ImageAnalysisComponent implements OnInit {
  cases: CaseDTO[] = [];
  selectedCase: CaseDTO | null = null;
  images: ImageDetails[] = [];
  selectedImage: ImageDetails | null = null;
  errorMessage = "";
  totalItems = 0;
  totalPages = 0;

  analysisForm: FormGroup;
  loading = false;
  analyzing = false;

  analysisTypes = [
    { id: "ela", name: "Error Level Analysis" },
    { id: "noise", name: "Noise Analysis" },
    { id: "metadata", name: "Metadata Analysis" },
    { id: "clone", name: "Clone Detection" },
    { id: "ai", name: "AI Detection" },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private caseService: CaseService,
    private imageService: ImageService,
    private analysisService: AnalysisService,
    private toastr: ToastrService,
    private authService: AuthService,
    private router: Router // Inject Router service
  ) {
    this.analysisForm = this.formBuilder.group({
      analysisType: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.loading = true;
    const expertId = this.authService.getCurrentUser()?.id;

    if (!expertId) {
      this.loading = false;
      this.errorMessage = "Expert ID not available. Cannot load cases.";
      this.toastr.error(this.errorMessage, "Error");
      return;
    }

    this.caseService.getCasesByExpert(expertId).pipe(
      tap((response: PageResponse<CaseDTO>) => {
        this.cases = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
      }),
      catchError((error) => {
        this.toastr.error("Failed to load cases", "Error");
        this.errorMessage = "Failed to load cases";
        this.cases = [];
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe();
  }

  onCaseSelect(id: string): void {
    this.selectedCase = this.cases.find((c) => c.id === id) || null;
    this.selectedImage = null;
    this.images = [];

    if (this.selectedCase) {
      this.loadImages(id);
    }
  }

  loadImages(caseId: string): void {
    this.loading = true;
    this.imageService.getImagesByCase(caseId).pipe(
      tap((images: ImageDetails[]) => {
        this.images = images;
      }),
      catchError((error) => {
        this.toastr.error("Failed to load images", "Error");
        this.errorMessage = "Failed to load images";
        this.images = [];
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe();
  }

  onImageSelect(image: ImageDetails): void {
    this.loading = true;
    this.selectedImage = null;
    this.imageService.getImage(image.id).pipe(
      tap((fullImageDetails: ImageDetails) => {
        this.selectedImage = fullImageDetails;
      }),
      catchError((error) => {
        this.toastr.error("Failed to load full image details", "Error");
        this.errorMessage = "Failed to load image details";
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe();
  }

  analyzeImage(): void {
    if (!this.selectedImage || !this.selectedImage.id) {
      this.toastr.error("Image not selected.", "Error");
      return;
    }

    this.analyzing = true;
    const imageIdToAnalyze = this.selectedImage.id;
    const userId = this.authService.getCurrentUser()?.id || "unknown";

    this.analysisService.runAnalysis(imageIdToAnalyze, userId).pipe(
      tap((result: AnalysisDto) => {
        this.toastr.success("Analysis submitted successfully", "Success");

        setTimeout(() => {
          if (this.selectedImage) {
            this.onImageSelect(this.selectedImage);
          }
        }, 2000);
      }),
      catchError((error) => {
        let errorMessage = "Failed to analyze image";
        if (error.status === 0) {
          errorMessage = "Cannot connect to analysis service. Please try again later.";
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.toastr.error(errorMessage, "Error");
        this.errorMessage = errorMessage;
        return of(null);
      }),
      finalize(() => {
        this.analyzing = false;
      })
    ).subscribe();
  }

  // Helper method to safely get AnalysisDto id
  getAnalysisId(analysis: AnalysisDto): string {
    return analysis.id;
  }

  // Helper method to safely get AnalysisDto analysisType
  getAnalysisType(analysis: AnalysisDto): string {
    return analysis.analysisType;
  }

  // Helper method to safely get AnalysisDto analysisDate
  getAnalysisDate(analysis: AnalysisDto): string {
    return analysis.analysisDate;
  }

  // Helper method to safely get AnalysisDto isFalsified
  getIsFalsified(analysis: AnalysisDto): boolean {
    return analysis.isFalsified;
  }

  // Helper method to safely get AnalysisDto confidenceScore
  getConfidenceScore(analysis: AnalysisDto): number {
    return analysis.confidenceScore;
  }

  // Navigate to analysis detail page using the injected Router
  viewAnalysisDetails(analysisId: string): void {
    this.router.navigate(["/expert/analysis", analysisId]);
  }
}
