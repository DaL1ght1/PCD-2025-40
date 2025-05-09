import { Component, Input, Output, EventEmitter } from "@angular/core"
import {NgClass, NgForOf, NgIf} from '@angular/common';


@Component({
  standalone: true,
  selector: "app-file-upload",
  templateUrl: "./file-upload.component.html",
  styleUrls: ["./file-upload.component.scss"],

  imports: [
    NgClass,
    NgForOf,
    NgIf
  ]
})
export class FileUploadComponent {
  @Input() accept = "*/*"
  @Input() multiple = false
  @Input() maxFileSize = 10 * 1024 * 1024 // 10MB
  @Input() placeholder = "Drag and drop files here, or click to browse"

  @Output() filesChanged = new EventEmitter<File[]>()

  files: File[] = []
  isDragging = false

  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = true
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = false
  }

  onDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = false

    const files = event.dataTransfer?.files
    if (files) {
      this.addFiles(files)
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files) {
      this.addFiles(input.files)
    }
  }

  addFiles(fileList: FileList): void {
    if (!this.multiple && this.files.length > 0) {
      this.files = []
    }

    Array.from(fileList).forEach((file) => {
      if (file.size <= this.maxFileSize) {
        if (this.multiple) {
          this.files.push(file)
        } else {
          this.files = [file]
        }
      }
    })

    this.filesChanged.emit(this.files)
  }

  removeFile(index: number): void {
    this.files.splice(index, 1)
    this.filesChanged.emit(this.files)
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
