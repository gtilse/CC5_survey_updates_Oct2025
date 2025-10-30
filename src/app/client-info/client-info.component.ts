import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppDataService } from '../services/app-data.service';
import { AppStateService } from '../services/app-state.service';

import { IClientInfo } from '../models/data-model';
import { APPSHARED } from '../app-setting';

// Component
@Component({
  selector: 'app-client-info',
  templateUrl: './client-info.component.html',
  providers: [AppComponentStateService]
})
export class ClientInfoDialogComponent implements OnInit {
  // Component properties
  public clientInfo = <IClientInfo>{};

  public surveys: Array<any> = [];

  public followupComments = '';

  public emailStatusDesc = APPSHARED.EMAIL_STATUS;

  public surveyScore: number = 0;

  isProcessing: boolean = false;

  tab: number = 0;

  staffList: Array<any> = [];

  onSave = new EventEmitter<any>();

  // Component Constructor
  constructor(
    public appComponentStateService: AppComponentStateService,
    private appDataService: AppDataService,
    private AppStateService: AppStateService,
    private appNotificationService: AppNotificationService,
    public dialogRef: MatDialogRef<ClientInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {}

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;

    this.appDataService.getFilters().subscribe(res => {
      this.staffList = res.staff;
    });

    this.appDataService
      .getClientInfo(this.dialogData.clientId)
      .subscribe((res: any) => {
        this.appComponentStateService.isLoading = false;
        this.clientInfo = res.clientInfo;

        if (res.surveys && res.surveys.length) {

          this.surveys = res.surveys.map(s => {
            return { ...s, editMode: false }
          });

          const found = this.surveys.find(
            (e) => e.objectId === this.dialogData.surveyLogId
          );
          if (found) {
            this.followupComments = found.followupComments;
            this.surveyScore = found.score;
          }
        }
      });
    this.tab = this.dialogData.tab;
  }

  saveFollowupComments() {
    this.appDataService
      .saveSurveyLogFollowup(
        this.dialogData.surveyLogId,
        this.AppStateService.loggedUser.objectId,
        this.followupComments
      )
      .subscribe((res) => {});
  }

  openEditMode(obj: any) {

    if(this.AppStateService.loggedUser.accessLevel !== 1) return;
    obj.editMode = true;
  }

  editRecord(obj: any, action: 'SAVE' | 'CANCEL') {

    if(action === 'CANCEL') {
      obj.editMode = false;
      return;
    }
    
    this.appDataService.saveSurveyDrl(obj.objectId, obj.drlId).subscribe((res)=> {
      this.appNotificationService.showSnackBar(
        'GENERAL.SAVE_SUCCESS',
        2000
      );

      obj.editMode = false;
      // Update the drl name
      const found = this.staffList.find(o => o.objectId === obj.drlId);
      if(found) {
        obj.drlName = found.fullName;
      }
    }, err => {
      this.appNotificationService.showSnackBar(
        'GENERAL.SAVE_ERROR',
        2000,
        'error'
      );
    });
  }

  // Close modal
  closeModal() {
    this.dialogRef.close();
  }

  // Get name
  getNames(obj: any) {
    return obj.map((o) => o.name).join(', ');
  }
}
