import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AdditionalQuestionsDialogComponent } from '../helper-components/additional-questions-dialog.component';

@Component({
  selector: 'client-survey-responders-report',
  template: `
    <div
      class="mat-table report"
      matSort
      (matSortChange)="sortData($event)"
      matSortActive="clientName"
      matSortDirection="asc"
      matSortDisableClear
      [hidden]="data.length === 0"
    >
      <div class="mat-header-row">
        <div
          class="mat-header-cell text-center"
          mat-sort-header="score"
          flex="10"
        >
          Score
        </div>
        <div class="mat-header-cell" mat-sort-header="clientName" flex="15">
          Client
        </div>
        <div class="mat-header-cell" mat-sort-header="clientEmail" flex="15">
          Email
        </div>
        <div class="mat-header-cell" mat-sort-header="clientPhone" flex="10">
          Phone
        </div>
        <div class="mat-header-cell" mat-sort-header="clientOrganisation" flex="10">
          Organisation
        </div>
        <div class="mat-header-cell" mat-sort-header="clientContact" flex="15">
          Client Contact
        </div>
        <div class="mat-header-cell" flex="10">Received On</div>
        <div class="mat-header-cell" flex="15">Comments</div>
      </div>

      <div *ngFor="let survey of sortedData">
        <div class="group-header-1">{{ survey.description }}</div>
        <div *ngFor="let log of survey.log">
          <div class="group-header-2">{{ log.sendDate | utcToLocal }}</div>
          <div class="mat-row small" *ngFor="let item of log.data">
            <div class="mat-cell text-center" flex="10">
              <span
                class="score"
                [ngClass]="{
                  promoters: item.score > 8,
                  neutrals: item.score > 6 && item.score <= 8,
                  detractors: item.score < 7
                }"
                >{{ item.score }}</span
              >
            </div>
            <div class="mat-cell" flex="15">{{ item.clientName }}</div>
            <div class="mat-cell" flex="15">{{ item.clientEmail }}</div>
            <div class="mat-cell" flex="10">{{ item.clientPhone }}</div>
            <div class="mat-cell" flex="10">{{ item.clientOrganisation }}</div>
            <div class="mat-cell" flex="15">{{ item.clientContact }}</div>
            <div class="mat-cell" flex="10">
              {{ item.receivedOnDate | utcToLocal }}
            </div>
            <div class="mat-cell" flex="15">
              {{ item.comments }}
              <span
                *ngIf="
                  item.additionalQuestions && item.additionalQuestions.length
                "
              >
                &nbsp;<i
                  class="fa fa-file-text-o app-primary-fg"
                  matTooltip="{{ 'GENERAL.MORE_DETAILS' | translate }}"
                  (click)="showAdditionalQuestions(item)"
                  style="cursor:pointer;"
                ></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientSurveyRespondersReportComponent
  implements OnInit, OnChanges {
  // Component properties
  @Input() data: Array<any> = [];

  sortedData: Array<any> = [];

  emailStatus: Array<any> = APPSHARED.EMAIL_STATUS;

  // Constructor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {}

  // ngChanges
  ngOnChanges() {
    console.log("changed...")
    this.sortedData = this.data.slice();

  }

  // Sort data
  sortData(sort: Sort) {
    const data = this.data.slice();

    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.data.forEach((survey) => {
      survey.log.forEach((sendDate) => {
        sendDate.data = sendDate.data.sort((a, b) => {
          const isAsc = sort.direction === 'asc';
          return this.compare(a[sort.active], b[sort.active], isAsc);
        });
      });
    });

    this.sortedData = data;
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Additional questions
  showAdditionalQuestions(obj) {
    const dialogRef = this.dialog.open(AdditionalQuestionsDialogComponent, {
      disableClose: true,
      width: '800px',
      maxHeight: '800px',
      data: {
        heading: obj.clientName,
        subHeading: obj.receivedOnDate,
        additionalQuestions: this.appDataService.dataFormat.formatAdditionalQuestions(
          obj.additionalQuestions
        )
      }
    });
  }
}
