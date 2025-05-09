import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CaseStatus } from '../../../core/models/case.model';

@Component({
  selector: 'app-case-filter',
  templateUrl: './case-filter.component.html',
  styleUrls: ['./case-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class CaseFilterComponent implements OnInit {
  @Input() activeFilters: {
    title?: string;
    status?: string;
    investigatorId?: string;
    expertId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortDirection?: string;
  } = {};

  @Output() filterChange = new EventEmitter<any>();

  caseStatuses = Object.values(CaseStatus);

  // Create a local copy of filters for editing
  localFilters: any = {};

  ngOnInit(): void {
    // Clone the active filters to our local state
    this.localFilters = { ...this.activeFilters };
  }

  applyFilters(): void {
    this.filterChange.emit(this.localFilters);
  }

  clearFilters(): void {
    this.localFilters = {
      title: '',
      status: '',
      investigatorId: '',
      expertId: '',
      startDate: '',
      endDate: '',
      sortBy: '',
      sortDirection: ''
    };
    this.filterChange.emit(this.localFilters);
  }
}
