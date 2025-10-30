import * as _ from 'lodash';

import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';

@Component({
  selector: 'organisation-summary-report',
  styles: [
    `
      .summary-panel {
        height: 300px;
        overflow-y: hidden;
        margin-top: 24px;
      }

      :host ::ng-deep .advanced-pie-legend .total-value {
        line-height:1.2em!important;
      }

      :host ::ng-deep .advanced-pie-legend .legend-items-container .legend-items .legend-item {
        line-height: 1.5!important
      }

    `
  ],
  template: `
    <div [hidden]="data.length === 0" class="pad">
      <!-- summaries panels -->
      <div layout="row">
        <!-- NPS -->
        <mat-card flex="45">
          <mat-card-title>Net Promoter Score</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>
          <div class="summary-panel" layout="column">
            <div
              flex="none"
              *ngIf="npsSummaryChart.options.nps"
              class="text-xl push-top"
            >
              <span class="text-secondary">NPS </span
              >{{ npsSummaryChart.options.nps }}
            </div>
            <div flex *ngIf="npsSummaryChart.data.length">
              <ngx-charts-advanced-pie-chart
                [scheme]="chartOptions.SCORE_CATEGORY.colorScheme"
                [results]="npsSummaryChart.data"
                label="Total Responses"
              >
              </ngx-charts-advanced-pie-chart>
            </div>
          </div>
        </mat-card>

        <!-- Client Score -->
        <mat-card flex="25" class="push-left">
          <mat-card-title>Client Score</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>

          <div class="summary-panel" layout="column">
            <ngx-charts-gauge
              [scheme]="chartOptions.CLIENT_SCORE.colorScheme"
              [results]="clientScoreSummaryChart.data"
              [min]="chartOptions.CLIENT_SCORE.min"
              [max]="chartOptions.CLIENT_SCORE.max"
              [units]="'Client Score'"
              [bigSegments]="chartOptions.CLIENT_SCORE.bigSegments"
              [smallSegments]="chartOptions.CLIENT_SCORE.smallSegments"
            >
            </ngx-charts-gauge>
          </div>
        </mat-card>

        <!-- Last survey -->
        <mat-card flex="30" class="push-left">
          <mat-card-title>Last Survey</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>

          <div class="summary-panel">
            <div layout="row" class="push-top">
              <span class="text-secondary" flex="60">{{
                'Sent On:'
              }}</span>
              <span flex="40">{{
                surveySummary.maxDate | utcToLocal: 'MMM DD, YYYY'
              }}</span>
            </div>
            <div layout="row" class="push-top-xs push-bottom">
              <span class="text-secondary" flex="60">{{
                'Reminder On:'
              }}</span>
              <span flex="40">{{
                surveySummary.maxReminderDate | utcToLocal: 'MMM DD, YYYY'
              }}</span>
            </div>

            <mat-divider [inset]="true"></mat-divider>
            <div layout="row" class="push-top">
              <span class="text-secondary" flex="60">{{
                'Deliveries:'
              }}</span>
              <span flex="40">{{ surveySummary.deliveryCount }}</span>
            </div>

            <div layout="row" class="push-top-xs">
              <span class="text-secondary" flex="60">{{
                'Bounces:'
              }}</span>
              <span flex="40">{{ surveySummary.bounceCount }}</span>
            </div>

            <div layout="row" class="push-top push-bottom">
              <span class="text-secondary" flex="60">{{
                'Total Emails Sent:'
              }}</span>
              <span flex="40">{{ surveySummary.totalCount }}</span>
            </div>

            <mat-divider [inset]="true"></mat-divider>

            <div layout="row" class="push-top">
              <span class="text-secondary" flex="60">{{
                'Response Count:'
              }}</span>
              <span flex="40">{{ surveySummary.scoreCount }}</span>
            </div>

            <div layout="row" class="push-top-xs">
              <span class="text-secondary" flex="60">{{
                'Response Rate:'
              }}</span>
              <span flex="40">{{ surveySummary.responseRate }}%</span>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- NPS Chart by staff member -->
      <mat-card class="push-top">
        <mat-card-title>Net Promoter Score</mat-card-title>
        <mat-divider [inset]="true"></mat-divider>
        <div class="summary-panel">
          <ngx-charts-bar-vertical
            [results]="npsByStaffChart.data"
            [scheme]="chartOptions.NPS_BREAKDOWN.colorScheme"
            [gradient]="chartOptions.NPS_BREAKDOWN.gradient"
            [xAxis]="chartOptions.NPS_BREAKDOWN.showXAxis"
            [yAxis]="chartOptions.NPS_BREAKDOWN.showYAxis"
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
      </mat-card>

      <!-- Responses by staff -->
      <mat-card class="push-top">
        <mat-card-title>Responses by Staff</mat-card-title>
        <mat-divider [inset]="true"></mat-divider>
        <div class="summary-panel">
          <ngx-charts-bar-vertical-stacked
            [results]="responsesByClientContactChart.data"
            [scheme]="chartOptions.RESPONSES_BREAKDOWN.colorScheme"
            [gradient]="chartOptions.RESPONSES_BREAKDOWN.gradient"
            [xAxis]="chartOptions.RESPONSES_BREAKDOWN.showXAxis"
            [yAxis]="chartOptions.RESPONSES_BREAKDOWN.showYAxis"
            [showXAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.showXAxisLabel"
            [showYAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.showYAxisLabel"
            [xAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.xAxisLabel"
            [yAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.yAxisLabel"
            [yAxisTickFormatting]="chartOptions.RESPONSES_BREAKDOWN.axisDigits"
            [barPadding]="chartOptions.RESPONSES_BREAKDOWN.barPadding"
            [yScaleMax]="responsesByClientContactChart.options.yScaleMax"
          >
          </ngx-charts-bar-vertical-stacked>
        </div>
      </mat-card>

      <!-- Score breakdown -->
      <mat-card class="push-top">
        <mat-card-title>Score Breakdown</mat-card-title>
        <mat-divider [inset]="true"></mat-divider>
        <div class="summary-panel">
          <ngx-charts-bar-vertical
            [results]="scoreBreakdownChart.data"
            [scheme]="chartOptions.SCORE_BREAKDOWN.colorScheme"
            [gradient]="chartOptions.SCORE_BREAKDOWN.gradient"
            [xAxis]="chartOptions.SCORE_BREAKDOWN.showXAxis"
            [yAxis]="chartOptions.SCORE_BREAKDOWN.showYAxis"
            [showXAxisLabel]="chartOptions.SCORE_BREAKDOWN.showXAxisLabel"
            [showYAxisLabel]="chartOptions.SCORE_BREAKDOWN.showYAxisLabel"
            [xAxisLabel]="chartOptions.SCORE_BREAKDOWN.xAxisLabel"
            [yAxisLabel]="chartOptions.SCORE_BREAKDOWN.yAxisLabel"
            [yAxisTickFormatting]="chartOptions.SCORE_BREAKDOWN.axisDigits"
            [barPadding]="chartOptions.SCORE_BREAKDOWN.barPadding"
          >
          </ngx-charts-bar-vertical>
        </div>
      </mat-card>

      <h2 class="push-top push-bottom"></h2>
      <!-- Survey -->
      <div layout="row">
        <!-- NPS by survey -->
        <mat-card flex="33">
          <mat-card-title>Net Promoter Score</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>
          <div class="summary-panel" layout="column">
            <ngx-charts-bar-vertical
              [results]="npsBySurveyChart.data"
              [scheme]="chartOptions.NPS_BREAKDOWN.colorScheme"
              [gradient]="chartOptions.NPS_BREAKDOWN.gradient"
              [xAxis]="chartOptions.NPS_BREAKDOWN.showXAxis"
              [yAxis]="chartOptions.NPS_BREAKDOWN.showYAxis"
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
        </mat-card>

        <!-- Responses by survey -->
        <mat-card flex="33" class="push-left">
          <mat-card-title>Responses</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>
          <div class="summary-panel" layout="column">
            <ngx-charts-bar-vertical-stacked
              [results]="responsesBySurveyChart.data"
              [scheme]="chartOptions.RESPONSES_BREAKDOWN.colorScheme"
              [gradient]="chartOptions.RESPONSES_BREAKDOWN.gradient"
              [xAxis]="chartOptions.RESPONSES_BREAKDOWN.showXAxis"
              [yAxis]="chartOptions.RESPONSES_BREAKDOWN.showYAxis"
              [showXAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.showXAxisLabel"
              [showYAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.showYAxisLabel"
              [xAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.xAxisLabel"
              [yAxisLabel]="chartOptions.RESPONSES_BREAKDOWN.yAxisLabel"
              [yAxisTickFormatting]="
                chartOptions.RESPONSES_BREAKDOWN.axisDigits
              "
              [barPadding]="chartOptions.RESPONSES_BREAKDOWN.barPadding"
              [yScaleMax]="responsesBySurveyChart.options.yScaleMax"
            >
            </ngx-charts-bar-vertical-stacked>
          </div>
        </mat-card>

        <!-- Responses rate by survey -->
        <mat-card flex="33" class="push-left">
          <mat-card-title>Response Rate</mat-card-title>
          <mat-divider [inset]="true"></mat-divider>
          <div class="summary-panel" layout="column">
            <ngx-charts-bar-vertical
              [results]="responseRateBySurveyChart.data"
              [scheme]="chartOptions.RESPONSE_RATE.colorScheme"
              [gradient]="chartOptions.RESPONSE_RATE.gradient"
              [xAxis]="chartOptions.RESPONSE_RATE.showXAxis"
              [yAxis]="chartOptions.RESPONSE_RATE.showYAxis"
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
        </mat-card>
      </div>
    </div>
  `
})
export class OrganisationSummaryReportComponent implements OnInit, OnChanges {
  // Component properties
  @Input() data: any = {};

  public chartOptions = APPSHARED.CHART_OPTIONS;

  public surveySummary: any = {};

  public npsSummaryChart: any = {
    data: [],
    options: {}
  };

  public clientScoreSummaryChart: any = {
    data: [],
    options: {}
  };

  public npsByStaffChart: any = {
    data: [],
    options: {}
  };

  public responsesByClientContactChart: any = {
    data: [],
    options: {}
  };

  public scoreBreakdownChart: any = {
    data: [],
    options: {}
  };

  public npsBySurveyChart: any = {
    data: [],
    options: {}
  };

  public responsesBySurveyChart: any = {
    data: [],
    options: {}
  };

  public responseRateBySurveyChart: any = {
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
    if (this.data.surveySummary) {
      const surveySummaries = this.appDataService.dataFormat.formatSurveySummary(
        this.data.surveySummary
      );
      this.surveySummary = surveySummaries[0];
    }

    this.createNPSSummaryChart();
    this.createClientScoreSummaryChart();
    this.createNPSByStaffChart();
    this.createResponsesByClientContactChart();
    this.createScoreBreakdownChart();
    this.createNPSBySurveyChart();
    this.createResponsesBySurveyChart();
    this.createResponseRateBySurveyChart();
  }

  // NPS summary
  createNPSSummaryChart() {
    const data = _.extend([], this.data.staff);
    const chartOptions = { nps: null };

    const chartData = [
      { name: 'Promoters', value: 0 },
      { name: 'Neutrals', value: 0 },
      { name: 'Detractors', value: 0 }
    ];

    data.forEach((o, index) => {
      chartData[0].value += o.promoterCount;
      chartData[1].value += o.neutralCount;
      chartData[2].value += o.detractorCount;
    });

    const npsVal = 0;
    const totalCount =
      chartData[0].value + chartData[1].value + chartData[2].value;
    if (totalCount > 0) {
      chartOptions.nps =
        Math.round((chartData[0].value / totalCount) * 100) -
        Math.round((chartData[2].value / totalCount) * 100);
    }

    this.npsSummaryChart.data = chartData;
    this.npsSummaryChart.options = chartOptions;
  }

  // Client score summary
  createClientScoreSummaryChart() {
    const data = _.extend([], this.data.staff);
    const chartOptions = { clientScore: null };
    let totalCount: number = 0;
    let totalScore: number = 0;

    const chartData = [{ name: 'Client Score', value: 0 }];

    data.forEach((o, index) => {
      totalScore += parseInt(o.scoreTotal);
      totalCount += o.promoterCount + o.neutralCount + o.detractorCount;
    });

    if (totalCount > 0) {
      chartOptions.clientScore = chartData[0].value =
        Math.round((totalScore / totalCount) * 2) / 2;
    }

    this.clientScoreSummaryChart.data = chartData;
    this.clientScoreSummaryChart.options = chartOptions;
  }

  // NPS by staff member
  createNPSByStaffChart() {
    const data = _.extend([], this.data.staff);
    const chartData = [];

    data.forEach((o, index) => {
      const nps = (o.value =
        Math.round(
          (o.promoterCount * 100) /
            (o.promoterCount + o.neutralCount + o.detractorCount)
        ) -
        Math.round(
          (o.detractorCount * 100) /
            (o.promoterCount + o.neutralCount + o.detractorCount)
        ));
      chartData.push({ name: o.name, value: nps });
    });

    chartData.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
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

    // Set chart data
    this.npsByStaffChart.data = chartData;
  }

  // Responses by client contact
  createResponsesByClientContactChart() {
    const data = _.extend([], this.data.staff);
    const chartData = [];
    const chartOptions: any = {};

    data.forEach((o, index) => {
      chartData.push({
        name: o.name,
        series: [
          { name: 'Promoters', value: o.promoterCount },
          { name: 'Neutrals', value: o.neutralCount },
          { name: 'Detractors', value: o.detractorCount }
        ]
      });
    });

    chartData.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
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
      if (seriesMax > yScaleMax) yScaleMax = seriesMax;
    });

    chartOptions.yScaleMax = Math.ceil(yScaleMax * 1.5);

    // Set chart data
    this.responsesByClientContactChart.data = chartData;
    this.responsesByClientContactChart.options = chartOptions;
  }

  // Score breakdown chart
  createScoreBreakdownChart() {
    const data = _.extend([], this.data.scoreBreakdown);
    const chartOptions = {};

    const chartData = [];

    data.forEach((o, index) => {
      chartData.push({ name: index.toString(), value: o });
    });

    this.scoreBreakdownChart.data = chartData;
  }

  // NPS by survey
  createNPSBySurveyChart() {
    const data = _.extend([], this.data.survey);
    const chartData = [];

    data.forEach((o, index) => {
      const nps = (o.value =
        Math.round(
          (o.promoterCount * 100) /
            (o.promoterCount + o.neutralCount + o.detractorCount)
        ) -
        Math.round(
          (o.detractorCount * 100) /
            (o.promoterCount + o.neutralCount + o.detractorCount)
        ));
      chartData.push({ name: o.description, value: nps });
    });

    chartData.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
    });

    // Hack to control bar width
    if (chartData.length < 5) {
      const empty = '  ';

      for (let i = chartData.length; i <= 5; i++) {
        chartData.push({
          name: empty.repeat(i + 1),
          value: 0
        });
      }
    }

    // Set chart data
    this.npsBySurveyChart.data = chartData;
  }

  // Responses by survey
  createResponsesBySurveyChart() {
    const data = _.extend([], this.data.survey);
    const chartData = [];
    const chartOptions: any = {};

    data.forEach((o, index) => {
      chartData.push({
        name: o.description,
        series: [
          { name: 'Promoters', value: o.promoterCount },
          { name: 'Neutrals', value: o.neutralCount },
          { name: 'Detractors', value: o.detractorCount }
        ]
      });
    });

    chartData.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
    });

    // Hack to control bar width
    if (chartData.length < 5) {
      const empty = '  ';

      for (let i = chartData.length; i <= 5; i++) {
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
      if (seriesMax > yScaleMax) yScaleMax = seriesMax;
    });

    chartOptions.yScaleMax = Math.ceil(yScaleMax * 1.5);

    // Set chart data
    this.responsesBySurveyChart.data = chartData;
    this.responsesBySurveyChart.options = chartOptions;
  }

  // Response rate by survey
  createResponseRateBySurveyChart() {
    const data = _.extend([], this.data.survey);
    const chartData = [];

    data.forEach((o, index) => {
      const responseRate = Math.round(
        ((o.promoterCount + o.neutralCount + o.detractorCount) /
          o.totalEmailsSent) *
          100
      );
      chartData.push({ name: o.description, value: responseRate });
    });

    chartData.sort(function (a, b) {
      return a.name > b.name ? 1 : -1;
    });

    // Hack to control bar width
    if (chartData.length < 5) {
      const empty = '  ';

      for (let i = chartData.length; i <= 5; i++) {
        chartData.push({
          name: empty.repeat(i + 1),
          value: 0
        });
      }
    }

    // Set chart data
    this.responseRateBySurveyChart.data = chartData;
  }
}
