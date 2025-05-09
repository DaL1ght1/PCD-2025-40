import { bootstrapApplication } from "@angular/platform-browser"
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http"
import { provideAnimations } from "@angular/platform-browser/animations"
import { importProvidersFrom } from "@angular/core"
import { AppComponent } from "./app/app.component"
import { AuthInterceptor } from "./app/core/interceptors/auth.interceptor"
import { ErrorInterceptor } from "./app/core/interceptors/error.interceptor"
import { NgbModule } from "@ng-bootstrap/ng-bootstrap"
import { ToastrModule } from "ngx-toastr"
import { NgxDropzoneModule } from "ngx-dropzone"
import { AppRoutingModule } from "./app/app-routing.module"
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { ChartModule } from "./app/shared/modules/chart.module"
import {BaseUrlInterceptor} from './app/core/interceptors/baseurl.interceptor';
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    {provide: HTTP_INTERCEPTORS, useClass: BaseUrlInterceptor, multi: true},
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    importProvidersFrom(
      NgbModule,
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: "toast-top-right",
        preventDuplicates: true,
      }),
      NgxDropzoneModule,
      AppRoutingModule,
      FormsModule,
      ReactiveFormsModule,
      ChartModule,
    ),
  ],
}).catch((err) => console.error(err))
