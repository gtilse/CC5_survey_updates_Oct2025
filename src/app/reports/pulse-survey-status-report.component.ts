import { Component, OnInit, Input, OnChanges } from '@angular/core';
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
  selector: 'pulse-survey-status-report',
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
        <div class="mat-header-cell" mat-sort-header="clientName" flex="20">
          Client
        </div>
        <div class="mat-header-cell" mat-sort-header="clientEmail" flex="20">
          Email
        </div>
        <div class="mat-header-cell" flex="10">Email Status</div>
        <div class="mat-header-cell" flex="10">Opened</div>
        <div class="mat-header-cell" flex="10">Received On</div>
        <div class="mat-header-cell" flex="15">Reminder Date</div>
        <div class="mat-header-cell" flex="15">Reminder Status</div>
      </div>

      <div *ngFor="let survey of sortedData">
        <div class="group-header-1">{{ survey.description }}</div>
        <div *ngFor="let log of survey.log">
          <div class="group-header-2">{{ log.sendDate | utcToLocal }}</div>
          <div class="mat-row small" *ngFor="let item of log.data">
            <div class="mat-cell" flex="20">{{ item.clientName }}</div>
            <div class="mat-cell" flex="20">{{ item.clientEmail }}</div>
            <div class="mat-cell" flex="10">
              {{ emailStatus[item.emailStatus] }}
            </div>
            <div class="mat-cell" flex="10">
              {{ item.emailOpened == 0 ? '' : item.emailOpened }}
            </div>
            <div class="mat-cell" flex="10">
              {{ item.receivedOnDate | utcToLocal }}
            </div>
            <div class="mat-cell" flex="15">
              {{ item.reminderDate | utcToLocal }}
            </div>
            <div class="mat-cell" flex="15">
              {{
                item.reminderEmailStatus == 0
                  ? ''
                  : emailStatus[item.reminderEmailStatus]
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PulseSurveyStatusReportComponent implements OnInit, OnChanges {
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
