/**
 * Component Imports
 */

// Angular
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import {SelectionModel} from '@angular/cdk/collections';
import { ngForTransition } from '../animations/ng-for.animation';

// Lodash
import * as _ from 'lodash';

// RxJS
import {forkJoin} from 'rxjs';

// Application
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppNotificationService } from '../services/app-notification.service';
import { APPSHARED } from '../app-setting';
import { SurveyEditComponent } from './survey-edit.component';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import { SurveyListDialogComponent } from '../helper-components/survey-list-dialog.component';
import { SurveyStatusDialogComponent } from '../helper-components/survey-status-dialog.component';
import { SurveyViewQueueDialogComponent } from '../helper-components/survey-view-queue-dialog.component';

import { SurveyQueueDialogComponent } from './survey-queue-dialog.component';
import { IDropList, IStaffSelectList, ISurvey, ISurveyStatus, ILoyaltyDriver, ICustomQuestion } from '../models/data-model';


// Filter interface
interface IFilter {
    filterString: string
}

// Comparator
function compare(a: number | string, b: number | string, isAsc: boolean) {

    if(!(a || b)) {
        return 1;
    }

    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

/**
 * Survey component
 */
@Component({
    selector: 'app-survey',
    templateUrl: './survey.component.html',
    animations: [ngForTransition],
    styleUrls: ['./survey.component.scss'],
    providers: [AppComponentStateService]
})
export class SurveyComponent implements OnInit {

    // Component properties
    private _extWindow: any = null;

    @ViewChild(MatSort) sort: MatSort;

    // Data
    public _surveys: Array<ISurvey> = [];
    public surveys: Array<ISurvey> = [];
    public surveysStatus: Array<ISurveyStatus> = [];
    public dropLists: Array<IDropList> = [];
    public staffSelectList: Array<IStaffSelectList> = [];

    // Constants
    public customQuestions: Array<ICustomQuestion> = [];
    public surveyTypeList: any = APPSHARED.SURVEY_TYPE;
    public surveyValueList: any = APPSHARED.switchTypeKeyToValue(APPSHARED.SURVEY_TYPE);
    public surveyFrequency = APPSHARED.SURVEY_FREQUENCY;

    public editorOpened = false;

    // Table
    displayedColumns: String[] = ['information', 'description','options', 'status', 'action']
    selection = new SelectionModel<ISurvey>(false, []);
    filterCriteria: IFilter = {
        filterString: ''
    }
    // --
    @ViewChild(SurveyEditComponent) surveyEditComponent: SurveyEditComponent;

    // Constructor
    constructor(
        private router: Router,
        public appStateService: AppStateService,
        private appDataService: AppDataService,
        public appComponentStateService: AppComponentStateService,
        private dialog: MatDialog,
        private appNotificationService: AppNotificationService
    ) {

    }

    // Component init
    ngOnInit() {
        this.appComponentStateService.isLoading = true;
        this.loadData();
    }

    // Load data
    loadData() {
        this.surveysStatus = [];
        this.filterCriteria.filterString = '';

        forkJoin([this.appDataService.getSurveys(),this.appDataService.getSurveysStatus(),this.appDataService.getDropLists(),this.appDataService.getStaffSelectList()]).subscribe(results=>{
            this.appComponentStateService.isLoading = false;
            this.surveys = [...this._surveys] =  results[0];
            this.surveysStatus = results[1];
            this.dropLists = results[2];
            this.staffSelectList = results[3];
            this.setSurveyStatus(this.surveys);
      
          }, err=> {
            this.appComponentStateService.hasError = true;
        });
    }

    //#region Table

    // Get Client Contacts list
    getClientContactsListForSurvey(survey: ISurvey): string {
        let clientList: Array<string> = [];
        survey.includeDRLS.forEach(objectId => {
            const found = this.staffSelectList.find(elem => {
                return elem.objectId === objectId;
            })

            if(found) {
                clientList.push(found.name);
            }
        });
        
        return clientList.join(', ');
    }

    // Staff exclusion list
    getStaffExclusionListForSurvey(survey: ISurvey): string {

        const staffList: Array<string> = [];
        if(!survey.excludeEmployees.length) {
            return '';
        }

        survey.excludeEmployees.forEach(excludeEmployee => {
            const found = this.staffSelectList.find((staff) => staff.objectId === excludeEmployee);
            if (found) {
                staffList.push(found.name);
            }
        })

        return staffList.join(', ');

    }

    // Get Detail for Survey
    setSurveyStatus(surveys: ISurvey[]): void {
        surveys.forEach(survey => {
            
            const found = this.surveysStatus.find(surveyStatus => survey.objectId === surveyStatus.surveyId)
            survey.status = found;
            
        });
    }

    // Filter
    filter() {
        this.surveys = this._surveys.filter(survey => {
            return survey.description.toLowerCase().indexOf(this.filterCriteria.filterString.toLowerCase()) >= 0
        });

        this.sort.sort({
            id: 'information',
            start: 'desc',
            disableClear: true
        });
    }

    // Sort data
    sortData(sort: Sort) {
        
        if (!sort.active || sort.direction === '') {
            return;
        }

        const isAsc = sort.direction === 'asc';

        this.surveys = [...this.surveys];

        this.surveys.sort((a,b) => {
            
            switch (sort.active) {
                case 'information':
                    return compare(a.updatedAt, b.updatedAt, isAsc);
                   
                case 'description':
                    return compare(a.description.toLowerCase(), b.description.toLowerCase(), isAsc);

                case 'status':
                    return compare(a.status?.lastSentOn, b.status?.lastSentOn, isAsc);

                default:
                    return 0;
            }

        });
    }

    //#endregion

    //#region Survey actions
    previewSurvey(row: ISurvey) {
        
        if(this._extWindow) this._extWindow.close();
        
        let surveyType = '';
        switch(row.type){
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
        this._extWindow = window.open(APPSHARED.SURVEY_PREVIEW_URL + '?id=PREVIEW-' + row.objectId + '&type=' + surveyType, 'SurveyPreview', 'location=0,height=800,width=950,scrollbars=1,resizable=0,left=100,top=200');
    }

    // Queue survey for sending
    queueSurvey(row: ISurvey, createPurl=false){

        let dialogAction = 0;
        let surveyType = '';

        if(this.appStateService.trialMode){
            alert('Sorry, sending surveys are not permitted in trial mode');
            return;
        }

        switch(row.type){
            case APPSHARED.SURVEY_TYPE.CLIENT.VALUE:
                surveyType = 'CLIENT';
                break;
            case APPSHARED.SURVEY_TYPE.STAFF.VALUE:
                surveyType = 'EMPLOYEE';
                break;
            case APPSHARED.SURVEY_TYPE.PULSE.VALUE:
                surveyType = 'PULSE';
                break;
            case APPSHARED.SURVEY_TYPE.MANAGER.VALUE:
                surveyType = 'MANAGER';
                break;
            case APPSHARED.SURVEY_TYPE.TRIAGE.VALUE:
                surveyType = 'TRIAGE';
                break;

        }

        let dialogRef = this.dialog.open(SurveyQueueDialogComponent, {
        disableClose: true,
        data: { surveyId: row.objectId, surveyType: surveyType, description: row.description, createPurl: createPurl }
        });

        // dialogRef.componentInstance.onYes.subscribe(()=>{
        //   dialogRef.componentInstance.isProcessing = true;
        //
        //   this.appDataService.queueSurvey({surveyId: row.objectId, surveyType: surveyType}).subscribe(result=>{
        //
        //     this.appNotificationService.showSnackBar("SURVEY.QUEUE_SUCCESS",2000);
        //     dialogRef.componentInstance.close();
        //
        //   },err=>{
        //     this.appNotificationService.showSnackBar("SURVEY.QUEUE_ERROR",2000,"error");
        //     dialogRef.componentInstance.close();
        //   });
        //
        // });
    }

    viewSurveyStatus(survey: ISurvey) {
        const dialogRef = this.dialog.open(SurveyStatusDialogComponent, {
            disableClose: true,
            width: '75vw',
            data: { surveyId: survey.objectId, surveyType: survey.type, description: survey.description }
        });
    }

    viewList(survey: ISurvey) {
        let dialogRef = this.dialog.open(SurveyListDialogComponent, {
            disableClose: true,
            width: '950px',
            data: { surveyId: survey.objectId, surveyType: survey.type, description: survey.description }
        });
    }

    viewQueue(survey: ISurvey) {
        
        let dialogRef = this.dialog.open(SurveyViewQueueDialogComponent, {
        width: '950px',
        disableClose: true,
        data: { surveyId: survey.objectId, surveyType: survey.type, description: survey.description }
        });
    }

    deleteRecord(survey: ISurvey) {
        const dialogRef = this.dialog.open(AsyncDialogComponent, {
            disableClose: true,
            data: {
              action: APPSHARED.ASYNC_DIALOG_ACTIONS.DELETE_SINGLE_RECORD,
            }
        });

        dialogRef.componentInstance.onYes.subscribe(() => {
            dialogRef.componentInstance.isProcessing = true;
      
            const objectIds = [survey.objectId];
      
            this.appDataService.deleteRecords('Survey', objectIds).subscribe(
              (result) => {
                this.appNotificationService.showSnackBar(
                  'GENERAL.DELETE_SUCCESS',
                  2000
                );
      
                dialogRef.componentInstance.close();
                this.loadData();

              },
              (err) => {
                this.appNotificationService.showSnackBar(
                  'GENERAL.DELETE_ERROR',
                  2000,
                  'error'
                );
                dialogRef.componentInstance.close();
              }
            );
          });


    }
    //#endregion Survey actions

    //#region Record add/edit
    
    // Edit record
    editRecord(row: any): void {
        this.editorOpened = true;
        this.surveyEditComponent.editRecord(row);
        
    }

    // Add new record
    addRecord(): void {
        this.editorOpened = true;
        this.surveyEditComponent.addRecord(
        this.appStateService.loggedUser.vendorId
        );
    }

    // Editor events
    recordSaved(eventData) {
        // Reload the table
        this.loadData();
        this.editorOpened = false;
    }
    
    // Cancel save record
    recordSaveCancelled(event) {
        this.editorOpened = false;
    }
    

    //#endregion
}
