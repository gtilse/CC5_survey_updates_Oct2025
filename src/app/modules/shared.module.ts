/**
 * Shared Module
 * @description
 * Shared module is imported by lazy loaded modules, auth and app
 * Imports and then re-exports third party modules
 */

// Angular
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
// Angular Material
import {DragDropModule} from '@angular/cdk/drag-drop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

// Ngx Errors
import { NgxErrorsModule } from '@hackages/ngxerrors';

// File upload
import { FileUploadModule } from 'ng2-file-upload';

// ngxCharts
import { NgxChartsModule } from '@swimlane/ngx-charts';

// highcharts
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as HighchartsMore from 'highcharts/highcharts-more.src';
import * as HighchartsSolidGauge from 'highcharts/modules/solid-gauge';

// resize moduel
import { AngularResizeEventModule } from 'angular-resize-event';

//
import { QuillModule } from 'ngx-quill';

// App components
import { TranslateModule } from '@ngx-translate/core';
import { CopyrightFooterComponent } from '../helper-components/copyright-footer.component';
import { AppFooterComponent } from '../helper-components/app-footer.component';

// Pipes
import {
  UtcToLocal,
  EmployeeIdToName,
  FilterDropListByCategory
} from '../app.pipes';

// Directives
import {
  ToggleSiblingDirective,
  ClientInfoDirective,
  EmployeeInfoDirective,
  FormattedTextDirective,
  MatCheckboxValueDirective
} from '../app.directives';

// Ngx Translate

// App notification service
import { AppNotificationService } from '../services/app-notification.service';

@NgModule({
  imports: [TranslateModule],
  providers: [
    AppNotificationService,
    { provide:  MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { float: 'auto' } },
    {
      provide: HIGHCHARTS_MODULES,
      useFactory: () => [HighchartsMore, HighchartsSolidGauge]
    }
  ],
  declarations: [
    //
    CopyrightFooterComponent,
    AppFooterComponent,

    // Directives
    ToggleSiblingDirective,
    ClientInfoDirective,
    FormattedTextDirective,
    EmployeeInfoDirective,
    MatCheckboxValueDirective,

    // Pipes
    UtcToLocal,
    EmployeeIdToName,
    FilterDropListByCategory
  ],

  exports: [
    // Components
    CopyrightFooterComponent,
    AppFooterComponent,

    // Directives
    ToggleSiblingDirective,
    ClientInfoDirective,
    FormattedTextDirective,
    EmployeeInfoDirective,
    MatCheckboxValueDirective,

    // Pipes
    UtcToLocal,
    EmployeeIdToName,
    FilterDropListByCategory,

    // Angular
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,

    // Material
    DragDropModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MatToolbarModule,
    MatSelectModule,
    MatTabsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatCardModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatRadioModule,
    MatListModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSortModule,
    MatProgressBarModule,
    MatStepperModule,
    MatRippleModule,
    MatAutocompleteModule,

    //
    QuillModule,

    // Ngx Errors
    NgxErrorsModule,
    // File Upload Module
    FileUploadModule,
    // ngxCharts
    NgxChartsModule,
    // Translate module
    TranslateModule,

    // highchart
    ChartModule,

    // resize
    AngularResizeEventModule
  ]
})
export class SharedModule {}
