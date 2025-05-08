import { Component, Input } from "@angular/core"
import {NgIf} from '@angular/common';


@Component({
  standalone: true,
  selector: "app-image-viewer",
  templateUrl: "./image-viewer.component.html",
  styleUrls: ["./image-viewer.component.scss"],

  imports: [
    NgIf
  ]
})
export class ImageViewerComponent {
  @Input() imageUrl = ""
  @Input() altText = "Image"
  @Input() caption = ""
  @Input() showCaption = true

  fullscreen = false
  zoom = 1

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen
    this.resetZoom()
  }

  closeFullscreen(event?: MouseEvent): void {
    if (!event || event.target === event.currentTarget) {
      this.fullscreen = false
      this.resetZoom()
    }
  }

  zoomIn(): void {
    this.zoom += 0.1
  }

  zoomOut(): void {
    if (this.zoom > 0.2) {
      this.zoom -= 0.1
    }
  }

  resetZoom(): void {
    this.zoom = 1
  }
}
