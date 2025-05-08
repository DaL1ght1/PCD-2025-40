import {Component, Input, OnInit} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ImageService } from '../../../core/services/image.service';
import { ToastrService } from 'ngx-toastr';
import { ImageDetails } from '../../../core/models/image.model';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-image-list',
  templateUrl: './image-list.component.html',
  styleUrls: ['./image-list.component.scss'],
  imports: [RouterLink, FormsModule, NgIf, NgForOf, DatePipe, LoadingSpinnerComponent],
  standalone: true,
})
export class ImageListComponent implements OnInit {
  @Input() images: ImageDetails[] = []
  filteredImages: ImageDetails[] = [];
  loading = true;
  caseFilter = '';
  dateFilter = '';
  searchFilter = '';

  constructor(
    private imageService: ImageService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages(): void {
    this.loading = true;
    this.imageService.getAllImages().subscribe({
      next: (images) => {
        this.images = images.map((image) => ({
          ...image,
          url: image.url || `${this.imageService.getImageDownloadUrl(image.id)}/preview`,
          imageId: image.imageId || image.id,
        }));
        this.filteredImages = [...this.images];
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load images', 'Error');
        this.loading = false;
        this.images = [];
        this.filteredImages = [];
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.images];

    // Apply case filter
    if (this.caseFilter) {
      filtered = filtered.filter((image) => image.caseId && image.caseId.toLowerCase().includes(this.caseFilter.toLowerCase()));
    }

    // Apply date filter
    if (this.dateFilter) {
      const now = new Date();
      filtered = filtered.filter((image) => {
        const uploadDate = new Date(image.uploadDate);
        switch (this.dateFilter) {
          case 'today':
            return uploadDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return uploadDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return uploadDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            return uploadDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (this.searchFilter) {
      const searchLower = this.searchFilter.trim().toLowerCase();
      filtered = filtered.filter((image) => image.filename.toLowerCase().includes(searchLower));
    }

    this.filteredImages = filtered;
  }

  resetFilters(): void {
    this.caseFilter = '';
    this.dateFilter = '';
    this.searchFilter = '';
    this.filteredImages = [...this.images];
  }

  handleImageError(event: Event, image: ImageDetails): void {
    // Prevent broken image icon by setting a fallback image
    const imgElement = event.target as HTMLImageElement
    // Simple gray placeholder as data URI
    imgElement.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+"

    // Optionally log the error
    console.warn(`Failed to load image: ${image.filename}`, event)
  }
}
