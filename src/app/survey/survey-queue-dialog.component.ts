import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';

// Survey queue dialog component
@Component({
  selector: 'app-survey-queue-dialog',
  providers: [AppComponentStateService],
  template: `

    <h2 mat-dialog-title>
      {{'SURVEY_QUEUE.HEADING' | translate}}&nbsp;[{{ dialogData.description }}]
    </h2>
    <mat-divider></mat-divider>
    <mat-dialog-content>
      <div class="push-top push-bottom">{{'SURVEY_QUEUE.SUB_HEADING' | translate}}</div>

      <div layout="row" layout-align="start start">
        <div flex="50">
          <mat-form-field class="full-width">
            <input matInput class="full-width" placeholder="{{'SURVEY_QUEUE.ENTER_CODE' | translate}}" [(ngModel)]="securityCode">
            <mat-hint [hidden]="!securityCodeEmailed">{{'SURVEY_QUEUE.CODE_EMAILED' | translate}}</mat-hint>
          </mat-form-field>
        </div>

        <div flex class="push-left">
          <button mat-raised-button class="push-top" color="primary" (click)="getCode()" [disabled]="isProcessing">{{'SURVEY_QUEUE.GET_CODE' | translate}}</button>
        </div>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions layout="row">
      <div flex></div>
      <button mat-button mat-dialog-close [disabled]="isProcessing">{{'GENERAL.BTN_CLOSE' | translate}}</button>
      <button mat-raised-button color="primary" (click)="queueSurvey()" [disabled]="isProcessing || !securityCode">{{'SURVEY_QUEUE.QUEUE' | translate}}</button>
    </mat-dialog-actions>
  `
})

export class SurveyQueueDialogComponent implements OnInit {

  // Component properties
  isProcessing: boolean = false;
  securityCode: string = null;
  securityCodeEmailed: boolean = false;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<SurveyQueueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService,
    private appNotificationService: AppNotificationService,
    private appDataService: AppDataService){
  }

  // Component init
  ngOnInit() {

  }

  // Email security code
  getCode(){
    this.isProcessing = true;
    this.appDataService.getSurveySecurityCode(this.dialogData.surveyId).subscribe(result=>{
      this.isProcessing = false;
      this.securityCodeEmailed = true;

    }, err=>{
      this.isProcessing = false;
      this.appNotificationService.showSnackBar("SURVEY_QUEUE.GET_CODE_ERROR",2000,"error");
    });
  }

  // Queue survey
  queueSurvey(){
    this.isProcessing = true;

    this.appDataService.queueSurvey({surveyId: this.dialogData.surveyId, surveyType: this.dialogData.surveyType, securityCode: this.securityCode, createPurl: this.dialogData.createPurl}).subscribe(result=>{

      this.appNotificationService.showSnackBar("SURVEY.QUEUE_SUCCESS",2000);

      if(this.dialogData.createPurl) {
        // Create and download the csv file
        result.forEach(element => {
          element.link = `https://www.clientculture.net/survey/survey.php?id=${element.surveyLogId}&type=PUL`;
        });

     
        APPSHARED.exportToCsv(result, 'purl-survey');
        this.dialogRef.close();

      } else {
        this.dialogRef.close();
      }
      

    },err=>{
      this.appNotificationService.showSnackBar("SURVEY.QUEUE_ERROR",2000,"error");
      this.dialogRef.close();
    });
  }

}
