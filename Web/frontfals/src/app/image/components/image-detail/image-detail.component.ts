import { Component,  OnInit } from "@angular/core"
import {  ActivatedRoute,  Router, RouterLink } from "@angular/router"
import  { ImageService } from "../../../core/services/image.service"
import  { ToastrService } from "ngx-toastr"
import  { ImageDetails } from "../../../core/models/image.model"
import { DatePipe, NgClass, NgForOf, NgIf, PercentPipe } from "@angular/common"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component"
import  { MatDialog } from "@angular/material/dialog"
import {catchError, finalize, map, tap} from "rxjs/operators"
import {Observable, of} from "rxjs"
import { AnalysisDto } from "../../../core/models/report.model"
import {User} from '../../../core/models/user.model';
import {UserService} from '../../../core/services/user.service'; // Import AnalysisDto


@Component({
  selector: "app-image-detail",
  templateUrl: "./image-detail.component.html",
  styleUrls: ["./image-detail.component.scss"],
  imports: [RouterLink, NgIf, NgForOf, DatePipe, NgClass, PercentPipe, LoadingSpinnerComponent],
  standalone: true,
})
export class ImageDetailComponent implements OnInit {
  imageId = ""
  image: ImageDetails | null = null
  loading = true
  errorMessage = ""

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private imageService: ImageService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.imageId = this.route.snapshot.paramMap.get("id") || ""
    if (this.imageId) {
      this.loadImageDetails()
    } else {
      this.toastr.error("Image ID is missing", "Error")
      this.router.navigate(["/images"])
    }
  }

  loadImageDetails(): void {
    this.loading = true
    this.imageService
      .getImage(this.imageId)
      .pipe(
        tap((image: ImageDetails) => {
          this.image = image
          // Ensure analysisResults is treated as AnalysisDto[] for template bindings
          if (this.image.analysisResults) {
            this.image.analysisResults = this.image.analysisResults.map(analysis => ({
              ...analysis,
              analysisDate: analysis.analysisDate ,

            }));
            this.getUserName(this.image.uploadedBy).subscribe((name) => {
              this.image.uploadedBy = name
            })          }
        }),
        catchError((error) => {
          this.toastr.error("Failed to load image details", "Error")
          this.errorMessage = "Failed to load image details"
          this.router.navigate(["/images"])
          return of(null)
        }),
        finalize(() => {
          this.loading = false
        }),
      )
      .subscribe()
  }

  downloadImage(): void {
    if (!this.image || !this.image.url) return

    // Create a temporary anchor element
    const link = document.createElement("a")
    link.href = this.image.url
    link.download = this.image.filename || 'download.jpg'; // Use filename if available
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  confirmDelete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Confirm Delete",
        message: "Are you sure you want to delete this image? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.imageId) {
        this.deleteImage()
      }
    })
  }

  deleteImage(): void {
    this.loading = true
    this.imageService
      .deleteImage(this.imageId) // Add user context if needed by backend delete endpoint
      .pipe(
        tap(() => {
          this.toastr.success("Image deleted successfully", "Success")
          this.router.navigate(["/images"])
        }),
        catchError((error) => {
          this.toastr.error("Failed to delete image", "Error")
          this.errorMessage = "Failed to delete image"
          return of(null)
        }),
        finalize(() => {
          this.loading = false
        }),
      )
      .subscribe()
  }

  // Helper to get the analysis ID safely, handling both property names (if AnalysisResult is used)
  private getAnalysisId(analysis: AnalysisDto | any): string {
    return analysis.id || analysis.analysisId || '';
  }
  getUserName(userId: string): Observable<string> {
    return this.userService.getUserById(userId).pipe(
      map((user: User) => `${user.firstname} ${user.lastname}`),
      catchError(() => of('Unknown User'))
    );
  }
}
