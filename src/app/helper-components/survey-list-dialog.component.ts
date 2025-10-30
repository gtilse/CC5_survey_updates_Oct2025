import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppDataService } from '../services/app-data.service';

// Staff login component
@Component({
  selector: 'app-survey-list-dialog',
  providers: [AppComponentStateService],
  template: `
    <style>
      .mat-dialog-content {
        height: 65vh;
      }
    </style>

    <!-- Dialog title -->
    <h2 mat-dialog-title>
      <span
        *ngIf="dialogData.surveyType == APPSHARED.SURVEY_TYPE.CLIENT.VALUE"
        >{{ 'SURVEY_LIST.CLIENT_HEADING' | translate }}</span
      >
      <span
        *ngIf="dialogData.surveyType == APPSHARED.SURVEY_TYPE.STAFF.VALUE"
        >{{ 'SURVEY_LIST.STAFF_HEADING' | translate }}</span
      >
      <span
        *ngIf="dialogData.surveyType == APPSHARED.SURVEY_TYPE.PULSE.VALUE"
        >{{ 'SURVEY_LIST.PULSE_HEADING' | translate }}</span
      >
      <span
        *ngIf="dialogData.surveyType == APPSHARED.SURVEY_TYPE.MANAGER.VALUE"
        >{{ 'SURVEY_LIST.MANAGER_HEADING' | translate }}</span
      >
      <span
        *ngIf="dialogData.surveyType == APPSHARED.SURVEY_TYPE.PROJECT.VALUE"
        >{{ 'SURVEY_LIST.PROJECT_HEADING' | translate }}</span
      >
      &nbsp;&nbsp;<span class="text-secondary"
        >[{{ dialogData.description }}]</span
      >
    </h2>
    
    <!-- Content -->
    <mat-dialog-content>

      <!-- Loading component -->
      <app-loading [hidden]="!appComponentStateService.isLoading"></app-loading>

      <!-- Record count -->
      <p class="text-secondary" [hidden]="appComponentStateService.isLoading">
        {{ 'GENERAL.RECORD_COUNT' | translate: { value: surveyList.length } }}
      </p>

      <!-- Table -->
      <!-- Data table -->
      <mat-table [dataSource]="surveyList" *ngIf="surveyList.length">
        
        <!-- CLIENT TYPE SURVEYS -->

        <!-- Client name -->
        <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef>{{ 'CLIENT.NAME' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.name}}</mat-cell>
        </ng-container>

        <!-- DRL name -->
        <ng-container matColumnDef="drlName">
            <mat-header-cell *matHeaderCellDef>{{ 'CLIENT.CLIENT_CONTACT' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.drlName}}</mat-cell>
        </ng-container>

        <!-- Email -->
        <ng-container matColumnDef="email">
            <mat-header-cell *matHeaderCellDef>{{ 'CLIENT.EMAIL' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.email}}</mat-cell>
        </ng-container>

        <!-- Phone -->
        <ng-container matColumnDef="phone">
            <mat-header-cell *matHeaderCellDef>{{ 'CLIENT.PHONE' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.phone}}</mat-cell>
        </ng-container>

        <!-- Preview -->
        <ng-container matColumnDef="action">
            <mat-header-cell *matHeaderCellDef>{{ 'SURVEY.PREVIEW' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item"><span><button mat-icon-button color="primary" (click)="previewSurvey(item)"><mat-icon>preview</mat-icon></button></span></mat-cell>
        </ng-container>

        <!-- STAFF TYPE SURVEYS -->

        <!-- Name -->
        <ng-container matColumnDef="employeeName">
            <mat-header-cell *matHeaderCellDef>{{ 'STAFF.NAME' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.employeeName}}</mat-cell>
        </ng-container>

        <!-- Department -->
        <ng-container matColumnDef="department">
            <mat-header-cell *matHeaderCellDef>{{ 'STAFF.DEPARTMENT' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.department}}</mat-cell>
        </ng-container>

        <!-- Designation -->
        <ng-container matColumnDef="designation">
            <mat-header-cell *matHeaderCellDef>{{ 'STAFF.DESIGNATION' | translate }}</mat-header-cell>
            <mat-cell *matCellDef="let item">{{item.designation}}</mat-cell>
        </ng-container>

        <!-- Header and Rows -->
        <mat-header-row *matHeaderRowDef="columns;"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns"></mat-row>

      </mat-table>

    </mat-dialog-content>

    <mat-dialog-actions layout="row">
      <div flex></div>

      <button mat-raised-button color="primary" (click)="exportToCSV()">{{ 'GENERAL.EXPORT_CSV' | translate }}</button>
      <button mat-stroked-button mat-dialog-close>
        {{ 'GENERAL.BTN_CLOSE' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class SurveyListDialogComponent implements OnInit {
  // Component properties
  APPSHARED = APPSHARED;

  surveyList: Array<any> = [];
  columns: String[] = [];

  private _extWindow: any = null;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<SurveyListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService
  ) {}

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;

    this.columns =  this.dialogData.surveyType == APPSHARED.SURVEY_TYPE.CLIENT.VALUE ||
                    this.dialogData.surveyType == APPSHARED.SURVEY_TYPE.PULSE.VALUE ||
                    this.dialogData.surveyType == APPSHARED.SURVEY_TYPE.PROJECT.VALUE ? ['name', 'drlName', 'email', 'phone', 'action'] : ['employeeName', 'email', 'department', 'designation'];
    
    this.loadData();
  }

  // Load data for survey
  loadData() {
    this.surveyList = [];

    if (
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.CLIENT.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.PULSE.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.PROJECT.VALUE
    ) {
      this.appDataService
        .getClientListForSurvey(this.dialogData.surveyId)
        .subscribe(
          (res) => {
            this.surveyList = res;
            this.appComponentStateService.isLoading = false;
          },
          (err) => {
            this.appComponentStateService.hasError = true;
          }
        );
    } else if (
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.STAFF.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.MANAGER.VALUE
    ) {
      this.appDataService
        .getStaffListForSurvey(this.dialogData.surveyId)
        .subscribe(
          (res) => {
            this.surveyList = res;
            this.appComponentStateService.isLoading = false;
          },
          () => {
            this.appComponentStateService.hasError = true;
          }
        );
    } else {
      this.appComponentStateService.isLoading = false;
    }
  }

  // Preview
  previewSurvey(item: any) {
    if(this._extWindow) this._extWindow.close();
    let surveyType = '';
    
    switch(this.dialogData.surveyType){
    case 0:
        surveyType = 'CLI';
        break;
    case 1:
        surveyType = 'STA';
        break;
    case 2:
        surveyType = 'PUL';
        break;
    case 3:
        surveyType = 'MGR';
        break;
    case 4:
        surveyType = 'TRI';
    }

    // Open the window
    this._extWindow = window.open(APPSHARED.SURVEY_PREVIEW_URL + '?id=PREVIEW-' + this.dialogData.surveyId + '&type=' + surveyType + '&clientId=' + item.clientId, 'SurveyPreview', 'location=0,height=800,width=950,scrollbars=1,resizable=0,left=100,top=200');
  }

  // Export to CSV
  exportToCSV() {
    APPSHARED.exportToCsv(this.surveyList.map(elem => {
      return {
        "Client": elem.name,
        "Email": elem.email,
        "Phone": elem.phone,
        "Organization": elem.organisation,
        "Client Contact": elem.drlName
      }
    }), 'survey-list');
  }
}
