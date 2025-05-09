import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {SafeUrl} from '@angular/platform-browser';
import {SecurityUtilsService} from '../../../core/services/security-utils.service';

@Component({
  selector: 'app-secure-image',

  templateUrl: './secure-image.component.html',
  styleUrl: './secure-image.component.scss',
  standalone: true,
  imports: [NgIf, NgClass],
})
export class SecureImageComponent implements OnChanges {
  @Input() imageUrl = ""
  @Input() altText = "Image"
  @Input() fluid = true
  @Input() rounded = false

  safeImageUrl: SafeUrl | null = null
  isLoading = true
  hasError = false

  constructor(private securityUtils: SecurityUtilsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["imageUrl"]) {
      this.loadImage()
    }
  }

  loadImage(): void {
    this.isLoading = true
    this.hasError = false

    if (!this.imageUrl) {
      this.hasError = true
      this.isLoading = false
      return
    }

    // Validate URL before sanitizing
    if (this.securityUtils.isValidUrl(this.imageUrl)) {
      this.safeImageUrl = this.securityUtils.sanitizeUrl(this.imageUrl)
    } else {
      this.hasError = true
      this.isLoading = false
      console.error("Invalid image URL:", this.imageUrl)
    }
  }

  onImageLoad(): void {
    this.isLoading = false
  }

  onImageError(): void {
    this.isLoading = false
    this.hasError = true
  }
}
