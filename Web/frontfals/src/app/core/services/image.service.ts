import {Injectable} from "@angular/core"
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http"
import {Observable, of, switchMap, throwError} from "rxjs"
import {catchError, map} from "rxjs/operators"
import {environment} from "../../../environments/environment"
import {ToastrService} from "ngx-toastr"
import {fromFetch} from 'rxjs/internal/observable/dom/fetch';
import {types} from 'sass';
import List = types.List;

export interface ImageDetails {
  id: string
  imageId?: string
  caseId?: string
  filename: string
  contentType: string
  size: number
  uploadDate: Date
  uploadedBy: string
  url?: string
  analysisStatus?: string
  tags?: string[]
  analysisResults?: any[]
  metadata?: {
    width?: number
    height?: number
    format?: string
    [key: string]: any
  }
}

export interface ImageUploadResponse {
  id: string
  imageId?: string
  filename: string
  url: string
  uploadDate: string
  uploadedBy: string
  status: string
  caseId?: string
}

export interface ImageAnnotation {
  id: string
  imageId: string
  content: string
  createdBy: string
  createdAt: Date
  coordinates?: {
    x: number
    y: number
    width: number
    height: number
  }
}

@Injectable({
  providedIn: "root",
})
export class ImageService {
  private imagesApiUrl = environment.imagesApiUrl
  private  apiUrl = environment.apiUrl

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  getAllImages(): Observable<ImageDetails[]> {
    return this.http.get<ImageDetails[]>(`${this.imagesApiUrl}/all`).pipe(
      map((images) => this.processImageUrls(images)),
      catchError(this.handleError<ImageDetails[]>("getAllImages", [])),
    )
  }

  getImage(id: string): Observable<ImageDetails> {
    return this.http.get<ImageDetails>(`${this.imagesApiUrl}/${id}`).pipe(
      map((image) => this.processImageUrl(image)),
      catchError(this.handleError<ImageDetails>("getImage", {} as ImageDetails)),
    )
  }

  getImagesByCase(caseId: string): Observable<ImageDetails[]> {
    return this.http.get<ImageDetails[]>(`${this.imagesApiUrl}/case/${caseId}`).pipe(
      map((images) => this.processImageUrls(images)),
      catchError(this.handleError<ImageDetails[]>("getImagesByCase", [])),
    )
  }



  uploadImage(
    file: File,
    caseId: string,
    userId = "SYSTEM_UPLOAD",
    userRole = "UPLOADER",
  ): Observable<ImageUploadResponse> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("caseId", caseId)
    formData.append("userId", userId)
    formData.append("userRole", userRole)

    return this.http.post<ImageUploadResponse>(`${this.imagesApiUrl}/upload`, formData).pipe(
      map((response) => ({
        ...response,
        url: this.getImageDownloadUrl(response.id),
      })),
      catchError(this.handleError<ImageUploadResponse>("uploadImage", {} as ImageUploadResponse)),
    )
  }

  deleteImage(
    id: string,
    userId = "SYSTEM_DELETE",
    userRole = "ADMIN",
    reason = "User requested deletion",
  ): Observable<any> {
    const params = new HttpParams().set("userId", userId).set("userRole", userRole).set("reason", reason)
    return this.http
      .delete<any>(`${this.imagesApiUrl}/${id}`, { params })
      .pipe(catchError(this.handleError<any>("deleteImage")))
  }

  annotateImage(
    imageId: string,
    content: string,
    coordinates?: any,
    userId = "SYSTEM_ANNOTATE",
    userRole = "ANNOTATOR",
  ): Observable<ImageAnnotation> {
    const params = new HttpParams().set("userId", userId).set("userRole", userRole)
    const payload = { content, coordinates, type: "USER_ANNOTATION" }
    return this.http
      .post<ImageAnnotation>(`${this.imagesApiUrl}/${imageId}/annotate`, payload, { params })
      .pipe(catchError(this.handleError<ImageAnnotation>("annotateImage", {} as ImageAnnotation)))
  }

  getAnnotations(imageId: string): Observable<ImageAnnotation[]> {
    return this.http
      .get<ImageAnnotation[]>(`${this.imagesApiUrl}/${imageId}/annotations`)
      .pipe(catchError(this.handleError<ImageAnnotation[]>("getAnnotations", [])))
  }

  tagImage(imageId: string, tags: string[], userId = "SYSTEM_TAG", userRole = "TAGGER"): Observable<ImageDetails> {
    const params = new HttpParams().set("userId", userId).set("userRole", userRole)
    return this.http.post<ImageDetails>(`${this.imagesApiUrl}/${imageId}/tags`, { tags }, { params }).pipe(
      map((image) => this.processImageUrl(image)),
      catchError(this.handleError<ImageDetails>("tagImage", {} as ImageDetails)),
    )
  }

  searchImages(query: string, page = 0, size = 20): Observable<any> {
    const params = new HttpParams().set("query", query).set("page", page.toString()).set("size", size.toString())
    return this.http.get<any>(`${this.imagesApiUrl}/search`, { params }).pipe(
      map((response) => ({
        ...response,
        content: this.processImageUrls(response.content || []),
      })),
      catchError(this.handleError<any>("searchImages", { content: [], totalElements: 0 })),
    )
  }

  getImageDownloadUrl(id: string): string {
    return `${this.imagesApiUrl}/${id}/download`
  }

  private processImageUrls(images: ImageDetails[]): ImageDetails[] {
    return images.map((image) => this.processImageUrl(image))
  }

  private processImageUrl(image: ImageDetails): ImageDetails {
    return {
      ...image,
      url: image.url || this.getImageDownloadUrl(image.id),
      imageId: image.imageId || image.id,
    }
  }
  analyzeImage(imageId: string, userId?: string): Observable<any> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.post<any>(`${environment.analysisApiUrl}/${imageId}`, null, { params }).pipe(
      catchError(this.handleError<any>("analyzeImage", null))
    );
  }
  private handleError<T>(operation = "operation", result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error)
      const errorMessage = error.error?.message || error.message || "Unknown error"
      this.toastr.error(`${operation} failed: ${errorMessage}`, "Error")
      return throwError(() => new Error(`${operation} failed: ${error.message}`))
    }
  }



  getImagesByIds(imageIds: string[]): Observable<ImageDetails[]> {
    if (imageIds.length === 0) {
      return of([]);
    }
    return fromFetch(`${this.apiUrl}/images/${imageIds}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).pipe(
      switchMap(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.statusText}`);
        }
        return response.json();
      }),
      catchError(error => {
        console.error('Error fetching images by IDs:', error);
        return of([]); // Return empty array on error to handle gracefully
      })
    );
  }

  getImageByAnalysisId(analysisId: string): Observable<string[] | null> {
    return fromFetch(`${this.apiUrl}/analysis/imagefromanalysis/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers (e.g., Authorization) if needed
      },
    }).pipe(
      switchMap(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch image by analysis ID: ${response.statusText}`);
        }
        return response.json();
      }),
      catchError(error => {
        console.error('Error fetching image by analysis ID:', error);
        return throwError(() => error);
      })
    );
  }}
