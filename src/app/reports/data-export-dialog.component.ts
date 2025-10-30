import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';
import { AngularCsv } from 'angular-csv-ext/dist/Angular-csv';

// Data export dialog component
@Component({
  selector: 'app-data-export',
  template: `
    <mat-progress-bar
      mode="indeterminate"
      color="primary"
      style="position:absolute;top:0;left:0"
      [hidden]="!isProcessing"
    ></mat-progress-bar>

    <h2 mat-dialog-title>{{ 'DATA_EXPORT.HEADING' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'DATA_EXPORT.SUB_HEADING' | translate }}</p>
      <mat-selection-list class="push-bottom" tabindex="-1">
        <mat-list-option
          (click)="columnToggle(i)"
          *ngFor="let column of columns; index as i"
          [selected]="column.selected"
        >
          {{ column.name }}
        </mat-list-option>
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions layout="row">
      <span flex></span>
      <button mat-button mat-dialog-close [disabled]="isProcessing">
        {{ 'GENERAL.BTN_CANCEL' | translate }}
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="exportData()"
        [disabled]="isProcessing"
      >
        {{ 'DATA_EXPORT.EXPORT' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class DataExportDialogComponent implements OnInit {
  // Component properties
  isProcessing: boolean = false;

  columns: Array<any> = [];

  // Constructor
  constructor(
    public dialogRef: MatDialogRef<DataExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {
    switch (this.dialogData.report) {
      case 'CLIENT_SURVEY_STATUS':
        this.columns = [
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Email Status', value: 'emailStatus', selected: true },
          { name: 'Email Opened', value: 'emailOpened', selected: true },
          {
            name: 'Received On Date',
            value: 'receivedOnDate',
            selected: false
          },
          { name: 'Reminder Date', value: 'reminderDate', selected: false },
          {
            name: 'Reminder Email Status',
            value: 'reminderEmailStatus',
            selected: false
          }
        ];

        break;

      case 'CLIENT_ALL_RESULTS':

        this.columns = [
          { name: 'Client Name', value: 'name', selected: true },
          { name: 'Client Contact (DRL)', value: 'clientContact', selected: true },
          { name: 'Score', value: 'score', selected: true },
          { name: 'Comments', value: 'comments', selected: true },
          { name: 'Improvements', value: 'howToImproveComments', selected: true },
          { name: 'Add Improvements', value: 'howToImproveComments2', selected: true },
          { name: 'Survey', value: 'surveyDescription', selected: true },
          { name: 'Sent Date', value: 'sendDate', selected: true },
          { name: 'Received on Date', value: 'receivedOnDate', selected: true },
          { name: 'Client Organization', value: 'organisation', selected: true },
          { name: 'Client Email', value: 'email', selected: true },
          { name: 'Industry', value: 'industry', selected: true },
          { name: 'Custom Category 1', value: 'customCategory1', selected: true },
          { name: 'Custom Category 1 Value', value: 'customCategory1Desc', selected: true },
          { name: 'Custom Category 2', value: 'customCategory2', selected: true },
          { name: 'Custom Category 2 Value', value: 'customCategory2Desc', selected: true },
          { name: 'Custom Category 3', value: 'customCategory3', selected: true },
          { name: 'Custom Category 3 Value', value: 'customCategory3Desc', selected: true },
          { name: 'Client Group', value: 'clientGroup', selected: true },
          { name: 'Department', value: 'department', selected: true },
          { name: 'Loyalty Driver 1', value: 'loyaltyDriver1', selected: true },
          { name: 'Loyalty Driver 2', value: 'loyaltyDriver2', selected: true },
          { name: 'Loyalty Driver 3', value: 'loyaltyDriver3', selected: true },
          { name: 'Additional Questions', value: 'additionalQuestions', selected: true },
          { name: 'Value', value: 'category', selected: true },
          { name: 'Code', value: 'code', selected: true },
          { name: 'Previous Score', value: 'prevScore', selected: true },
          { name: 'Previous Comment', value: 'prevComment', selected: true },

        ];
        break;

      case 'CLIENT_RESPONDERS':
        this.columns = [
          { name: 'Score', value: 'score', selected: true },
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Client Phone', value: 'clientPhone', selected: true },
          { name: 'Client Organisation', value: 'clientOrganisation', selected: true },
          { name: 'Client Contact', value: 'clientContact', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          { name: 'Comments', value: 'comments', selected: true },
          {
            name: 'Additional Questions',
            value: 'additionalQuestions',
            selected: false
          },
          { name: 'Improvements', value: 'howToImproveComments', selected: false },
          { name: 'Value', value: 'category', selected: false },
          { name: 'Client Group', value: 'clientGroup', selected: false },
          { name: 'Industry', value: 'industry', selected: false },
          { name: 'Department', value: 'department', selected: false },
          { name: 'Custom Category 1', value: 'customCategory1', selected: false },
          { name: 'Custom Category 1 Value', value: 'customCategory1Desc', selected: false },
          { name: 'Custom Category 2', value: 'customCategory2', selected: false },
          { name: 'Custom Category 2 Value', value: 'customCategory2Desc', selected: false },
          { name: 'Custom Category 3', value: 'customCategory3', selected: false },
          { name: 'Custom Category 3 Value', value: 'customCategory3Desc', selected: false },
          { name: 'Loyalty Drivers', value: 'loyaltyDrivers', selected: false }


        ];

        break;

      case 'CLIENT_ACTION_ITEMS':
        this.columns = [
          { name: 'Score', value: 'score', selected: true },
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Client Phone', value: 'clientPhone', selected: false },
          { name: 'Client Contact', value: 'clientDrlName', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          { name: 'Comments', value: 'comments', selected: true },
          { name: 'Followup by', value: 'followupByName', selected: false },
          { name: 'Followup Date', value: 'followupOnDate', selected: false },
          {
            name: 'Followup Comments',
            value: 'followupComments',
            selected: false
          }
        ];

        break;

      case 'CLIENT_NON_RESPONDERS':
        this.columns = [
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Client Phone', value: 'clientPhone', selected: false },
          { name: 'Client Organisation', value: 'clientOrganisation', selected: true },
          { name: 'Client Contact', value: 'clientContact', selected: true },
          { name: 'Email Status', value: 'emailStatus', selected: true },
          { name: 'Email Opened', value: 'emailOpened', selected: true },
          { name: 'Reminder Date', value: 'reminderDate', selected: false },
          {
            name: 'Reminder Email Status',
            value: 'reminderEmailStatus',
            selected: false
          }
        ];

        break;

      case 'SATISFACTION_STAFF':
      case 'SATISFACTION_CATEGORY':
      case 'SATISFACTION_INDUSTRY':
        this.columns = [
          { name: 'Score', value: 'score', selected: true },
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Client Phone', value: 'clientPhone', selected: true },
          { name: 'Client Contact', value: 'clientContact', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          { name: 'Comments', value: 'comments', selected: true }
        ];
        break;

      case 'STAFF_SURVEY_STATUS':
      case 'MANAGER_SURVEY_STATUS':
        this.columns = [
          { name: 'Staff Name', value: 'staffName', selected: true },
          { name: 'Staff Email', value: 'staffEmail', selected: true },
          { name: 'Email Status', value: 'emailStatus', selected: true },
          { name: 'Email Opened', value: 'emailOpened', selected: true },
          { name: 'Responded', value: 'responseReceived', selected: true },
          { name: 'Reminder Date', value: 'reminderDate', selected: false },
          {
            name: 'Reminder Email Status',
            value: 'reminderEmailStatus',
            selected: false
          }
        ];
        break;

      case 'STAFF_RESPONDERS':
        this.columns = [
          { name: 'Score', value: 'score', selected: true },
          { name: 'Department', value: 'department', selected: true },
          { name: 'Designation', value: 'designation', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          { name: 'Comments', value: 'comments', selected: true },
          {
            name: 'Additional Questions',
            value: 'additionalQuestions',
            selected: false
          }
        ];

        break;

      case 'PULSE_SURVEY_STATUS':
        this.columns = [
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Email Status', value: 'emailStatus', selected: true },
          { name: 'Email Opened', value: 'emailOpened', selected: true },
          {
            name: 'Received On Date',
            value: 'receivedOnDate',
            selected: false
          },
          { name: 'Reminder Date', value: 'reminderDate', selected: false },
          {
            name: 'Reminder Email Status',
            value: 'reminderEmailStatus',
            selected: false
          }
        ];

        break;

      case 'PULSE_RESPONDERS':
        this.columns = [
          { name: 'Client Name', value: 'clientName', selected: true },
          { name: 'Client Email', value: 'clientEmail', selected: true },
          { name: 'Client Phone', value: 'clientPhone', selected: true },
          { name: 'Client Contact', value: 'clientContact', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          {
            name: 'Additional Questions',
            value: 'additionalQuestions',
            selected: true
          }
        ];

        break;

      case 'MANAGER_RESPONDERS':
        this.columns = [
          { name: 'Manager', value: 'managerName', selected: true },
          { name: 'Department', value: 'department', selected: true },
          { name: 'Designation', value: 'designation', selected: true },
          { name: 'Received On Date', value: 'receivedOnDate', selected: true },
          {
            name: 'Additional Questions',
            value: 'additionalQuestions',
            selected: true
          }
        ];

        break;
    }
  }

  // Column select/unselect
  columnToggle(index) {
    this.columns[index].selected = !this.columns[index].selected;
  }

  // Export data to CSV file
  exportData() {
    let filename = 'clientculture';
    const csvData = [];
    const csvOptions: any = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: false,
      title: 'Client Culture',
      useBom: true,
      noDownload: false,
      headers: []
    };

    let expColumns = [...this.columns];
    expColumns.forEach((column) => {
      if (column.selected && column.name !== 'Additional Questions') csvOptions.headers.push(column.name);
    });

    // Transform the additional questions data if column selected
    if(expColumns.find((column) => column.name === 'Additional Questions' && column.selected)) {
      //this.columns.find((column) => column.name === 'Additional Questions').selected = false;

      this.dialogData.data.forEach((item) => {
        
        if(item.additionalQuestions && item.additionalQuestions.length) {
          // Add to column headers and data
          (JSON.parse(item.additionalQuestions)).forEach((question) => {

            // Remove quotes from additional question
            question.heading = question.heading.replace(/[\n",']/g, '');
            
            // Insert new object into array if question does not exist
            let found = expColumns.find((q: any) => {
              return q.value === question.heading;
            });

            if (!found) {
              // Insert new object
              expColumns.push({
                name: question.heading,
                value: question.heading,
                selected: true
              });

              csvOptions.headers.push(question.heading);

              found = expColumns[expColumns.length - 1];
            }

            if (question.textInput) {
              item[question.heading] = question.textInput;
            }

            if (
              question.multipleSelectionValue &&
              question.multipleSelectionValue.length
            ) {
              item[question.heading] = question.multipleSelectionValue.join(',');
            }

            if (question.singleSelectionValue) {
              item[question.heading] = question.singleSelectionValue;
            }      
            });
        }
      });
    }

    // Create
    switch (this.dialogData.report) {
      case 'CLIENT_SURVEY_STATUS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Client_Survey_Status';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'CLIENT_ALL_RESULTS':
        filename = 'All Results';
        this.dialogData.data.forEach(data => {
          const item: any = {};
          expColumns.forEach((column) => {
            if (column.selected && column.value !== 'additionalQuestions') {
              item[column.value] = data[column.value] || '';
            }
          });

          csvData.push(item);

        })
        break;

      case 'CLIENT_RESPONDERS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Client_Survey_Responders';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'CLIENT_ACTION_ITEMS':
        filename = 'Client_Survey_Action_Items';
        const dataKeys = Object.keys(this.dialogData.data);

        dataKeys.forEach((status) => {
          this.dialogData.data[status].forEach((data) => {
            const item: any = {};
            expColumns.forEach((column) => {
              if (column.selected) {
                item[column.value] = data[column.value];
              }
            });

            csvData.push(item);
          });
        });
        break;

      case 'CLIENT_NON_RESPONDERS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Client_Survey_NonResponders';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'SATISFACTION_STAFF':
      case 'SATISFACTION_CATEGORY':
      case 'SATISFACTION_INDUSTRY':
        csvOptions.headers.push('Group Name');
        filename = 'Client_Satisfaction_Report';
        this.dialogData.data.forEach((group) => {
          group.data.forEach((data) => {
            const item: any = {};
            expColumns.forEach((column) => {
              if (column.selected) {
                item[column.value] = data[column.value];
              }
            });

            item.groupName = group.groupName;
            csvData.push(item);
          });
        });

        break;

      case 'STAFF_SURVEY_STATUS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Staff_Survey_Status';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'STAFF_RESPONDERS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Staff_Survey_Responders';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'PULSE_SURVEY_STATUS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Pulse_Survey_Status';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'PULSE_RESPONDERS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Pulse_Survey_Responders';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'MANAGER_SURVEY_STATUS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Manager_Survey_Status';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;

      case 'MANAGER_RESPONDERS':
        csvOptions.headers.push('Sent Date', 'Survey');
        filename = 'Manager_Survey_Responders';

        this.dialogData.data.forEach((survey) => {
          survey.log.forEach((sendDate) => {
            sendDate.data.forEach((data) => {
              const item: any = {};
              expColumns.forEach((column) => {
                if (column.selected) {
                  item[column.value] = data[column.value];
                }
              });

              item.sendDate = sendDate.sendDate;
              item.survey = survey.description;
              csvData.push(item);
            });
          });
        });
        break;
    }

    // download the file to users machine
    new AngularCsv(csvData, filename, csvOptions);
  }
}
