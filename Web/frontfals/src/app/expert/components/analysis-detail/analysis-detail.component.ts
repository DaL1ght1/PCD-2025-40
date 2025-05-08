import { Component,  OnInit } from "@angular/core"
import  { ActivatedRoute, Router } from "@angular/router"
import {  FormBuilder,  FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import  { ToastrService } from "ngx-toastr"
import { of } from "rxjs"
import { catchError, finalize, tap } from "rxjs/operators"
import  { AnalysisResult, AnnotationResponse as BaseAnnotationResponse } from "../../../core/models/analysis.model"
import  { ImageDetails } from "../../../core/models/image.model"
import  { AnalysisService } from "../../../core/services/analysis.service"
import  { ImageService } from "../../../core/services/image.service"
import  { AuthService } from "../../../core/services/auth.service"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { DatePipe, NgClass, NgForOf, NgIf, PercentPipe } from "@angular/common"

// Extended interface to match the properties used in the template
interface AnnotationResponse extends BaseAnnotationResponse {
  annotatedBy: string
  annotationDate: Date
}

@Component({
  selector: "app-analysis-detail",
  templateUrl: "./analysis-detail.component.html",
  styleUrls: ["./analysis-detail.component.scss"],
  imports: [LoadingSpinnerComponent, ReactiveFormsModule, DatePipe, PercentPipe, NgClass, NgIf, NgForOf],
  standalone: true,
})
export class AnalysisDetailComponent implements OnInit {
  analysisId = ""
  id = "" // Added missing id variable
  imageId = "" // Added missing imageId variable
  analysis: AnalysisResult | null = null
  imageUrl = ""
  imageDetails: ImageDetails | null = null // Added imageDetails object
  loading = true
  annotationForm: FormGroup
  submitting = false
  annotations: AnnotationResponse[] = []
  detailedResults: { key: string; value: string }[] = [] // Added detailedResults array
  errorMessage = "" // Added missing error message property

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analysisService: AnalysisService,
    private imageService: ImageService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this.annotationForm = this.fb.group({
      content: ["", [Validators.required, Validators.minLength(10)]],
    })
  }

  ngOnInit(): void {
    this.analysisId = this.route.snapshot.paramMap.get("id") || ""
    this.id = this.analysisId // Set id value from analysisId

    if (!this.analysisId) {
      this.toastr.error("Analysis ID is required")
      this.router.navigate(["/dashboard"])
      return
    }

    this.loadAnalysis()
  }

  loadAnalysis(): void {
    this.loading = true
    this.analysisService
      .getAnalysis(this.analysisId)
      .pipe(
        tap((analysis) => {
          this.analysis = analysis

          // Transform annotations to match our expected interface
          this.annotations = (analysis.annotations || []).map((annotation) => ({
            ...annotation,
            annotatedBy: annotation.createdBy || "Unknown",
            annotationDate: annotation.createdAt,
          })) as AnnotationResponse[]

          this.imageId = analysis.imageId // Set imageId
          this.detailedResults = this.getDetailedResults() // Initialize detailedResults

          // Load the image
          if (analysis.imageId) {
            this.loadImage(analysis.imageId)
          }
        }),
        catchError((error) => {
          this.toastr.error("Failed to load analysis: " + error.message)
          this.errorMessage = "Failed to load analysis"
          return of(null)
        }),
        finalize(() => {
          this.loading = false
        }),
      )
      .subscribe()
  }

  loadImage(imageId: string): void {
    this.loading = true
    this.imageService.getImage(imageId).subscribe({
      next: (imageDetails: ImageDetails) => {
        this.loading = false
        this.imageUrl = imageDetails.url || ""
        this.imageDetails = imageDetails // Set imageDetails from the response
      },
      error: (error) => {
        this.loading = false
        this.errorMessage = "Failed to load image"
        console.error("Error loading image:", error)
      },
    })
  }

  // Method needed by template
  goBack(): void {
    this.router.navigate(["/analysis"])
  }

  // Method needed by template
  addAnnotation(): void {
    if (this.annotationForm.invalid) {
      this.toastr.error("Please fill out the annotation form correctly")
      return
    }

    if (!this.analysis) {
      this.toastr.error("No analysis loaded")
      return
    }

    this.submitting = true
    const formValue = this.annotationForm.value

    this.imageService
      .annotateImage(this.analysis.imageId, formValue.content)
      .pipe(
        tap((response) => {
          const currentUser = this.authService.getCurrentUser()?.email || "Expert"
          const now = new Date()

          // Create a new annotation with response data and template-required fields
          const newAnnotation: AnnotationResponse = {
            id: response.id || `annotation-${Date.now()}`,
            analysisId: this.analysisId,
            content: formValue.content,
            createdBy: currentUser,
            createdAt: now,
            annotatedBy: currentUser, // Field used in template
            annotationDate: now, // Field used in template
          } as AnnotationResponse

          this.annotations.push(newAnnotation)
          this.toastr.success("Annotation added successfully")
          this.annotationForm.reset({
            content: "",
          })
        }),
        catchError((error) => {
          this.toastr.error("Failed to add annotation: " + error.message)
          this.errorMessage = "Failed to add annotation"
          return of(null)
        }),
        finalize(() => {
          this.submitting = false
        }),
      )
      .subscribe()
  }

  getDetailedResults(): { key: string; value: string }[] {
    if (!this.analysis || !this.analysis.detailedResults) {
      return []
    }

    return Object.entries(this.analysis.detailedResults).map(([key, value]) => {
      // Format the value based on its type
      let formattedValue: string
      if (typeof value === "object" && value !== null) {
        formattedValue = JSON.stringify(value, null, 2)
      } else if (typeof value === "number" && key.toLowerCase().includes("probability")) {
        formattedValue = (value * 100).toFixed(2) + "%"
      } else {
        formattedValue = String(value)
      }

      // Format the key for display
      const formattedKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim()

      return {
        key: formattedKey,
        value: formattedValue,
      }
    })
  }
}
