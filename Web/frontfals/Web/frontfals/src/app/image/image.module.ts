import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule,Routes } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms"
import { NgxDropzoneModule } from "ngx-dropzone"
import { SharedModule } from "../shared/shared.module"
import { ImageUploadComponent } from "./components/image-upload/image-upload.component"
import { ImageListComponent } from "./components/image-list/image-list.component"
import { ImageDetailComponent } from "./components/image-detail/image-detail.component"
import { ImageAnalyzeComponent } from "./components/image-analyze/image-analyze.component"
import {ReportDetailComponent} from '../report/components/report-details/report-details.component';

const routes: Routes = [
  { path: "", component: ImageListComponent },
  { path: "upload", component: ImageUploadComponent },
  { path: "detail/:id", component: ImageDetailComponent },
  { path: "analyze/:id", component: ImageAnalyzeComponent },
  { path: ":reportId", component: ReportDetailComponent },

]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    NgxDropzoneModule,
    RouterModule.forChild(routes),
    // Import standalone components
    ImageUploadComponent,
    ImageListComponent,
    ImageDetailComponent,
    ImageAnalyzeComponent,
  ],
  exports: [RouterModule],
})
export class ImageModule {}
