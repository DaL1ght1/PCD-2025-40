import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from "@angular/forms";
import { CaseService } from "../../../core/services/case.service";
import { AnalysisService } from "../../../core/services/analysis.service";
import { ReportService } from "../../../core/services/report.service";
import { TemplateService } from "../../../core/services/template.service";
import { ToastrService } from "ngx-toastr";
import { CaseDTO, PageResponse } from "../../../core/models/case.model";
import { AnalysisDto, BackendReportCreationRequest, ReportType, ReportResponse } from "../../../core/models/report.model";
import { ReportTemplate } from "../../../core/models/template.model";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ReplaceUnderscoreWithSpacePipe } from '../../../core/services/Formatter.service';
import { ImageService } from '../../../core/services/image.service';
import { ImageDetails } from '../../../core/models/image.model';

@Component({
  selector: "app-create-report",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent, RouterLink, ReplaceUnderscoreWithSpacePipe],
  templateUrl: "./create-report.component.html",
  styleUrls: ["./create-report.component.scss"],
})
export class CreateReportComponent implements OnInit {
  public reportForm: FormGroup;
  public cases: CaseDTO[] = [];
  public availableAnalyses: AnalysisDto[] = [];
  public selectedCase: CaseDTO | null = null;
  public loading = false;
  public submitting = false;
  public formSubmitted = false;
  public totalItems = 0;
  public totalPages = 0;

  public templates: ReportTemplate[] = [];
  public selectedTemplate: ReportTemplate | null = null;
  public showTemplateModal = false;
  public showPreviewModal = false;
  public templateForm: FormGroup;
  public templateFile: File | null = null;
  public uploadProgress = 0;
  public templatePreviewContent: SafeHtml | null = null;
  public images: ImageDetails[] = []; // Stores the images associated with the case

  public fieldErrors: Record<string, boolean> = {
    caseId: false,
    title: false,
    reportType: false,
    analysisIds: false,
    description: false,
    verdict: false,
    judicialNotes: false,
    templateId: false,
  };

  ReportType = ReportType;

  constructor(
    private fb: FormBuilder,
    private caseService: CaseService,
    private analysisService: AnalysisService,
    public reportService: ReportService,
    private templateService: TemplateService,
    private imageService: ImageService, // Renamed to match casing convention
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.reportForm = this.fb.group({
      caseId: ["", Validators.required],
      title: ["Expert Report", [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(2000)]],
      analysisIds: this.fb.array([], Validators.required),
      verdict: ["", [Validators.maxLength(2000)]],
      judicialNotes: ["", [Validators.maxLength(2000)]],
      reportType: [ReportType.EXPERT_OPINION, Validators.required],
      generatedBy: [""],
      templateId: ["", Validators.required],
      imageUrls: [[]], // Add imageUrls to the form
    });

    this.reportForm.get("generatedBy")?.disable();
    this.reportForm.get("imageUrls")?.disable(); // Disable imageUrls to prevent user modification

    this.templateForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(500)]],
      isDefault: [false],
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.reportForm.patchValue({
        generatedBy: `${currentUser.firstname} ${currentUser.lastname} (${currentUser.id})`,
      });
    }
    this.loadCases();
    this.loadTemplates();

    Object.keys(this.fieldErrors).forEach((key) => {
      if (key !== "analysisIds") {
        const control = this.reportForm.get(key);
        if (control) {
          control.valueChanges.subscribe(() => {
            this.fieldErrors[key] = control.invalid;
          });
        }
      }
    });
  }

  get analysisIdsFormArray(): FormArray {
    return this.reportForm.get("analysisIds") as FormArray;
  }

  get isAnalysisIdsEmpty(): boolean {
    return this.analysisIdsFormArray.length === 0;
  }

  isAnalysisIdsDirty(): boolean {
    return this.analysisIdsFormArray.controls.some(control => control.dirty);
  }

  get f(): {
    caseId: FormControl<string | null>;
    title: FormControl<string | null>;
    description: FormControl<string | null>;
    analysisIds: FormArray<FormControl<string | null>>;
    verdict: FormControl<string | null>;
    judicialNotes: FormControl<string | null>;
    reportType: FormControl<ReportType | null>;
    generatedBy: FormControl<string | null>;
    templateId: FormControl<string | null>;
    imageUrls: FormControl<string[] | null>;
  } {
    return {
      caseId: this.reportForm.get("caseId") as FormControl<string | null>,
      title: this.reportForm.get("title") as FormControl<string | null>,
      description: this.reportForm.get("description") as FormControl<string | null>,
      analysisIds: this.reportForm.get("analysisIds") as FormArray<FormControl<string | null>>,
      verdict: this.reportForm.get("verdict") as FormControl<string | null>,
      judicialNotes: this.reportForm.get("judicialNotes") as FormControl<string | null>,
      reportType: this.reportForm.get("reportType") as FormControl<ReportType | null>,
      generatedBy: this.reportForm.get("generatedBy") as FormControl<string | null>,
      templateId: this.reportForm.get("templateId") as FormControl<string | null>,
      imageUrls: this.reportForm.get("imageUrls") as FormControl<string[] | null>,
    };
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getAllTemplates().subscribe({
      next: (templates: ReportTemplate[]) => {
        this.templates = templates;

        const defaultTemplate = templates.find(t => t.isDefault);
        if (defaultTemplate) {
          this.reportForm.patchValue({ templateId: defaultTemplate.id });
          this.selectedTemplate = defaultTemplate;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load templates:", error);
        this.toastr.error(error.message || "Failed to load report templates", "Error");
        this.loading = false;
      }
    });
  }

  onTemplateSelectionChange(event: Event): void {
    const templateId = (event.target as HTMLSelectElement).value;
    this.selectedTemplate = this.templates.find(t => t.id === templateId) || null;
    this.markFieldAsChecked("templateId");
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
    this.templateForm.reset({
      name: "",
      description: "",
      isDefault: false
    });
    this.templateFile = null;
    this.uploadProgress = 0;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.templateFile = fileInput.files[0];
      if (!this.templateFile.name.toLowerCase().endsWith('.html')) {
        this.toastr.warning("Only HTML files are supported for templates", "Warning");
        this.templateFile = null;
        fileInput.value = '';
      }
    }
  }

  uploadTemplate(): void {
    this.formSubmitted = true;

    if (this.templateForm.invalid || !this.templateFile) {
      this.toastr.error("Please fill all required fields and select a valid HTML file", "Validation Error");
      return;
    }

    const formData = new FormData();
    formData.append('name', this.templateForm.get('name')?.value);
    formData.append('description', this.templateForm.get('description')?.value || '');
    formData.append('isDefault', this.templateForm.get('isDefault')?.value ? 'true' : 'false');
    formData.append('file', this.templateFile);

    this.templateService.uploadTemplate(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          const newTemplate = event.body as ReportTemplate;
          this.templates.push(newTemplate);
          this.toastr.success("Template uploaded successfully!", "Success");
          this.closeTemplateModal();

          this.reportForm.patchValue({ templateId: newTemplate.id });
          this.selectedTemplate = newTemplate;
        }
      },
      error: (error) => {
        console.error("Failed to upload template:", error);
        this.toastr.error(error.message || "Failed to upload template", "Error");
      }
    });
  }

  previewTemplate(): void {
    if (!this.selectedTemplate) {
      this.toastr.warning("Please select a template to preview", "Warning");
      return;
    }

    this.loading = true;
    this.templateService.getTemplateContent(this.selectedTemplate.id).subscribe({
      next: (content: string) => {
        this.templatePreviewContent = this.sanitizer.bypassSecurityTrustHtml(content);
        this.showPreviewModal = true;
        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load template preview:", error);
        this.toastr.error(error.message || "Failed to load template preview", "Error");
        this.loading = false;
      }
    });
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
  }

  markFieldAsChecked(fieldName: string): void {
    if (fieldName === "analysisIds") {
      this.fieldErrors["analysisIds"] = this.isAnalysisIdsEmpty;
    } else {
      const control = this.reportForm.get(fieldName);
      if (control) {
        this.fieldErrors[fieldName] = control.invalid;
      }
    }
  }

  loadCases(): void {
    this.loading = true;
    const expertId = this.authService.getCurrentUser()?.id;
    if (!expertId) {
      this.loading = false;
      this.toastr.error("Expert ID not available. Cannot load cases.", "Error");
      return;
    }
    this.caseService.getCasesByExpert(expertId).subscribe({
      next: (response: PageResponse<CaseDTO>) => {
        this.cases = response.content;
        this.totalItems = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load cases:", error);
        this.toastr.error(error.message || "Failed to load cases", "Error");
        this.loading = false;
        this.cases = [];
      },
    });
  }

  onCaseSelectionChange(event: Event): void {
    const caseId = (event.target as HTMLSelectElement).value as string;
    this.selectedCase = this.cases.find((c) => c.id === caseId) || null;
    this.availableAnalyses = [];
    this.analysisIdsFormArray.clear();
    this.images = []; // Reset images when a new case is selected
    this.reportForm.patchValue({ caseId, imageUrls: [] }); // Reset imageUrls
    this.markFieldAsChecked("caseId");
    if (caseId && caseId !== "") {
      this.loadAnalysesForCase(caseId);
      this.loadImagesForCase(caseId); // Load images for the selected case
    }
  }

  loadAnalysesForCase(caseId: string): void {
    this.loading = true;
    this.analysisService.getAnalysesByCase(caseId).subscribe({
      next: (analysesFromApi: AnalysisDto[]) => {
        this.availableAnalyses = analysesFromApi;
        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load analyses:", error);
        this.toastr.error(error.message || "Failed to load analyses for the selected case.", "Error");
        this.availableAnalyses = [];
        this.loading = false;
      },
    });
  }


  loadImagesForCase(caseId: string): void {
    this.loading = true;
    this.imageService.getImagesByCase(caseId).subscribe({
      next: (images: ImageDetails[]) => {
        this.images = images;
        // Extract image URLs from the images
        const imageUrls = images.map(image => image.url);
        console.log('Fetched image URLs for case:', imageUrls); // Debug log
        this.reportForm.patchValue({ imageUrls });
        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load images for case:", error);
        this.toastr.error(error.message || "Failed to load images for the selected case.", "Error");
        this.images = [];
        this.reportForm.patchValue({ imageUrls: [] });
        this.loading = false;
      },
    });
  }

  onAnalysisSelectionChange(event: Event, analysis: AnalysisDto): void {
    const checkbox = event.target as HTMLInputElement;
    const analysisId = analysis.id;
    if (checkbox.checked) {
      this.analysisIdsFormArray.push(this.fb.control(analysisId));
    } else {
      const index = this.analysisIdsFormArray.controls.findIndex((control) => control.value === analysisId);
      if (index !== -1) {
        this.analysisIdsFormArray.removeAt(index);
      }
    }
    this.fieldErrors["analysisIds"] = this.isAnalysisIdsEmpty;
  }

  onSubmit(): void {
    this.formSubmitted = true;

    Object.keys(this.fieldErrors).forEach((key) => {
      this.markFieldAsChecked(key);
    });
    if (this.reportForm.invalid || this.isAnalysisIdsEmpty) {
      this.toastr.error("Please fill all required fields.", "Validation Error");
      return;
    }
    this.submitting = true;
    const formValues = this.reportForm.getRawValue();
    const reportData: BackendReportCreationRequest = {
      caseId: formValues.caseId,
      title: formValues.title,
      description: formValues.description,
      analysisIds: formValues.analysisIds,
      verdict: formValues.verdict,
      judicialNotes: formValues.judicialNotes,
      reportType: formValues.reportType,
      generatedBy: formValues.generatedBy,
      templateId: formValues.templateId,
      imageUrls: formValues.imageUrls, // Include imageUrls in the request
    };

    console.log('Submitting report with data:', reportData); // Debug log
    this.reportService.createReport(reportData).subscribe({
      next: (response: ReportResponse) => {
        this.toastr.success("Report created successfully!", "Success");
        this.submitting = false;
        this.router.navigate(["/expert/reports"]);
      },
      error: (error) => {
        console.error("Failed to create report:", error);
        this.toastr.error(error.message || "Failed to create report.", "Error");
        this.submitting = false;
      },
    });
    this.caseService.markCaseForReview(formValues.caseId).subscribe({})
  }

  isAnalysisSelected(analysisId: string): boolean {
    return this.analysisIdsFormArray.value.includes(analysisId);
  }

  markTemplateFieldAsChecked(fieldName: string): void {
    const control = this.templateForm.get(fieldName);
    if (control) {
      control.markAsDirty();
    }
  }
}
