import { Component, OnInit } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LegalDocumentService } from "../../../core/services/legal-document.service";
import { LegalDocument, DocumentTemplate } from "../../../core/models/lawyer.model";
import { SafeHtmlPipe } from "../../pipes/safe-html.pipe";
import { HighlightPlaceholderDirective } from "../../directives/highlight-placeholder.directive";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component";
import { ToastrService } from 'ngx-toastr';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category.pipe';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from "../../../core/services/auth.service";
import { User } from "../../../core/models/user.model";
import { LAWYER_DOCUMENT_TEMPLATES } from './legal-document-templates';

declare var bootstrap: any;

@Component({
  standalone: true,
  selector: "app-legal-documents",
  templateUrl: "./legal-documents.component.html",
  styleUrls: ["./legal-documents.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SafeHtmlPipe,
    HighlightPlaceholderDirective,
    FilterByCategoryPipe,
    MatDialogModule,
    TitleCasePipe
  ],
})
export class LegalDocumentsComponent implements OnInit {
  documents: LegalDocument[] = [];
  templates: DocumentTemplate[] = [];
  selectedTemplate: DocumentTemplate | null = null;
  currentDocument: LegalDocument | null = null;
  isEditing = false;
  isCreating = false;
  isReviewing = false;
  searchTerm = "";
  isLoading = false;
  documentCategories: string[] = [];
  selectedCategory = "all";
  currentUser: User | null = null;

  isEditingTemplate = false;
  currentTemplate: DocumentTemplate | null = null;
  templateEditForm!: FormGroup;

  constructor(
    private documentService: LegalDocumentService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.toastr.error("User not authenticated.", "Authentication Error");
      return;
    }
    this.initializeForms();
    this.loadInitialData();
  }

  initializeForms(): void {
    this.templateEditForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.loadTemplates();
    this.loadDocuments();
  }

  loadTemplates(): void {
    this.templates = JSON.parse(JSON.stringify(LAWYER_DOCUMENT_TEMPLATES));
    this.recalculateCategories();
  }

  loadDocuments(): void {
    this.documentService.getDocuments().pipe(
      finalize(() => this.isLoading = false),
      catchError(error => {
        this.toastr.error("Error loading documents.", "Error");
        return of([]);
      })
    ).subscribe(documents => {
      this.documents = documents;
    });
  }

  createNewDocument(template: DocumentTemplate): void {
    this.selectedTemplate = template;
    this.currentDocument = {
      id: "",
      title: `New ${template.name}`,
      content: template.content || '',
      templateId: template.id === 'blank' ? '' : template.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
      tags: [],
      ownerId: this.currentUser?.id || '',
      metadata: { ...(template.metadata || {}), createdFromTemplate: template.name }
    };
    this.isCreating = true;
    this.isEditing = true;
    this.isReviewing = false;
    this.isEditingTemplate = false;
  }

  editDocument(documentToEdit: LegalDocument): void {
    this.isLoading = true;
    this.documentService.getDocument(documentToEdit.id).pipe(
      finalize(() => this.isLoading = false),
      catchError(error => {
        this.toastr.error("Error loading document.", "Error"); return of(null);
      })
    ).subscribe(fullDocument => {
      if (fullDocument) {
        this.currentDocument = { ...fullDocument };
        this.selectedTemplate = this.templates.find((t) => t.id === fullDocument.templateId) || null;
        this.isEditing = true;
        this.isCreating = false;
        this.isReviewing = false;
        this.isEditingTemplate = false;
      }
    });
  }

  reviewDocument(documentToReview: LegalDocument): void {
    this.isLoading = true;
    this.documentService.getDocument(documentToReview.id).pipe(
      finalize(() => this.isLoading = false),
      catchError(error => {
        this.toastr.error("Error loading document.", "Error"); return of(null);
      })
    ).subscribe(fullDocument => {
      if (fullDocument) {
        this.currentDocument = { ...fullDocument };
        this.isReviewing = true;
        this.isEditing = false;
        this.isCreating = false;
        this.isEditingTemplate = false;
      }
    });
  }

  saveDocument(): void {
    if (!this.currentDocument) { this.toastr.error("No document data.", "Error"); return; }
    if (!this.currentDocument.title?.trim()) { this.toastr.error("Title required.", "Validation Error"); return; }

    this.isLoading = true;
    this.currentDocument.updatedAt = new Date();

    const serviceCall = this.isCreating
      ? this.documentService.createDocument(this.currentDocument)
      : this.documentService.updateDocument(this.currentDocument);

    serviceCall.pipe(
      finalize(() => this.isLoading = false),
      catchError(error => { this.toastr.error("Error saving document.", "Error"); return of(null); })
    ).subscribe(savedOrUpdatedDocument => {
      if (savedOrUpdatedDocument) {
        this.toastr.success(this.isCreating ? "Document created." : "Document updated.", "Success");
        this.resetState();
        this.loadDocuments();
      }
    });
  }

  deleteDocument(documentToDelete: LegalDocument): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Document', message: `Delete "${documentToDelete.title}"?`, detail: 'This cannot be undone.', confirmText: 'Delete', confirmClass: 'btn-danger' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.documentService.deleteDocument(documentToDelete.id).pipe(
          finalize(() => this.isLoading = false),
          catchError(error => { this.toastr.error("Error deleting document.", "Error"); return of(null); })
        ).subscribe(() => {
          this.documents = this.documents.filter((d) => d.id !== documentToDelete.id);
          this.toastr.success("Document deleted.", "Success");
        });
      }
    });
  }

  finalizeDocument(documentToFinalize: LegalDocument): void {
    if (this.checkForPlaceholders()) { this.toastr.warning('Fill placeholders first.', 'Warning'); return; }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Finalize Document', message: `Finalize "${documentToFinalize.title}"?`, detail: 'Cannot be edited after.', confirmText: 'Finalize', confirmClass: 'btn-success' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedDoc: LegalDocument = { ...documentToFinalize, status: 'finalized', updatedAt: new Date() };
        this.isLoading = true;
        this.documentService.updateDocument(updatedDoc).pipe(
          finalize(() => this.isLoading = false),
          catchError(error => { this.toastr.error('Error finalizing document.', 'Error'); return of(null); })
        ).subscribe(res => {
          if (res) {
            const index = this.documents.findIndex((d) => d.id === res.id);
            if (index !== -1) this.documents[index] = res; else this.documents.push(res);
            this.resetState();
            this.toastr.success('Document finalized.', 'Success');
          }
        });
      }
    });
  }

  exportDocument(docToExport: LegalDocument, format: 'pdf' | 'docx'): void {
    this.isLoading = true;
    this.documentService.exportDocument(docToExport.id, format).pipe(
      finalize(() => this.isLoading = false),
      catchError(error => { this.toastr.error(`Error exporting document.`, 'Error'); return of(null); })
    ).subscribe(blob => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = docToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeTitle}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.success(`Document exported as ${format.toUpperCase()}!`, 'Success');
      }
    });
  }

  editTemplate(template: DocumentTemplate, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (template.id === 'blank') { this.toastr.info("Blank template cannot be edited.", "Info"); return; }

    this.currentTemplate = { ...template };
    this.templateEditForm.patchValue({
      id: this.currentTemplate.id,
      name: this.currentTemplate.name,
      description: this.currentTemplate.description || '',
      category: this.currentTemplate.category,
      content: this.currentTemplate.content || ''
    });
    this.isEditingTemplate = true;
    this.isEditing = false;
    this.isCreating = false;
    this.isReviewing = false;
    this.hideTemplateModal();
  }

  saveTemplate(): void {
    if (!this.currentTemplate || this.templateEditForm.invalid) {
      this.toastr.error("Please correct template form errors.", "Validation Error");
      this.templateEditForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValues = this.templateEditForm.value;
    const updatedTemplateData: DocumentTemplate = {
      ...this.currentTemplate,
      name: formValues.name,
      description: formValues.description,
      category: formValues.category,
      content: formValues.content,
      metadata: { ...(this.currentTemplate.metadata || {}), lastUpdated: new Date() }
    };

    const index = this.templates.findIndex(t => t.id === updatedTemplateData.id);
    if (index !== -1) {
      this.templates[index] = updatedTemplateData;
      this.templates = [...this.templates];
      this.recalculateCategories();
      this.resetState();
      this.toastr.success("Template updated locally (session only).", "Success");
    } else {
      this.toastr.error("Original template not found locally.", "Error");
    }
    this.isLoading = false;
  }

  deleteTemplate(templateToDelete: DocumentTemplate, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (templateToDelete.id === 'blank') { this.toastr.error("Blank template cannot be deleted.", "Error"); return; }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Template', message: `Delete "${templateToDelete.name}"?`,
        detail: 'This action cannot be undone and only affects this session.', confirmText: 'Delete', confirmClass: 'btn-danger'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.templates = this.templates.filter(t => t.id !== templateToDelete.id);
        this.recalculateCategories();
        this.toastr.success("Template deleted locally (session only).", "Success");
        if (this.currentTemplate?.id === templateToDelete.id) this.resetState();
        this.hideTemplateModal();
        this.isLoading = false;
      }
    });
  }

  recalculateCategories(): void {
    this.documentCategories = [...new Set(this.templates.map((t) => t.category))];
    if (!this.documentCategories.includes('Custom')) this.documentCategories.push('Custom');
    if (!this.documentCategories.includes(this.selectedCategory) && this.selectedCategory !== 'all') {
      this.selectedCategory = 'all';
    }
  }

  resetState(): void {
    this.currentDocument = null;
    this.selectedTemplate = null;
    this.isEditing = false;
    this.isCreating = false;
    this.isReviewing = false;
    this.isEditingTemplate = false;
    this.currentTemplate = null;
    this.templateEditForm?.reset();
  }

  filterDocuments(): LegalDocument[] {
    let filtered = this.documents;
    if (this.selectedCategory !== "all") {
      const templateIdsInCategory = this.templates
        .filter((t) => t.category === this.selectedCategory)
        .map((t) => t.id);
      if (this.selectedCategory === 'Custom') {
        filtered = filtered.filter((doc) => !doc.templateId || !this.templates.some(t => t.id === doc.templateId) || doc.templateId === 'blank');
      } else {
        filtered = filtered.filter((doc) => doc.templateId && templateIdsInCategory.includes(doc.templateId));
      }
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        (doc.content && doc.content.toLowerCase().includes(term)) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    return filtered;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "draft": return "badge bg-secondary";
      case "finalized": return "badge bg-success";
      case "needs-review": return "badge bg-info";
      default: return "badge bg-light text-dark";
    }
  }

  getTemplateName(templateId: string): string {
    if (!templateId || templateId === 'blank') return 'Blank/Custom';
    const template = this.templates.find((t) => t.id === templateId);
    return template ? template.name : "Unknown Template";
  }

  addTag(tag: string): void {
    if (!this.currentDocument) return;
    const trimmedTag = tag.trim();
    if (trimmedTag) {
      if (!this.currentDocument.tags) this.currentDocument.tags = [];
      if (!this.currentDocument.tags.includes(trimmedTag)) this.currentDocument.tags.push(trimmedTag);
    }
  }

  removeTag(tagToRemove: string): void {
    if (!this.currentDocument || !this.currentDocument.tags) return;
    this.currentDocument.tags = this.currentDocument.tags.filter((t) => t !== tagToRemove);
  }

  checkForPlaceholders(): boolean {
    const contentToCheck = this.isEditingTemplate ? this.templateEditForm?.get('content')?.value : this.currentDocument?.content;
    if (!contentToCheck) return false;
    const placeholderPattern = /\[[A-Z0-9\s_]+\]/gi;
    const spanPattern = /<span\s+class="placeholder">.*?<\/span>/gi;
    return placeholderPattern.test(contentToCheck) || spanPattern.test(contentToCheck);
  }

  hideTemplateModal(): void {
    const modalElement = document.getElementById('templateModal');
    if (modalElement) {
      try {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance?.hide();
        setTimeout(() => {
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, 150);
      } catch(e) {
        console.warn("Could not get Bootstrap modal instance to hide.", e);
      }
    }
  }
}
