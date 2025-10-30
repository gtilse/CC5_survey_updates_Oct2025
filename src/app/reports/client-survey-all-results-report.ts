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

@Component({
  selector: 'client-survey-all-results-report',
  template: `
    <div
      class="mat-table report"
      style="width:4000px"
      [hidden]="data.length === 0"
    >
      <div class="mat-header-row">
        <div class="mat-header-cell" flex="5">Client Name</div>
        <div class="mat-header-cell" flex="5">Client Contact (DRL)</div>
        <div class="mat-header-cell" flex="5">Score</div>
        <div class="mat-header-cell" flex="5">Comments</div>
        <div class="mat-header-cell" flex="5">Improvements</div>
        <div class="mat-header-cell" flex="5">Add Improvements</div>
        <div class="mat-header-cell" flex="5">Survey</div>
        <div class="mat-header-cell" flex="5">Sent Date</div>
        <div class="mat-header-cell" flex="5">Received on Date</div>
        <div class="mat-header-cell" flex="5">Client Organization</div>
        <div class="mat-header-cell" flex="5">Client Email</div>
        <div class="mat-header-cell" flex="5">Industry</div>
        <div class="mat-header-cell" flex="5">Custom Category 1</div>
        <div class="mat-header-cell" flex="5">Custom Category 1 Value</div>
        <div class="mat-header-cell" flex="5">Custom Category 2</div>
        <div class="mat-header-cell" flex="5">Custom Category 2 Value</div>
        <div class="mat-header-cell" flex="5">Custom Category 3</div>
        <div class="mat-header-cell" flex="5">Custom Category 3 Value</div>
        <div class="mat-header-cell" flex="5">Client Group</div>
        <div class="mat-header-cell" flex="5">Department</div>
        <div class="mat-header-cell" flex="5">Loyalty Driver 1</div>
        <div class="mat-header-cell" flex="5">Loyalty Driver 2</div>
        <div class="mat-header-cell" flex="5">Loyalty Driver 3</div>
        <div class="mat-header-cell" flex="5">Value</div>
        <div class="mat-header-cell" flex="5">Code</div>
        <div class="mat-header-cell" flex="5">Prev Score</div>
        <div class="mat-header-cell" flex="5">Prev Comment</div>
        <div class="mat-header-cell" flex="5">Additional Questions</div>
      </div>

      <div class="mat-row" *ngFor="let item of sortedData">
        <div class="mat-cell" flex="5">{{ item.name }}</div>
        <div class="mat-cell" flex="5">{{ item.clientContact }}</div>
        <div class="mat-cell" flex="5">{{ item.score }}</div>
        <div class="mat-cell" flex="5">{{ item.comments }}</div>
        <div class="mat-cell" flex="5">{{ item.howToImproveComments }}</div>
        <div class="mat-cell" flex="5">{{ item.howToImproveComments2 }}</div>
        <div class="mat-cell" flex="5">{{ item.surveyDescription }}</div>
        <div class="mat-cell" flex="5">{{ item.sendDate | utcToLocal }}</div>
        <div class="mat-cell" flex="5">{{ item.receivedOnDate | utcToLocal }}</div>
        <div class="mat-cell" flex="5">{{ item.organisation }}</div>
        <div class="mat-cell" flex="5">{{ item.email }}</div>
        <div class="mat-cell" flex="5">{{ item.industry }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory1 }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory1Desc }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory2 }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory2Desc }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory3 }}</div>
        <div class="mat-cell" flex="5">{{ item.customCategory3Desc }}</div>
        <div class="mat-cell" flex="5">{{ item.clientGroup }}</div>
        <div class="mat-cell" flex="5">{{ item.department }}</div>
        <div class="mat-cell" flex="5">{{ item.loyaltyDriver1 }}</div>
        <div class="mat-cell" flex="5">{{ item.loyaltyDriver2 }}</div>
        <div class="mat-cell" flex="5">{{ item.loyaltyDriver3 }}</div>
        <div class="mat-cell" flex="5">{{ item.category }}</div>
        <div class="mat-cell" flex="5">{{ item.code }}</div>
        <div class="mat-cell" flex="5">{{ item.prevScore }}</div>
        <div class="mat-cell" flex="5">{{ item.prevComment }}</div>
        <div class="mat-cell" flex="5">{{ item.additionalQuestions }}</div>
      </div>
       
    </div>
  `
})
export class ClientSurveyAllResultsReportComponent implements OnInit, OnChanges {
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

}
