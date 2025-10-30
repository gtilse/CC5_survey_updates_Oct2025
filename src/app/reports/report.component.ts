import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { ISurveyList } from '../models/data-model';
import { DataExportDialogComponent } from './data-export-dialog.component';

@Component({
  selector: 'app-report',
  providers: [AppComponentStateService],
  template: `
    <!-- Loading component -->
    <app-loading
      placeholder="{{ 'REPORT.HEADING' | translate }}"
      [hidden]="!appComponentStateService.isLoading"
    ></app-loading>

    <!-- Header -->
    <div
      class="card-header"
      [hidden]="
        appComponentStateService.isLoading || appComponentStateService.hasError
      "
    >
      <!-- Icon + header text -->
      <div fxLayout="row" fxLayoutAlign="start center" class="text-muted2">
        <mat-icon class="md-36" fxFlex="none">bar_chart</mat-icon>
        <span fxFlex="none" fxFlexOffset="16px" class="mat-headline">{{
          'REPORT.HEADING' | translate
        }}</span>
      </div>

      <!-- Title -->
      <div class="push-top-xxl push-bottom">
        <span class="mat-body-strong" fxFlex="none">{{
          'REPORT.SUB_HEADING' | translate
        }}</span>
      </div>

      <mat-divider></mat-divider>

      <!-- Report selection and params -->
      <form [formGroup]="reportForm" novalidate>
        <div fxLayout="row" class="push-top-xl filter-box">
          <!-- Report type -->
          <mat-form-field floatLabel="never" fxFlex="33">
            <mat-select
              placeholder="{{ 'REPORT.REPORT_TYPE_SELECT' | translate }}"
              (selectionChange)="reportSelectionChange($event)"
              formControlName="report"
            >
              <mat-select-trigger>
                {{ f.report.value?.DESC }}
                <span *ngIf="f.report.value?.SUFFIX" class="text-md">
                  ({{ f.report.value?.SUFFIX }})
                </span>
              </mat-select-trigger>
              <mat-optgroup
                *ngFor="let group of reportList.GROUPS"
                [label]="group.NAME"
                [hidden]="
                  group.ACCESS_LEVEL == 1 &&
                  group.ACCESS_LEVEL !== appStateService.loggedUser.accessLevel
                "
              >
                <mat-option *ngFor="let report of group.LIST" [value]="report">
                  {{ report.DESC }}
                </mat-option>
              </mat-optgroup>
            </mat-select>
          </mat-form-field>

          <!-- Survey selection -->
          <mat-form-field floatLabel="never" fxFlex="33" fxFlexOffset="32px">
            <mat-select
              placeholder="{{ 'REPORT.ALL_SURVEYS' | translate }}"
              formControlName="survey"
            >
              <mat-option class="clear-selection" [value]="null">{{
                'REPORT.ALL_SURVEYS' | translate
              }}</mat-option>
              <mat-option
                *ngFor="let clientSurvey of clientSurveyList"
                [value]="clientSurvey"
              >
                {{ clientSurvey.description }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Date selection -->
          <mat-form-field floatLabel="never" fxFlex="33" fxFlexOffset="32px">
            <mat-select
              placeholder="{{ 'GENERAL.FILTER_ALL_DATES' | translate }}"
              formControlName="dateRange"
            >
              <mat-option class="clear-selection" [value]="null">{{
                'GENERAL.FILTER_ALL_DATES' | translate
              }}</mat-option>
              <mat-option
                *ngFor="let dateRange of dateRanges"
                [value]="dateRange"
              >
                {{ dateRange.DESC }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Preview button -->
        <div fxLayout="row" class="push-top">
          <span fxFlex></span>
          <button
            type="button"
            flxFlex="none"
            mat-raised-button
            color="primary"
            [disabled]="
              !f.report.value ||
              appComponentStateService.isLoading ||
              fetchingReport
            "
            (click)="preview($event)"
          >
            {{ 'REPORT.PREVIEW' | translate | uppercase }}
          </button>
        </div>
      </form>
    </div>

    <div
      class="data-table-container"
      [hidden]="
        appComponentStateService.isLoading || appComponentStateService.hasError
      "
    >
      <!-- Export/Print buttons -->
      <div fxLayout="row" class="push-top push-bottom">
        <span fxFlex></span>
        <button
          type="button"
          fxFlex="none"
          color="primary"
          mat-raised-button
          [disabled]="appComponentStateService.isLoading || fetchingReport"
          [style.visibility]="exportVisible ? 'visible' : 'hidden'"
          (click)="exportToCSV($event)"
        >
          {{ 'REPORT.EXPORT' | translate | uppercase }}
        </button>
        <button
          type="button"
          fxFlex="none"
          color="primary"
          fxFlexOffset="24px"
          mat-raised-button
          (click)="print($event)"
          [disabled]="appComponentStateService.isLoading || fetchingReport"
        >
          {{ 'REPORT.PRINT' | translate | uppercase }}
        </button>
      </div>

      <!-- Organisation summary -->
      <organisation-summary-report
        *ngIf="f.report.value && f.report.value.VALUE == 'ORG_SUMMARY'"
        [data]="data"
      ></organisation-summary-report>

      <!-- Client survey status -->
      <client-survey-status-report
        *ngIf="f.report.value && f.report.value.VALUE == 'CLIENT_SURVEY_STATUS'"
        [data]="data"
      ></client-survey-status-report>

      <!-- All surveys -->
      <client-survey-all-results-report
        style="display:block;width:100%;overflow-x:auto"
        *ngIf="f.report.value && f.report.value.VALUE == 'CLIENT_ALL_RESULTS'"
        [data]="data"
      ></client-survey-all-results-report>

      <!-- Client survey responders -->
      <client-survey-responders-report
        *ngIf="f.report.value && f.report.value.VALUE == 'CLIENT_RESPONDERS'"
        [data]="data"
      ></client-survey-responders-report>

      <!-- Client action items -->
      <client-action-items-report
        *ngIf="f.report.value && f.report.value.VALUE == 'CLIENT_ACTION_ITEMS'"
        [data]="data"
      ></client-action-items-report>

      <!-- Client survey non-responders -->
      <client-survey-nonresponders-report
        *ngIf="
          f.report.value && f.report.value.VALUE == 'CLIENT_NON_RESPONDERS'
        "
        [data]="data"
      ></client-survey-nonresponders-report>

      <!-- Client satisfaction by -->
      <client-satisfaction-by-report
        *ngIf="
          f.report.value &&
          (f.report.value.VALUE == 'SATISFACTION_STAFF' ||
            f.report.value.VALUE == 'SATISFACTION_CATEGORY' ||
            f.report.value.VALUE == 'SATISFACTION_INDUSTRY')
        "
        [data]="data"
      ></client-satisfaction-by-report>

      <!-- Staff survey status -->
      <staff-survey-status-report
        *ngIf="f.report.value && f.report.value.VALUE == 'STAFF_SURVEY_STATUS'"
        [data]="data"
      ></staff-survey-status-report>

      <!-- Staff survey responders -->
      <staff-survey-responders-report
        *ngIf="f.report.value && f.report.value.VALUE == 'STAFF_RESPONDERS'"
        [data]="data"
      ></staff-survey-responders-report>

      <!--Pulse survey status -->
      <pulse-survey-status-report
        *ngIf="f.report.value && f.report.value.VALUE == 'PULSE_SURVEY_STATUS'"
        [data]="data"
      ></pulse-survey-status-report>

      <!-- Pulse survey responders -->
      <pulse-survey-responders-report
        *ngIf="f.report.value && f.report.value.VALUE == 'PULSE_RESPONDERS'"
        [data]="data"
      ></pulse-survey-responders-report>

      <!-- Manager survey status -->
      <manager-survey-status-report
        *ngIf="
          f.report.value && f.report.value.VALUE == 'MANAGER_SURVEY_STATUS'
        "
        [data]="data"
      ></manager-survey-status-report>

      <!-- Manager survey responders -->
      <manager-survey-responders-report
        *ngIf="f.report.value && f.report.value.VALUE == 'MANAGER_RESPONDERS'"
        [data]="data"
      ></manager-survey-responders-report>

    </div>
  `
})
export class ReportComponent implements OnInit {
  // Component properties
  reportForm: FormGroup;

  headers: Array<any> = [];

  data: Array<any> = [];

  reportList: any = APPSHARED.REPORT_LIST;

  dateRanges: any = APPSHARED.DATE_RANGES;

  clientSurveyList: Array<ISurveyList> = [];

  staffSurveyList: Array<ISurveyList> = [];

  fetchingReport = false;

  exportVisible = false;

  // Constructor
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {
    this.reportForm = this.fb.group({
      report: null,
      survey: null,
      dateRange: null
    });

    this.loadData();
  }

  // Load data
  loadData() {
    this.appComponentStateService.isLoading = true;

    this.appDataService.getSurveyList().subscribe(
      (res: ISurveyList[]) => {
        this.clientSurveyList = res.filter((r) => {
          return r.type === 0;
        });

        this.staffSurveyList = res.filter((r) => {
          return r.type === 1;
        });

        this.appComponentStateService.isLoading = false;
      },
      (err) => {
        this.appComponentStateService.isLoading = false;
      }
    );
  }

  // Conveninence getter for form values
  get f() {
    return this.reportForm.controls;
  }

  // Report selection change
  reportSelectionChange(event) {

    this.data = [];
    if(event.value.VALUE==='ORG_SUMMARY') {
      this.exportVisible = false;
    } else {
      this.exportVisible = true;
    }
    
  }

  // Preview report
  preview(event) {
    this.fetchingReport = true;
    this.data = [];
    const dateRange = this.f.dateRange.value
      ? this.f.dateRange.value.VALUE
      : null;
    const survey = this.f.survey.value ? this.f.survey.value.objectId : null;

    switch (this.f.report.value.VALUE) {
      case 'CLIENT_SURVEY_STATUS':
        this.appDataService
          .reportClientSurveyStatus({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );

        break;

      case 'CLIENT_ALL_RESULTS':
        this.appDataService
        .reportAllResults({ surveyId: survey, dateRange })
        .subscribe(
          (res) => {

            // Structure data for the report
            this.data = res.map(item => {
              if(item.loyaltyDrivers) {
                const loyaltyDrivers = JSON.parse(item.loyaltyDrivers) || [];
                item.loyaltyDriver1 = loyaltyDrivers.length > 0 ? loyaltyDrivers[0] : '';
                item.loyaltyDriver2 = loyaltyDrivers.length >=1 ? loyaltyDrivers[1] : '';
                item.loyaltyDriver3 = loyaltyDrivers.length >=2 ? loyaltyDrivers[2] : '';
              }

              return item;
            });
            this.fetchingReport = false;
          },
          (err) => {
            this.fetchingReport = false;
          }
        );

        break;

      case 'CLIENT_RESPONDERS':
        this.appDataService
          .reportClientSurveyResponders({
            surveyId: survey,
            dateRange
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );

        break;

      case 'CLIENT_ACTION_ITEMS':
        this.appDataService
          .reportClientActionItems({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );

        break;

      case 'CLIENT_NON_RESPONDERS':
        this.appDataService
          .reportClientSurveyNonResponders({
            surveyId: survey,
            dateRange
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );

        break;

      case 'SATISFACTION_STAFF':
      case 'SATISFACTION_CATEGORY':
      case 'SATISFACTION_INDUSTRY':
        this.appDataService
          .reportClientSatisfactionBy({
            surveyId: survey,
            dateRange,
            groupBy: this.f.report.value.VALUE
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'ORG_SUMMARY':
        this.appDataService
          .reportOrganisationSummary({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'STAFF_SURVEY_STATUS':
        this.appDataService
          .reportStaffSurveyStatus({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'STAFF_RESPONDERS':
        this.appDataService
          .reportStaffSurveyResponders({
            surveyId: survey,
            dateRange
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'PULSE_SURVEY_STATUS':
        this.appDataService
          .reportPulseSurveyStatus({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'PULSE_RESPONDERS':
        this.appDataService
          .reportPulseSurveyResponders({
            surveyId: survey,
            dateRange
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'MANAGER_SURVEY_STATUS':
        this.appDataService
          .reportManagerSurveyStatus({ surveyId: survey, dateRange })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      case 'MANAGER_RESPONDERS':
        this.appDataService
          .reportManagerSurveyResponders({
            surveyId: survey,
            dateRange
          })
          .subscribe(
            (res) => {
              this.data = res;
              this.fetchingReport = false;
            },
            (err) => {
              this.fetchingReport = false;
            }
          );
        break;

      default:
        this.fetchingReport = false;
        alert('Report not available');
        break;
    }
  }

  // Export to CSV
  exportToCSV(event) {

    const dialogRef = this.dialog.open(DataExportDialogComponent, {
      width: '600px',
      data: { report: this.f.report.value.VALUE, data: this.data }
    });
  }

  // Print report
  print(event) {
    window.print();
  }
}
