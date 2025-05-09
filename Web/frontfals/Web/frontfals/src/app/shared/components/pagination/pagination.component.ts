import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core"


@Component({
  standalone:true,
  selector: "app-pagination",
  templateUrl: "./pagination.component.html",
  styleUrls: ["./pagination.component.scss"],

})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0
  @Input() itemsPerPage = 10
  @Input() currentPage = 1
  @Input() maxVisiblePages = 5

  @Output() pageChanged = new EventEmitter<number>()

  totalPages = 1
  pages: number[] = []

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePages()
  }

  calculatePages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)

    if (this.totalPages <= this.maxVisiblePages) {
      // Show all pages
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1)
    } else {
      // Calculate visible pages
      let startPage = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2))
      let endPage = startPage + this.maxVisiblePages - 1

      if (endPage > this.totalPages) {
        endPage = this.totalPages
        startPage = Math.max(1, endPage - this.maxVisiblePages + 1)
      }

      this.pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return
    }

    this.currentPage = page
    this.calculatePages()
    this.pageChanged.emit(page)
  }
}
