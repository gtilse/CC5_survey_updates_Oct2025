// Imports
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

// App imports
import { APPSHARED } from '../app-setting';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppDataService } from '../services/app-data.service';

// Staff login component
@Component({
  selector: 'app-survey-status-dialog',
  providers: [AppComponentStateService],
  template: `
    <style>
      .mat-dialog-content {
        height: 50vh;
        border: 1px solid #EEE;
        padding: 16px;
      }
    </style>

    <!-- Heading -->
    <div fxLayout="row" fxLayoutAlign="start center">
      <h2 mat-dialog-title fxFlex="grow">
        {{ 'SURVEY_STATUS.HEADING' | translate }}
        <span class="text-secondary">[{{ dialogData.description }}]</span>
      </h2>

      <div fxFlex="none" [hidden]="!surveyLog.length">{{ "GENERAL.RECORD_COUNT" | translate:{ value: surveyLog.length } }}</div>
      
    </div>
    

    <mat-dialog-content>
      
      <!-- Date selection -->
      <div fxLayout="column" fxLayoutGap="16px">
        
      <div fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="32px">
        <mat-form-field fxFlex>
            <mat-select
              (selectionChange)="fetchSurveyLog()"
              [(ngModel)]="selectedSendId"
              [disabled]="isFetchingData || appComponentStateService.isLoading"
              placeholder="{{ 'SURVEY_STATUS.SEND_ID_PLACEHOLDER' | translate }}"
            >
              <mat-option
                *ngFor="let item of surveySendIdsList"
                [value]="item.sendId"
              >
                {{ item.sendDate | utcToLocal }}
              </mat-option>
            </mat-select>
        </mat-form-field>

        <button fxFlex="none" mat-icon-button color="primary" (click)="fetchSurveyLog()" [disabled]="isFetchingData || !selectedSendId"><mat-icon>refresh</mat-icon></button>
      </div>
      

        <!-- Loading spinner -->
        <app-loading [hidden]="!isFetchingData"></app-loading>

        <!-- Data table -->
        <mat-table [dataSource]="surveyLog" *ngIf="surveyLog.length">

          <!-- Client name -->
          <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef fxFlex="15">{{ 'SURVEY_STATUS.NAME' | translate }}</mat-header-cell>
            <mat-cell fxFlex="15" *matCellDef="let item">{{item.name}}</mat-cell>
          </ng-container>

          <!-- Email -->
          <ng-container matColumnDef="email">
            <mat-header-cell *matHeaderCellDef fxFlex="20">{{ 'SURVEY_STATUS.EMAIL' | translate }}</mat-header-cell>
            <mat-cell fxFlex="20" *matCellDef="let item">{{item.email}}</mat-cell>
          </ng-container>

          <!-- Email Status -->
          <ng-container matColumnDef="emailStatus">
            <mat-header-cell *matHeaderCellDef fxFlex="10">{{ 'SURVEY_STATUS.EMAIL_STATUS' | translate }}</mat-header-cell>
            <mat-cell fxFlex="10" *matCellDef="let item">{{item.emailStatus}}</mat-cell>
          </ng-container>

          <!-- Email Opened -->
          <ng-container matColumnDef="emailOpened">
            <mat-header-cell *matHeaderCellDef fxFlex="10">{{ 'SURVEY_STATUS.EMAIL_OPENED' | translate }}</mat-header-cell>
            <mat-cell fxFlex="10" *matCellDef="let item">{{item.emailOpened}}</mat-cell>
          </ng-container>

          <!-- Response received on -->
          <ng-container matColumnDef="receivedOnDate">
            <mat-header-cell *matHeaderCellDef fxFlex="15">{{ 'SURVEY_STATUS.RESPONSE_RECEIVED_ON' | translate }}</mat-header-cell>
            <mat-cell fxFlex="15" *matCellDef="let item">{{ item.receivedOnDate | utcToLocal }}</mat-cell>
          </ng-container>

          <!-- Reminder date -->
          <ng-container matColumnDef="reminderDate">
            <mat-header-cell *matHeaderCellDef fxFlex="15">{{ 'SURVEY_STATUS.REMINDER_DATE' | translate }}</mat-header-cell>
            <mat-cell fxFlex="15" *matCellDef="let item">{{ item.reminderDate | utcToLocal }}</mat-cell>
          </ng-container>

          <!-- Reminder Email Status -->
          <ng-container matColumnDef="reminderEmailStatus">
            <mat-header-cell *matHeaderCellDef fxFlex="15">{{ 'SURVEY_STATUS.REMINDER_EMAIL_STATUS' | translate }}</mat-header-cell>
            <mat-cell fxFlex="15" class="text-center" *matCellDef="let item">{{item.reminderEmailStatus}}</mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="columns;"></mat-header-row>
          <mat-row *matRowDef="let row; columns: columns"></mat-row>

        </mat-table>
      </div>

    </mat-dialog-content>
    
    <!-- Footer -->
    <div fxLayout="column" fxLayoutGap="32px" class="push-top">
      <!-- <mat-divider></mat-divider> -->
      <div fxLayout="row">
        <div fxFlex="grow"></div>
        <button fxFlex="none" mat-stroked-button color="primary" mat-dialog-close>
          {{ 'GENERAL.BTN_CLOSE' | translate }}
        </button>
      </div>
    </div>
    
  `
})
export class SurveyStatusDialogComponent implements OnInit {
  // Component properties
  APPSHARED = APPSHARED;
  surveySendIdsList: Array<any> = [];
  surveyLog: Array<any> = [];
  isFetchingData = false;
  columns: string[] = [
    'name', 'email', 'emailStatus', 'emailOpened', 'receivedOnDate', 'reminderDate', 'reminderEmailStatus'
  ];
  selectedSendId = '';

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<SurveyStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService
  ) {}

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;
    this.loadData();
  }

  // Load send ids
  loadData() {
    this.appDataService.getSendIdsForSurvey(this.dialogData.surveyId).subscribe(
      (res) => {
        this.surveySendIdsList = res;
        this.appComponentStateService.isLoading = false;
      },
      () => {
        this.appComponentStateService.hasError = true;
      }
    );
  }

  // Fetch survey log on selection change
  fetchSurveyLog() {
    const sendId = this.selectedSendId;
    this.surveyLog = [];
    this.isFetchingData = true;

    if (
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.CLIENT.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.PULSE.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.PROJECT.VALUE
    ) {
      this.appDataService
        .getSurveyLogForClientBySendId(sendId, this.dialogData.surveyId)
        .subscribe(
          (res) => {
            this.surveyLog = res;
            this.isFetchingData = false;
          },
          () => {
            this.isFetchingData = false;
          }
        );
    } else if (
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.STAFF.VALUE ||
      this.dialogData.surveyType === APPSHARED.SURVEY_TYPE.MANAGER.VALUE
    ) {
      this.appDataService.getSurveyLogForStaffBySendId(sendId).subscribe(
        (res) => {
          this.surveyLog = res;
          this.isFetchingData = false;
        },
        () => {
          this.isFetchingData = false;
        }
      );
    } else {
      this.isFetchingData = false;
    }
  }
}
