// Imports
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { APPSHARED } from '../app-setting';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  providers: [AppComponentStateService]
})
export class FeedbackComponent implements OnInit {
  // Component properties
  isFetching: boolean = false;

  dataOffset = 0;

  dataLimit = 250;

  hasMoreRecords = true;

  count = 0;

  allScores: Array<any> = [];

  clientListKey: Array<string> = [];

  clientListValue: Array<any> = [];

  staffList: Array<any> = [];

  dateRanges: Array<any> = APPSHARED.DATE_RANGES;

  scoreTypes: Array<any> = APPSHARED.SCORE_TYPES;

  flagTypes: Array<any> = APPSHARED.FLAG_TYPES;

  clientFilterParam: string;

  staffFilterParam: string;

  filterCriteria: any = {
    scoreType: null,
    searchString: null,
    clientFilter: null,
    dateRange: null,
    flagged: null,
    staffFilter: null
  };

  filterString: string = '';

  @ViewChild(MatSort) sort: MatSort;

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

  // OnInit
  ngOnInit() {
    this.appComponentStateService.isLoading = true;

    // Get view filter data
    this.appDataService.getFilters().subscribe((res) => {
      this.staffList = res.staff;
      this.clientListKey = res.clientGroups.key;
      this.clientListValue = res.clientGroups.value;
    });

    this.loadData();
  }

  // After view init
  ngAfterViewInit() {}

  // Get Filtered data
  loadData(isFilter = true) {
    const options = { ...this.filterCriteria };
    options.dataLimit = this.dataLimit;
    this.dataOffset = options.dataOffset = isFilter ? 0 : this.dataOffset;

    if (isFilter) {
      this.allScores = [];
    }

    this.isFetching = true;
    this.appDataService.getClientFeedback(options).subscribe(
      (res) => {
        this.isFetching = false;
        this.appComponentStateService.isLoading = false;

        this.count = res.count;

        if (res && res.allScores && res.allScores.length) {
          this.hasMoreRecords = true;
          this.dataOffset += this.dataLimit;

          this.allScores = [
            ...this.allScores,
            ...this.appDataService.dataFormat.formatResponses(res.allScores)
          ];
        } else {
          this.hasMoreRecords = false;
        }
      },
      (err) => {
        this.hasMoreRecords = false;
        this.isFetching = false;
        this.appComponentStateService.isLoading = false;
      }
    );
  }

  // Export data
  exportToCsv() {
    const formattedArray: any = [];

    const questionsArray = [];

    const exportData = this.allScores.map((item, itemIndex) => {
      const formattedData = {
        'Client Name': item.name,
        Score: item.score,
        'Previous Score': item.previousScore,
        Comment: item.comments,
        'Previous Comment': item.previousComment,
        'Improvement Suggestions': item.howToImproveComments,
        'Improvement Suggestions 2': item.howToImproveComments2,
        'Received On Date': item.receivedOnDate,
        'Loyalty Driver 1': '',
        'Loyalty Driver 2': '',
        'Loyalty Driver 3': ''
      };

      // Loyalty Drivers
      if (item.loyaltyDrivers && item.loyaltyDrivers.length) {
        formattedData['Loyalty Driver 1'] = item.loyaltyDrivers[0];
        formattedData['Loyalty Driver 2'] =
          item.loyaltyDrivers.length > 1 ? item.loyaltyDrivers[1] : '';
        formattedData['Loyalty Driver 3'] =
          item.loyaltyDrivers.length > 2 ? item.loyaltyDrivers[2] : '';
      }

      // Additional questions
      if (item.additionalQuestions && item.additionalQuestions.length) {
        item.additionalQuestions.forEach((element) => {
          // Check questions array first
          // Insert new object into array if question does not exist
          let found = questionsArray.find((q: any) => {
            return q.heading === element.heading;
          });

          if (!found) {
            // Insert new object
            questionsArray.push({
              heading: element.heading,
              values: new Array(this.allScores.length).fill('')
            });

            found = questionsArray[questionsArray.length - 1];
          }

          if (element.textInput) {
            found.values[itemIndex] = element.textInput;
          }

          if (
            element.multipleSelectionValue &&
            element.multipleSelectionValue.length
          ) {
            found.values[itemIndex] = element.multipleSelectionValue.join(',');
          }

          if (element.singleSelectionValue) {
            found.values[itemIndex] = element.singleSelectionValue;
          }
        });
      }

      formattedArray.push(formattedData);

      return formattedData;
    });

    // Check if any additional questions
    if (questionsArray.length) {
      questionsArray.forEach((q: any) => {
        q.values.forEach((v, i) => {
          formattedArray[i][q.heading] = v;
        });
      });
    }

    //console.log(formattedArray);
    
    // Call the CSV export function
    APPSHARED.exportToCsv(formattedArray, 'Client-Feedback');
  }
}
