// Imports
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import {
  IEmployeesLocationsSelectList,
  IActionItem
} from '../models/data-model';
import { NoteDialogComponent } from '../helper-components/note-dialog.component';
import { ClientInfoDialogComponent } from '../client-info/client-info.component';

// Action items component
@Component({
  selector: 'app-action-item',
  templateUrl: './action-item.component.html',
  styleUrls: ['./action-item.component.scss'],
  providers: [AppComponentStateService]
})
export class ActionItemComponent implements OnInit {
  
  // Properties
  isFetching: boolean = false;

  dataOffset = 0;
  dataLimit = 500;
  hasMoreRecords = true;
  count = 0;
  viewState: number = 1;

  actionItems: Array<any> = [];
  staffList: Array<any> = [];

  dateRanges: Array<any> = APPSHARED.DATE_RANGES;
  scoreTypes: Array<any> = APPSHARED.SCORE_TYPES;
  followup: Array<any> = APPSHARED.FOLLOWUP;

  filterCriteria: any = {
    scoreType: null,
    searchString: null,
    clientFilter: null,
    dateRange: null,
    flagged: null,
    staffFilter: null,
    followup: 'TODO',
  };

  // Component constructor
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
  ngOnInit() {
    this.appComponentStateService.isLoading = true;

    // Get view filter data
    this.appDataService.getFilters().subscribe(res => {
      this.staffList = res.staff;
    });

    this.loadData();
  }

  // Get Filtered data
  loadData(isFilter = true) {

    const options = { ...this.filterCriteria };
    options.dataLimit = this.dataLimit;
    this.dataOffset = options.dataOffset = isFilter ? 0 : this.dataOffset;


    if(isFilter) {
      this.actionItems = [];
    }

    this.isFetching = true;
    this.appDataService.getActionItems(options).subscribe(res => {

      this.isFetching = false;
      this.appComponentStateService.isLoading = false;

      this.count = res.count;

      if (res && res.allScores && res.allScores.length) {
        this.hasMoreRecords = true;
        this.dataOffset += this.dataLimit;

        this.actionItems = [ ...this.actionItems, ...this.appDataService.dataFormat.formatResponses(res.allScores) ] ;
        
      } else {
        this.hasMoreRecords = false;
      }

      // Set the view state
      this.viewState = this.filterCriteria.followup === 'TODO' ? 1 : 2;

    }, err => {
      this.hasMoreRecords = false;
      this.isFetching = false;
      this.appComponentStateService.isLoading = false;
    });

  }

  // Add note
  addNote(obj) {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      disableClose: true,
      data: { note: obj.note, addFollowup: true, heading: 'NOTE_DIALOG.RESPONSE_NOTE_HEADING' }
    });

    dialogRef.componentInstance.onSave.subscribe(({ note, addToFollowup} : { note: string, addToFollowup: boolean }) => {
      dialogRef.componentInstance.isProcessing = true;

      this.appDataService.saveSurveyLogNote(obj.objectId, note, addToFollowup).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_SUCCESS',
            2000
          );
          dialogRef.componentInstance.close();
          obj.note = note;
        },
        (err) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error'
          );
          dialogRef.componentInstance.close();
        }
      );
    });
  }

  // Toggle flag
  toggleFlag(obj) {
    obj.flagged = 1 - obj.flagged;

    this.appDataService.saveSurveyLogFlag(obj.objectId, obj.flagged).subscribe(
      (result) => {},
      (err) => {
        this.appNotificationService.showSnackBar(
          'GENERAL.SAVE_ERROR',
          2000,
          'error'
        );
        obj.flagged = 1 - obj.flagged;
      }
    );
  }

  openClientInfo(obj, tab = 0) {
    
    const dialogRef = this.dialog.open(ClientInfoDialogComponent, {
      width: '1200px',
      data: { clientId: obj.clientId, surveyLogId: obj.objectId, tab }
    });

    dialogRef.componentInstance.onSave.subscribe((note) => {
      dialogRef.componentInstance.isProcessing = true;

      this.appDataService.saveSurveyLogNote(obj.objectId, note).subscribe(
        () => {
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_SUCCESS',
            2000
          );
          obj.note = note;
        },
        () => {
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error'
          );
        }
      );
    });
  }

  // Resolve action item
  resolve(obj) {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      disableClose: true,
      data: { note: '', heading: 'NOTE_DIALOG.RESOLVE_ACTION_ITEM_HEADING' }
    });

    dialogRef.componentInstance.onSave.subscribe((note) => {
      dialogRef.componentInstance.isProcessing = true;

      this.appDataService
        .saveSurveyLogFollowup(
          obj.objectId,
          this.appStateService.loggedUser.objectId,
          note
        )
        .subscribe(
          (res) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_SUCCESS',
              2000
            );
            dialogRef.componentInstance.close();
            obj.followupById = this.appStateService.loggedUser.objectId;
            obj.followupByName = `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`;
            obj.followupOnDate = res.data.followupOnDate;
            obj.followupComments = note;
            obj.flagged = 0;

            this.appDataService
              .getPendingActionItemsCount()
              .subscribe((response) => {
                this.appStateService.pendingActionItemsCount =
                  response.pendingActionItemsCount;
              });
          },
          (err) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_ERROR',
              2000,
              'error'
            );
            dialogRef.componentInstance.close();
          }
        );
    });
  }

  // Undo resolved action item
  undoResolvedActionItem(event, obj) {
    event.preventDefault();

    const dialogRef = this.dialog.open(AsyncDialogComponent, {
      disableClose: true,
      data: { action: APPSHARED.ASYNC_DIALOG_ACTIONS.UNDO_RESOLVED_ACTION_ITEM }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;

      this.appDataService.undoResolvedActionItem(obj.objectId).subscribe(
        (result) => {
          dialogRef.componentInstance.close();
          obj.flagged = 1;
          obj.followupById = null;
          obj.followupByName = null;
          obj.followupOnDate = null;
          obj.followupComments = null;

          this.appDataService
            .getPendingActionItemsCount()
            .subscribe((response) => {
              this.appStateService.pendingActionItemsCount =
                response.pendingActionItemsCount;
            });
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

  // Edit resolved action item
  editResolvedActionItem(event, obj) {
    event.preventDefault();

    const dialogRef = this.dialog.open(NoteDialogComponent, {
      disableClose: true,
      data: {
        note: obj.followupComments,
        heading: 'NOTE_DIALOG.RESOLVE_ACTION_ITEM_HEADING'
      }
    });

    dialogRef.componentInstance.onSave.subscribe((note) => {
      dialogRef.componentInstance.isProcessing = true;

      this.appDataService
        .saveSurveyLogFollowup(
          obj.objectId,
          this.appStateService.loggedUser.objectId,
          note
        )
        .subscribe(
          (res) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_SUCCESS',
              2000
            );
            dialogRef.componentInstance.close();
            obj.followupById = this.appStateService.loggedUser.objectId;
            obj.followupByName = `${this.appStateService.loggedUser.firstName} ${this.appStateService.loggedUser.lastName}`;
            obj.followupOnDate = res.data.followupOnDate;
            obj.followupComments = note;
            obj.flagged = 0;
          },
          (err) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_ERROR',
              2000,
              'error'
            );
            dialogRef.componentInstance.close();
          }
        );
    });
  }
}
