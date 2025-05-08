import { Component, Input, Output, EventEmitter } from "@angular/core"
import { Subject } from "rxjs"
import { debounceTime, distinctUntilChanged } from "rxjs/operators"
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';


@Component({
  standalone: true,
  selector: "app-search-bar",
  templateUrl: "./search-bar.component.html",
  styleUrls: ["./search-bar.component.scss"],

  imports: [
    FormsModule,
    NgIf
  ]
})
export class SearchBarComponent {
  @Input() placeholder = "Search..."
  @Input() debounceTime = 300
  @Output() search = new EventEmitter<string>()

  searchTerm = ""
  private searchSubject = new Subject<string>()

  constructor() {
    this.searchSubject.pipe(debounceTime(this.debounceTime), distinctUntilChanged()).subscribe((term) => {
      this.search.emit(term)
    })
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm)
  }

  clearSearch(): void {
    this.searchTerm = ""
    this.search.emit("")
  }
}
