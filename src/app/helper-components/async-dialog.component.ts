import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';

// Aync dialog component
@Component({
  selector: 'app-async-dialog',
  template: `
    <mat-progress-bar
      mode="indeterminate"
      color="primary"
      style="position:absolute;top:0;left:0"
      [hidden]="!isProcessing"
    >
    </mat-progress-bar>
    <h2 mat-dialog-title>{{ dialogTitle }}</h2>
    <mat-dialog-content>
      <mat-divider></mat-divider>
      <div class="push-top">{{ dialogContent }}</div>
    </mat-dialog-content>
    <div fxLayout="row">
      <div fxFlex="grow"></div>
      <div fxFlex="none" fxLayoutGap="16px" style="margin-top:32px">
        <button mat-raised-button mat-dialog-close [disabled]="isProcessing">
          {{ 'GENERAL.BTN_NO' | translate }}
        </button>
        <button
          mat-raised-button
          color="accent"
          (click)="onYesClick()"
          [disabled]="isProcessing"
        >
          {{ 'GENERAL.BTN_YES' | translate }}
        </button>
      </div>
    </div>
  `
})
export class AsyncDialogComponent implements OnInit {
  // Component properties
  dialogTitle = '';

  dialogContent = '';

  errorState = false;

  isProcessing = false;

  onYes = new EventEmitter<any>();

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<AsyncDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {
    // Dialog size
    this.dialogRef.updateSize('500px');

    // Set dialog contents
    switch (this.dialogData.action) {
      case APPSHARED.ASYNC_DIALOG_ACTIONS.DELETE:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_DELETE')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_DELETE', {
            value: this.dialogData.selectedRecordCount
          })
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.DELETE_SINGLE_RECORD:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_DELETE')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_DELETE_SINGLE_RECORD')
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.DEACTIVATE:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_DEACTIVATE')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_DEACTIVATE', {
            value: this.dialogData.selectedRecordCount
          })
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.UPLOAD_CLIENTS:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_UPLOAD_CLIENTS')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_UPLOAD_CLIENTS', {
            value: this.dialogData.selectedRecordCount
          })
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.QUEUE_CLIENT_SURVEY:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_QUEUE_CLIENT_SURVEY')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_QUEUE_CLIENT_SURVEY')
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.QUEUE_EMPLOYEE_SURVEY:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_QUEUE_EMPLOYEE_SURVEY')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_QUEUE_EMPLOYEE_SURVEY')
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.UNDO_RESOLVED_ACTION_ITEM:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_UNDO_RESOLVED_ACTION_ITEM')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_UNDO_RESOLVED_ACTION_ITEM')
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;

      case APPSHARED.ASYNC_DIALOG_ACTIONS.REMOVE_LOGIN:
        this.translateService
          .get('ASYNC_DIALOG.TITLE_REMOVE_LOGIN')
          .subscribe((text) => {
            this.dialogTitle = text;
          });

        this.translateService
          .get('ASYNC_DIALOG.CONTENT_REMOVE_LOGIN', {
            value: this.dialogData.username
          })
          .subscribe((text) => {
            this.dialogContent = text;
          });

        break;
    }
  }

  // Emit event when Yes is clicked
  onYesClick() {
    this.onYes.emit();
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }
}
