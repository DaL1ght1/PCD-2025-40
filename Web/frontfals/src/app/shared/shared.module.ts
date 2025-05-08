import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { HttpClientModule } from "@angular/common/http"
import { MatDialogModule } from "@angular/material/dialog"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatMenuModule } from "@angular/material/menu"
import { MatTabsModule } from "@angular/material/tabs"
import { MatSelectModule } from "@angular/material/select"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { MatRadioModule } from "@angular/material/radio"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import { MatInputModule } from "@angular/material/input"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatSnackBarModule } from "@angular/material/snack-bar"
import { MatTableModule } from "@angular/material/table"
import { MatPaginatorModule } from "@angular/material/paginator"
import { MatSortModule } from "@angular/material/sort"
import { MatCardModule } from "@angular/material/card"
import { MatExpansionModule } from "@angular/material/expansion"
import { MatChipsModule } from "@angular/material/chips"
import { MatBadgeModule } from "@angular/material/badge"
import { MatListModule } from "@angular/material/list"
import { MatSidenavModule } from "@angular/material/sidenav"
import { MatToolbarModule } from "@angular/material/toolbar"
import { MatStepperModule } from "@angular/material/stepper"
import { MatGridListModule } from "@angular/material/grid-list"
import { MatAutocompleteModule } from "@angular/material/autocomplete"
import { MatSlideToggleModule } from "@angular/material/slide-toggle"
import { MatSliderModule } from "@angular/material/slider"
import { MatButtonToggleModule } from "@angular/material/button-toggle"
import { MatTreeModule } from "@angular/material/tree"
import { MatDividerModule } from "@angular/material/divider"
import { NgxDropzoneModule } from "ngx-dropzone"
import { BaseChartDirective } from "ng2-charts"
import { LoadingSpinnerComponent } from "./components/loading-spinner/loading-spinner.component"
import { ConfirmDialogComponent } from "./components/confirm-dialog/confirm-dialog.component"
import { NotFoundComponent } from "./components/not-found/not-found.component"
import { HeaderComponent } from "./components/header/header.component"
import { FooterComponent } from "./components/footer/footer.component"
import { SidebarComponent } from "./components/sidebar/sidebar.component"
import { PaginationComponent } from "./components/pagination/pagination.component"
import { SearchBarComponent } from "./components/search-bar/search-bar.component"
import { FilterComponent } from "./components/filter/filter.component"

@NgModule({
  declarations: [
    // Non-standalone components that exist in the project

  ],
  imports: [
    // Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Material modules
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatTabsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatStepperModule,
    MatGridListModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatTreeModule,
    MatDividerModule,

    // Third-party modules
    NgxDropzoneModule,
    BaseChartDirective,
    BaseChartDirective,

    // Standalone components
    HeaderComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    NotFoundComponent,
    FooterComponent,
    SidebarComponent,
    PaginationComponent,
    SearchBarComponent,
    FilterComponent,
  ],
  exports: [
    // Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Material modules
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatTabsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatStepperModule,
    MatGridListModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatTreeModule,
    MatDividerModule,

    // Third-party modules
    NgxDropzoneModule,
    BaseChartDirective,

    // Components
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    NotFoundComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    PaginationComponent,
    SearchBarComponent,
    FilterComponent,
  ],
})
export class SharedModule {}
