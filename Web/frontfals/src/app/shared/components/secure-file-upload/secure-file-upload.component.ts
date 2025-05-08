import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core"
import { NgIf, NgForOf, NgClass } from "@angular/common"
import {FormControl, ReactiveFormsModule, ValidatorFn} from "@angular/forms"
import{ FormValidationService } from "../../../core/services/form-validation.service"

@Component({
  selector: "app-secure-file-upload",
  templateUrl: './secure-file-upload.component.html',
  styleUrl: './secure-file-upload.component.scss',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, ReactiveFormsModule],
})
export class SecureFileUploadComponent implements OnInit {
  @Input() accept = "image/*"
  @Input() multiple = false
  @Input() maxFileSize = 10 * 1024 * 1024 // 10MB
  @Input() placeholder = "Drag and drop files here, or click to browse"
  @Input() allowedFileTypes: string[] = []

  @Output() filesChanged = new EventEmitter<File[]>()

  files: File[] = []
  isDragging = false
  public fileControl = new FormControl<File | null>(null)

  constructor(private formValidationService: FormValidationService) {}

  ngOnInit(): void {
    this.setupValidators()
  }

  setupValidators(): void {
    const validators: ValidatorFn[] = []

    if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
      validators.push(<ValidatorFn>this.formValidationService.fileTypeValidator(this.allowedFileTypes))
    }

    if (this.maxFileSize) {
      validators.push(<ValidatorFn>this.formValidationService.fileSizeValidator(this.maxFileSize))
    }

    this.fileControl.setValidators(validators)
  }

  get validationMessage(): string {
    if (this.fileControl.errors) {
      return this.formValidationService.getErrorMessage(this.fileControl, "File")
    }
    return ""
  }

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
      // Validate file before adding
      this.fileControl.setValue(file)

      if (this.fileControl.valid) {
        if (this.multiple) {
          this.files.push(file)
        } else {
          this.files = [file]
        }
      } else {
        this.fileControl.markAsTouched()
      }
    })

    this.filesChanged.emit(this.files)
  }

  removeFile(index: number): void {
    this.files.splice(index, 1)
    this.filesChanged.emit(this.files)

    if (this.files.length === 0) {
      this.fileControl.setValue(null)
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
