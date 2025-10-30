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
import { APPSHARED } from '../app-setting';

@Component({
  selector: 'client-satisfaction-by-report',
  styles: [
    `
      .chart-container {
        height: 500px;
        margin-top: 18px;
      }
    `
  ],
  template: `
    <div [hidden]="data.length === 0">
      <mat-card class="push">
        <mat-tab-group [(selectedIndex)]="tabChartIndex">
          <!-- Responses -->
          <mat-tab label="Responses">
            <div class="chart-container">
              <ngx-charts-bar-vertical-stacked
                *ngIf="tabChartIndex == 0"
                [results]="responsesChart.data"
                [scheme]="chartOptions.RESPONSES_BREAKDOWN.colorScheme"
                [gradient]="chartOptions.RESPONSES_BREAKDOWN.gradient"
                [xAxis]="chartOptions.RESPONSES_BREAKDOWN.showXAxis"
                [yAxis]="chartOptions.RESPONSES_BREAKDOWN.showYAxis"
                [legend]="chartOptions.RESPONSES_BREAKDOWN.showLegend"
                [showXAxisLabel]="
                  chartOptions.RESPONSES_BREAKDOWN.showXAxisLabel
                "
                [showYAxisLabel]="
                  chartOptions.RESPONSES_BREAKDOWN.showYAxisLabel
                "
                [xAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.xAxisLabel"
                [yAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.yAxisLabel"
                [yAxisTickFormatting]="
                  chartOptions.RESPONSES_BREAKDOWN.axisDigits
                "
                [barPadding]="chartOptions.RESPONSES_BREAKDOWN.barPadding"
                [yScaleMax]="responsesChart.options.yScaleMax"
              >
              </ngx-charts-bar-vertical-stacked>
            </div>
          </mat-tab>
          <!-- NPS -->
          <mat-tab label="Net Promoter Score">
            <div class="chart-container">
              <ngx-charts-bar-vertical
                *ngIf="tabChartIndex == 1"
                [results]="npsChart.data"
                [scheme]="chartOptions.NPS_BREAKDOWN.colorScheme"
                [gradient]="chartOptions.NPS_BREAKDOWN.gradient"
                [xAxis]="chartOptions.NPS_BREAKDOWN.showXAxis"
                [yAxis]="chartOptions.NPS_BREAKDOWN.showYAxis"
                [legend]="chartOptions.NPS_BREAKDOWN.showLegend"
                [showXAxisLabel]="chartOptions.NPS_BREAKDOWN.showXAxisLabel"
                [showYAxisLabel]="chartOptions.NPS_BREAKDOWN.showYAxisLabel"
                [xAxisLabel]="chartOptions.NPS_BREAKDOWN.xAxisLabel"
                [yAxisLabel]="chartOptions.NPS_BREAKDOWN.yAxisLabel"
                [yAxisTickFormatting]="chartOptions.NPS_BREAKDOWN.axisDigits"
                [barPadding]="chartOptions.NPS_BREAKDOWN.barPadding"
                [yScaleMax]="chartOptions.NPS_BREAKDOWN.yScaleMax"
                [yScaleMin]="chartOptions.NPS_BREAKDOWN.yScaleMin"
              >
              </ngx-charts-bar-vertical>
            </div>
          </mat-tab>
          <!-- Response rate -->
          <mat-tab label="Response Rate">
            <div class="chart-container">
              <ngx-charts-bar-vertical
                *ngIf="tabChartIndex == 2"
                [results]="responseRateChart.data"
                [scheme]="chartOptions.RESPONSE_RATE.colorScheme"
                [gradient]="chartOptions.RESPONSE_RATE.gradient"
                [xAxis]="chartOptions.RESPONSE_RATE.showXAxis"
                [yAxis]="chartOptions.RESPONSE_RATE.showYAxis"
                [legend]="chartOptions.RESPONSE_RATE.showLegend"
                [showXAxisLabel]="chartOptions.RESPONSE_RATE.showXAxisLabel"
                [showYAxisLabel]="chartOptions.RESPONSE_RATE.showYAxisLabel"
                [xAxisLabel]="chartOptions.RESPONSE_RATE.xAxisLabel"
                [yAxisLabel]="chartOptions.RESPONSE_RATE.yAxisLabel"
                [yAxisTickFormatting]="chartOptions.RESPONSE_RATE.axisDigits"
                [barPadding]="chartOptions.RESPONSE_RATE.barPadding"
                [yScaleMax]="chartOptions.RESPONSE_RATE.yScaleMax"
                [yScaleMin]="chartOptions.RESPONSE_RATE.yScaleMin"
              >
              </ngx-charts-bar-vertical>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Data table displays grouped responses -->
      <div
        class="mat-table report"
        matSort
        (matSortChange)="sortData($event)"
        matSortActive="receivedOnDate"
        matSortDirection="desc"
        matSortDisableClear
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
          <div
            class="mat-header-cell"
            mat-sort-header="clientContact"
            flex="15"
          >
            Client Contact
          </div>
          <div
            class="mat-header-cell"
            mat-sort-header="receivedOnDate"
            flex="10"
          >
            Received On
          </div>
          <div class="mat-header-cell" flex="25">Comments</div>
        </div>

        <div *ngFor="let group of sortedData">
          <div class="group-header-1">{{ group.groupName }}</div>
          <div class="mat-row small" *ngFor="let item of group.data">
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
            <div class="mat-cell" flex="15">{{ item.clientContact }}</div>
            <div class="mat-cell" flex="10">
              {{ item.receivedOnDate | utcToLocal }}
            </div>
            <div class="mat-cell" flex="25">{{ item.comments }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientSatisfactionByReportComponent implements OnInit, OnChanges {
  // Component properties
  @Input() data: Array<any> = [];

  sortedData: Array<any> = [];

  public tabChartIndex = 0;

  public chartOptions = APPSHARED.CHART_OPTIONS;

  // Charts data
  public responsesChart: any = {
    data: [],
    options: {}
  };

  public npsChart: any = {
    data: [],
    options: {}
  };

  public responseRateChart: any = {
    data: [],
    options: {}
  };

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

    this.createResponsesChart();
    this.createNPSChart();
    this.createResponseRateChart();
  }

  // Responses chart
  createResponsesChart() {
    const chartData = [];
    const chartOptions = { yScaleMax: 0 };

    this.data.forEach((o, index) => {
      chartData.push({
        name: o.groupName,
        series: [
          { name: 'Promoters', value: o.promoterCount },
          { name: 'Neutrals', value: o.neutralCount },
          { name: 'Detractors', value: o.detractorCount }
        ]
      });
    });

    // Hack to control bar width
    if (chartData.length < 15) {
      const empty = '  ';

      for (let i = chartData.length; i <= 15; i++) {
        chartData.push({
          name: empty.repeat(i + 1),
          series: [
            {
              name: 'Promoters',
              value: 0
            },

            {
              name: 'Neturals',
              value: 0
            },

            {
              name: 'Detractors',
              value: 0
            }
          ]
        });
      }
    }

    // Max value for y axis
    let yScaleMax = 0;
    chartData.forEach(function (o, index) {
      const seriesMax =
        o.series[0].value + o.series[1].value + o.series[2].value;
      if (seriesMax > yScaleMax) {
        yScaleMax = seriesMax;
      }
    });

    chartOptions.yScaleMax = Math.ceil(yScaleMax * 1.5);

    // Set chart
    this.responsesChart.data = chartData;
    this.responsesChart.options = chartOptions;
  }

  // NPS chart
  createNPSChart() {
    const chartData = [];
    const chartOptions = { yScaleMax: 0 };

    this.data.forEach((o, index) => {
      chartData.push({
        name: o.groupName,
        value:
          Math.round(
            (o.promoterCount * 100) /
              (o.promoterCount + o.neutralCount + o.detractorCount)
          ) -
          Math.round(
            (o.detractorCount * 100) /
              (o.promoterCount + o.neutralCount + o.detractorCount)
          )
      });
    });

    // Hack to control bar width
    if (chartData.length < 15) {
      const empty = '  ';

      for (let i = chartData.length; i <= 15; i++) {
        chartData.push({
          name: empty.repeat(i + 1),
          value: 0
        });
      }
    }

    // Set chart
    this.npsChart.data = chartData;
    this.npsChart.options = chartOptions;
  }

  // Response rate chart
  createResponseRateChart() {
    const chartData = [];

    this.data.forEach((o, index) => {
      chartData.push({
        name: o.groupName,
        value: Math.round(
          ((o.promoterCount + o.neutralCount + o.detractorCount) /
            o.totalEmailsSent) *
            100
        )
      });
    });

    // Hack to control bar width
    if (chartData.length < 15) {
      const empty = '  ';

      for (let i = chartData.length; i <= 15; i++) {
        chartData.push({
          name: empty.repeat(i + 1),
          value: 0
        });
      }
    }

    // Set chart
    this.responseRateChart.data = chartData;
  }

  // Sort data
  sortData(sort: Sort) {
    const data = this.data.slice();

    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.data.forEach((group) => {
      group.data = group.data.sort((a, b) => {
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
