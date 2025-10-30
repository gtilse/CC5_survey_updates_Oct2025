// Imports
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import {MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import * as moment from 'moment';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';

import { dashboardData, consolidatedThreshold } from './dashboard-data';

export const MY_FORMATS = {
  parse: {
    dateInput: 'll',
  },
  display: {
    dateInput: 'll',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'll',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// Dashboard component
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [
    AppComponentStateService,
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class DashboardComponent implements OnInit {
  // #region Component properties

  @ViewChild(MatSort) matSortTeam: MatSort;

  public clientGroups: Array<any> = [];

  public clientGroupKeys: Array<string> = [];

  public staffList: Array<any> = [];

  public clientFilterParam = '';

  public staffFilterParam = '';

  public dateRangeFilterParam = {
    start: null,
    end: null
  };

  public dateRangeEnabled: boolean = false;

  public isFetchingData = false;

  public allScores: Array<any> = [];

  public filterText = '';

  private _staffResponses: Array<any> = [];

  private _orgResponses: Array<any> = [];

  private _allScores: Array<any> = [];

  public loyaltyDrivers: Array<object> = [];

  public insightsSelectedGroup = '';

  public insightsLoading = false;

  public dashboardData = dashboardData.apply(this);
  // #endregion

  // #region Databoard data manipulation

  // #endregion

  latestSurvey: any = this.dashboardData.mainChart.npsChart;

  consolidatedResult: any = {};

  // #region Component

  // Constructor
  constructor(
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private router: Router
  ) {}

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;
    this.dateRangeFilterParam.end = moment().add(2, 'd');
    this.dateRangeFilterParam.start = moment().subtract(11, 'months');
    this.loadData();
  }

  // Window resize listener
  @HostListener('window: resize', ['$event'])
  onWindowResize(event) {}

  // Router navigate
  routeTo(route: string, params?: string) {
    this.router.navigate([`/app/${route}`]);
  }

  // #endregion

  // #region Data

  // Load data
  // Called everytime dashboard params changed
  loadData() {
    this.dashboardData.resetState();
    this.isFetchingData = true;

    this.appDataService
      .getDashboardForLoggedUser({
        clientFilterParam: this.clientFilterParam,
        staffFilterParam: this.staffFilterParam,
        startDate: this.dateRangeFilterParam.start && moment(this.dateRangeFilterParam.start).format('YYYY-MM-DD'),
        endDate: this.dateRangeFilterParam.end && moment(this.dateRangeFilterParam.end).format('YYYY-MM-DD'),
      })
      .subscribe((res) => {
        this.appComponentStateService.isLoading = false;
        this.isFetchingData = false;

        // Set the various props
        this.clientGroupKeys = res.clientGroups.key;
        this.clientGroups = res.clientGroups.value;
        this.appStateService.clientList = res.clientGroups;
        this.appStateService.staffList = res.staff;

        // Set text of filters if any
        this.filterText = '';
        if (this.clientFilterParam) {
          const clientFilterText = this.clientFilterParam.split('_');
          this.filterText += clientFilterText[1];
        }

        if (this.staffFilterParam) {
          const result: any = this.staffList.filter((o) => {
            return o.objectId === this.staffFilterParam;
          });

          if (result.length) {
            this.filterText += this.filterText.length ? ' - ' : '';
            this.filterText += result[0].fullName;
          }
        }

        // All scores, staff and org responses
        this._allScores = this.dashboardData.clientResponses.allScores = this.appDataService.dataFormat.formatResponses(
          res.allScores
        );

        // Staff
        // if(res.staff && this._allScores) {
        //   res.staff = res.staff.filter(elem => {

        //     let found = false;
        //     this._allScores.forEach(score => {
        //       if(score.drl === elem.objectId || score.drlInclude.indexOf(elem.objectId) >=0) {
        //         found = true;
        //       }
        //     });

        //     return found;
        //   });
        // }

        this.staffList = res.staff.filter((e) => e.staffSurveyOnly == '0');

        // Responses
        this._staffResponses = res.staffResponses;
        this._orgResponses = res.orgResponses;

        this.dashboardData.clientResponses.hasData = !!res.allScores.length;

        // Display dashboard charts and data
        this.dashboardData.prepareSummaryCard(
          res.setting,
          res.clientSummary,
          res.orgResponses.length ? res.orgResponses[0] : null
        );
        this.dashboardData.prepareDateGroupedChartData(
          this._staffResponses,
          this._orgResponses
        );
        this.dashboardData.prepareConsolidatedResult(
          this._staffResponses,
          this._orgResponses
        );
        this.dashboardData.prepareConsolidatedNPSData(this._staffResponses);
        this.dashboardData.prepareClientScoreData(
          this._staffResponses,
          this._orgResponses
        );
        this.dashboardData.prepareTeamResults(this._staffResponses);

        // Loyalty drivers
        // Score changes

        const clientScoreChanges = {
          improving: 0,
          atRisk: 0,
          noChange: 0
        };

        // Loyalty drivers
        this.loyaltyDrivers = [];
        let positiveLoyaltyDriversCount = 0;
        let negativeLoyaltyDriversCount = 0;
        
        this._allScores.filter(element => {
          return true;
          //return moment(element.receivedOnDate).add(consolidatedThreshold,'M') >= moment();
        }).forEach((o) => {
          

          if (o.loyaltyDrivers.length) {

            // Loyalty Drivers
            if(o.score>=9) {
              positiveLoyaltyDriversCount ++;
            } else {
              negativeLoyaltyDriversCount++;
            }

            o.loyaltyDrivers.forEach((ld: any) => {
              const result: any = this.loyaltyDrivers.find(
                (elem: any) => elem.desc === ld
              );
              if (result) {
                if (o.score >= 9) {
                  result.positiveCount++;
                } else {
                  result.negativeCount++;
                }
              } else {
                this.loyaltyDrivers.push({
                  desc: ld,
                  positiveCount: o.score >= 9 ? 1 : 0,
                  negativeCount: o.score < 9 ? 1 : 0
                });
              }
            });
          }

          // Score changes
          if (
            o.previousScore >= 0 &&
            `${res.orgResponses[0].year}${res.orgResponses[0].month}` ===
              moment(o.allReceivedOnDates.split(',').slice(-1)[0]).format(
                'YYYYM'
              )
          ) {
            clientScoreChanges.improving =
              o.score > o.previousScore
                ? ++clientScoreChanges.improving
                : clientScoreChanges.improving;
            clientScoreChanges.atRisk =
              o.score < o.previousScore
                ? ++clientScoreChanges.atRisk
                : clientScoreChanges.atRisk;
            clientScoreChanges.noChange =
              o.score === o.previousScore
                ? ++clientScoreChanges.noChange
                : clientScoreChanges.noChange;
          }
        });

        
        // Loyalty driver percentages
        let positiveCountTotal: number = 0;
        let negativeCountTotal: number = 0;

        this.loyaltyDrivers.forEach((o: any) => {
          positiveCountTotal += o.positiveCount;
          negativeCountTotal += o.negativeCount;
        });

        this.loyaltyDrivers.forEach((o: any) => {
          if(positiveCountTotal) {
            o.positiveCountPercent = Math.min(Math.ceil((o.positiveCount*100)/(positiveLoyaltyDriversCount)), 100);
            // o.positiveCountPercent = Math.min(Math.ceil((o.positiveCount*100*3)/(positiveCountTotal)), 100);
          } else {
            o.positiveCountPercent = 0;
          }

          if(negativeCountTotal) {
            o.negativeCountPercent = Math.min(Math.ceil((o.negativeCount*100)/(negativeLoyaltyDriversCount)),100);
            // o.negativeCountPercent = Math.min(Math.ceil((o.negativeCount*100*3)/(negativeCountTotal)),100);
          } else {
            o.negativeCountPercent = 0;
          }
        });

        // Client score changes
        this.dashboardData.clientScoreChanges = clientScoreChanges;
      });
  }

  // Get inisghts panel data
  getInsightsData(event: any) {

    const startDate = this.dateRangeFilterParam.start && moment(this.dateRangeFilterParam.start).format('YYYY-MM-DD');
    const endDate = this.dateRangeFilterParam.end && moment(this.dateRangeFilterParam.end).format('YYYY-MM-DD');

    this.insightsLoading = true;
    this.insightsSelectedGroup = event;
    this.appDataService.getInsights(event, startDate, endDate).subscribe((res) => {
      this.dashboardData.prepareInsightsPanel(res || []);
      this.insightsLoading = false;
    })
  }

  // Apply dashboard filters
  applyFilters() {

    // if(this.dateRangeFilterParam.start && this.dateRangeFilterParam.end) {
    //   this.dateRangeEnabled = true;
    //   this.dashboardData.setConsolidatedThreshold(2000);
    // } else {
    //    this.dateRangeEnabled = false;
    //    this.dashboardData.setConsolidatedThreshold(11);
    // }

    this.loadData();
    this.getInsightsData(this.insightsSelectedGroup);
  }

  // Clear dashboard filters
  clearFilters() {
    this.staffFilterParam = '';
    this.clientFilterParam = '';
    this.dateRangeFilterParam.end = moment().add(2, 'd');
    this.dateRangeFilterParam.start = moment().subtract(11, 'months');
    this.loadData();
    this.getInsightsData(this.insightsSelectedGroup);
    this.dateRangeEnabled = false;
  }

  // #endregion
}
