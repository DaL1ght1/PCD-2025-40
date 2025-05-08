import { Component,  OnInit, Output, EventEmitter } from "@angular/core"
import {  FormBuilder,  FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import {  Router, RouterLink } from "@angular/router"
import  { ImageService } from "../../../core/services/image.service"
import  { ToastrService } from "ngx-toastr"
import { NgxDropzoneModule, type NgxDropzoneChangeEvent } from "ngx-dropzone"
import { DecimalPipe, NgForOf, NgIf } from "@angular/common"
import { catchError, finalize, tap } from "rxjs/operators"
import {of, switchMap} from "rxjs"
import  { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-image-upload",
  templateUrl: "./image-upload.component.html",
  styleUrls: ["./image-upload.component.scss"],
  imports: [ReactiveFormsModule, NgIf, NgxDropzoneModule, NgForOf, DecimalPipe],
  standalone: true,
})
export class ImageUploadComponent implements OnInit {
  uploadForm!: FormGroup
  loading = false
  uploading = false
  files: File[] = []
  errorMessage = ""
  @Output() uploadComplete = new EventEmitter<any>()

  constructor(
    private fb: FormBuilder,
    private imageService: ImageService,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      // Remove the image form control as it's causing issues
      // image: [null, Validators.required],
      caseId: ["", Validators.required],
      description: [""],
      autoAnalyze: [true],
    })
  }

  onSelect(event: NgxDropzoneChangeEvent): void {
    this.files = []
    this.files.push(...event.addedFiles)

    // No need to update form control for image
    // if (this.files.length > 0) {
    //   this.uploadForm.patchValue({
    //     image: this.files[0],
    //   })
    //   this.uploadForm.get("image")?.updateValueAndValidity()
    // }
  }

  onRemove(file: File): void {
    this.files.splice(this.files.indexOf(file), 1)

    // No need to update form control for image
    // if (this.files.length === 0) {
    //   this.uploadForm.patchValue({
    //     image: null,
    //   })
    //   this.uploadForm.get("image")?.updateValueAndValidity()
    // }
  }

  onSubmit(): void {
    if (this.uploadForm.invalid) {
      this.toastr.error("Please provide a case ID", "Validation Error");
      this.uploadForm.markAllAsTouched();
      return;
    }

    if (this.files.length === 0) {
      this.toastr.error("Please select an image to upload", "Validation Error");
      return;
    }

    this.uploading = true;
    const caseId = this.uploadForm.value.caseId;
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || "unknown";
    const userRole = currentUser?.role?.[0]?.replace("ROLE_", "") || "USER";

    this.imageService
      .uploadImage(this.files[0], caseId, userId, userRole)
      .pipe(
        switchMap((response) => {
          this.toastr.success("Image uploaded successfully", "Success");
          const imageDetails = {
            ...response,
            imageId: response.imageId || response.id,
            uploadDate: new Date(response.uploadDate),
          };
          this.uploadComplete.emit(imageDetails);

          const imageId = response.imageId || response.id;

          // If autoAnalyze is checked, call analysis service before navigating
          if (this.uploadForm.value.autoAnalyze) {
            return this.imageService.analyzeImage(imageId, userId).pipe(
              tap(analysisResult => {
                this.toastr.success("Image analysis completed", "Analysis Success");
                this.router.navigate(["/images/analyze", imageId]);
              }),
              catchError(error => {
                this.toastr.warning("Upload successful, but analysis failed", "Analysis Warning");
                this.router.navigate(["/images/analyze", imageId]);
                return of(null);
              })
            );
          } else {
            this.router.navigate(["/images"]);
            return of(null);
          }
        }),
        catchError((error) => {
          let errorMessage = "Failed to upload image";
          if (error.status === 0) {
            errorMessage = "Cannot connect to server. Please try again later.";
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          this.toastr.error(errorMessage, "Error");
          this.errorMessage = errorMessage;
          return of(null);
        }),
        finalize(() => {
          this.uploading = false;
        })
      )
      .subscribe();
  }

  resetForm(): void {
    this.uploadForm.reset({
      caseId: "",
      description: "",
      autoAnalyze: true,
    })
    this.files = []
  }
}
