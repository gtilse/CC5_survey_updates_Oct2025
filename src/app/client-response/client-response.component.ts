// Imports
import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppNotificationService } from '../services/app-notification.service';
import { APPSHARED } from '../app-setting';
import { NoteDialogComponent } from '../helper-components/note-dialog.component';
import { AdditionalQuestionsDialogComponent } from '../helper-components/additional-questions-dialog.component';
import { ClientInfoDialogComponent } from '../client-info/client-info.component';
import { FeedbackKudosDialogComponent } from '../feedback/feedback-kudos-dialog.component';

// Client response component
@Component({
  selector: 'app-client-response',
  templateUrl: './client-response.component.html',
  styleUrls: ['./client-response.component.scss'],
  providers: [AppComponentStateService]
})
export class ClientResponseComponent implements OnInit, OnChanges {
  // Component properties
  @Input() allScores?: Array<any>;

  @Input() staffList: Array<any>;

  filteredScores: Array<any> = [];

  dateRanges: Array<any> = APPSHARED.DATE_RANGES;

  scoreTypes: Array<any> = APPSHARED.SCORE_TYPES;

  flagTypes: Array<any> = APPSHARED.FLAG_TYPES;

  filterCriteria: any = {
    scoreType: null,
    clientName: null,
    comment: null,
    dateRange: null,
    flagged: null
  };

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    public snackBar: MatSnackBar,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {}

  //
  ngOnChanges(changes: SimpleChanges) {
    this.allScores = this.allScores.map((obj) => ({
      ...obj,
      drlInclude: this.getAdditionalStaff(obj.drlInclude)
    }));
    this.filteredScores = _.clone(this.allScores);
  }

  // Filter records
  filter() {
    this.filteredScores = this.allScores.filter((o) => {
      let scoreTypeFilter = true;
      let clientFilter = true;
      let commentFilter = true;
      let dateFilter = true;
      let flagFilter = true;

      // Score type
      switch (this.filterCriteria.scoreType) {
        case 'PROMOTER':
          scoreTypeFilter = APPSHARED.scoreType.isPromoter(o.score);
          break;

        case 'NEUTRAL':
          scoreTypeFilter = APPSHARED.scoreType.isNeutral(o.score);
          break;

        case 'DETRACTOR':
          scoreTypeFilter = APPSHARED.scoreType.isDetractor(o.score);
          break;

        default:
          break;
      }

      // Client name
      if (this.filterCriteria.clientName) {
        if (
          o.name
            .toLowerCase()
            .indexOf(this.filterCriteria.clientName.toLowerCase()) === -1
        ) {
          clientFilter = false;
        }
      }

      // Comments
      if (this.filterCriteria.comment) {
        if (
          !o.comments ||
          o.comments
            .toLowerCase()
            .indexOf(this.filterCriteria.comment.toLowerCase()) === -1
        ) {
          commentFilter = false;
        }
      }

      // Date range
      if (this.filterCriteria.dateRange) {
        const cutOffDate = moment().subtract(
          this.filterCriteria.dateRange,
          'days'
        );
        const receivedOnDate = moment.utc(o.receivedOnDate).local();
        dateFilter = cutOffDate <= receivedOnDate;
      }

      // Flag
      if (this.filterCriteria.flagged === 'FLAGGED' && o.flagged !== 1) {
        flagFilter = false;
      }

      if (this.filterCriteria.flagged === 'NOT_FLAGGED' && o.flagged !== 0) {
        flagFilter = false;
      }

      // return
      return (
        scoreTypeFilter &&
        clientFilter &&
        commentFilter &&
        dateFilter &&
        flagFilter
      );
    });
  }

  // Toggle flag
  toggleFlag(obj, event) {
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

  // Additional questions
  showAdditionalQuestions(obj) {
    const dialogRef = this.dialog.open(AdditionalQuestionsDialogComponent, {
      disableClose: true,
      width: '800px',
      maxHeight: '800px',
      data: {
        heading: obj.name,
        subHeading: obj.receivedOnDate,
        additionalQuestions: obj.additionalQuestions
      }
    });
  }

  openClientInfo(obj, tab=0) {
    
    const dialogRef = this.dialog.open(ClientInfoDialogComponent, {
      width: '1200px',
      data: { clientId: obj.clientId, surveyLogId: obj.objectId, tab: tab }
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

  getAdditionalStaff(drlInclude) {
    if (drlInclude) {
      const objectIds = drlInclude;
      return objectIds.map((objectId) => {
        const selected = this.staffList.find(
          (staff) => staff.objectId === objectId
        );
        // console.log(selected);
        return selected ? selected.fullName : null;
      });
      // .filter((staff) => staff);
    }
    return [];
  }

  // Kudos dialog
  sendKudos(obj: any, type: 'CLIENT' | 'TEAM') {
    
    // Check if kudos or thanks sent
    if(type === 'CLIENT') {
      if(obj.kudos?.thanks?.length > 0) {
        const found = obj.kudos.thanks.find(o => o.fromDrlId === this.appStateService.loggedUser.objectId);
        if(found) {
          this.appNotificationService.showSnackBar(
            'GENERAL.THANKS_ALREADY_SENT',
            2000,
            'error'
          );
          return;
        }

      }
    }

    if(type === 'TEAM') {
      if(obj.kudos?.kudos?.length > 0) {
        const found = obj.kudos.kudos.find(o => o.fromDrlId === this.appStateService.loggedUser.objectId);
        if(found) {
          this.appNotificationService.showSnackBar(
            'GENERAL.KUDOS_ALREADY_SENT',
            2000,
            'error'
          );
          return;
        }
      } 
    }

    // Open the dialog
    const dialogRef = this.dialog.open(FeedbackKudosDialogComponent, {
      disableClose: true,
      width: '800px',
      maxHeight: '800px',
      data: {
        obj,
        type
        
      }
    });
  }
}
