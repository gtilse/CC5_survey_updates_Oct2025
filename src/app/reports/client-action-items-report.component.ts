import * as _ from 'lodash';

import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'client-action-items-report',
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
        <div class="mat-header-cell" mat-sort-header="clientName" flex="20">
          Client
        </div>
        <div class="mat-header-cell" flex="10">Received On</div>
        <div class="mat-header-cell" mat-sort-header="comment" flex="30">
          Comment
        </div>
        <div class="mat-header-cell" flex="30">Resolved</div>
      </div>

      <div *ngFor="let status of dataKeys">
        <div class="group-header-1">{{ status }}</div>
        <div class="mat-row small" *ngFor="let item of data[status]">
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
          <div class="mat-cell" flex="20">
            <div>{{ item.clientName }}</div>
            <div class="text-secondary text-md">{{ item.clientEmail }}</div>
            <div class="text-secondary text-md" *ngIf="item.clientPhone">
              {{ item.clientPhone }}
            </div>
            <div>Contact: {{ item.clientDrlName }}</div>
          </div>
          <div class="mat-cell" flex="10">
            {{ item.receivedOnDate | utcToLocal }}
          </div>
          <div class="mat-cell" flex="30">{{ item.comments }}</div>
          <div class="mat-cell" flex="30">
            <div class="text-secondary">{{ item.followupByName }}</div>
            <div class="text-secondary text-md">
              {{ item.followupOnDate | utcToLocal: 'MMM DD' }}
            </div>
            <div>{{ item.followupComments }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientActionItemsReportComponent implements OnInit, OnChanges {
  // Component properties
  @Input() data: Array<any> = [];

  sortedData: Array<any> = [];

  dataKeys: Array<any> = [];

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
    this.sortedData = _.clone(this.data);
    this.dataKeys = Object.keys(this.sortedData);
  }

  // Sort data
  sortData(sort: Sort) {
    const data = _.clone(this.data);

    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.dataKeys.forEach((status) => {
      data[status] = data[status].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        return this.compare(a[sort.active], b[sort.active], isAsc);
      });
    });

    this.sortedData = data;
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
