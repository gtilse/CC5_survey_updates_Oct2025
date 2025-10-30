// Imports
import * as _ from 'lodash';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FileUploader } from 'ng2-file-upload';
import { APPSHARED } from '../app-setting';
import { AppDataService } from '../services/app-data.service';
import { AsyncDialogComponent } from './async-dialog.component';
import { AppNotificationService } from '../services/app-notification.service';

// Aync dialog component
@Component({
  selector: 'app-file-upload',
  template: `
    <mat-progress-bar
      mode="indeterminate"
      color="primary"
      style="position:absolute;top:0;left:0"
      [hidden]="!isProcessing"
    ></mat-progress-bar>
    <h2 mat-dialog-title>{{ 'CLIENT_UPLOAD.HEADING' | translate }}</h2>
    <p [hidden]="fileProcessed">
      {{ 'CLIENT_UPLOAD.NOFILE_HINT' | translate }}
    </p>
    <p [hidden]="!fileProcessed">
      {{ 'CLIENT_UPLOAD.FILE_PROCESSED_HINT' | translate }}
    </p>

    <mat-dialog-content>
      <div
        class="no-file"
        ng2FileDrop
        [ngClass]="{ 'file-over': hasBaseDropZoneOver }"
        (fileOver)="fileOverBase($event)"
        (onFileDrop)="fileDropped($event)"
        [uploader]="uploader"
        [hidden]="fileProcessed"
      >
        <mat-icon [hidden]="uploader.queue.length > 0" class="upload-icon"
          >note_add</mat-icon
        >
        <div *ngIf="uploader.queue.length !== 0">
          <div class="mat-table">
            <div class="mat-row">
              <div class="mat-cell">
                <strong>{{ 'CLIENT_UPLOAD.FILE_NAME' | translate }}:</strong>
              </div>
              <div class="mat-cell">{{ uploader.queue[0].file.name }}</div>
            </div>
            <div class="mat-row">
              <div class="mat-cell">
                <strong>{{ 'CLIENT_UPLOAD.FILE_SIZE' | translate }}:</strong>
              </div>
              <div class="mat-cell">
                {{ uploader.queue[0].file.size / 1024 | number: '.2' }} KB
              </div>
            </div>
            <div class="mat-row">
              <div class="mat-cell">
                <strong>{{ 'CLIENT_UPLOAD.FILE_TYPE' | translate }}:</strong>
              </div>
              <div class="mat-cell">{{ uploader.queue[0].file.type }}</div>
            </div>
          </div>
          <button
            type="button"
            [disabled]="isProcessing"
            mat-raised-button
            color="primary"
            (click)="processFile()"
          >
            {{ 'CLIENT_UPLOAD.PROCESS_FILE' | translate }}
          </button>
        </div>
      </div>

      <div class="file-processed" [hidden]="!fileProcessed">
        <!-- Column mapping -->
        <div [hidden]="fileProcessingErrorList.length > 0">
          <div class="mat-table">
            <div class="mat-header-row">
              <div class="mat-header-cell" *ngFor="let column of columns" flex>
                <mat-select
                  placeholder="{{ 'CLIENT_UPLOAD.MAP_TO' | translate }}"
                  [(ngModel)]="column.mapTo"
                >
                  <mat-option class="clear-selection">{{
                    'GENERAL.CLEAR_SELECTION' | translate
                  }}</mat-option>
                  <mat-option
                    *ngFor="let mapping of clientFieldsMapping"
                    [value]="mapping.fieldName"
                  >
                    {{ mapping.description }}
                  </mat-option>
                </mat-select>
              </div>
            </div>
            <div class="mat-header-row">
              <div class="mat-header-cell">
                {{
                  'GENERAL.RECORD_COUNT' | translate: { value: clients.length }
                }}
              </div>
            </div>
            <div class="mat-row" *ngFor="let client of clients">
              <div class="mat-cell" *ngFor="let column of columns" flex>
                {{ client[column.colIndex] }}
              </div>
            </div>
          </div>
        </div>
        <!-- File upload errors -->
        <div [hidden]="fileProcessingErrorList.length === 0">
          <div class="mat-table">
            <div class="mat-row">
              <div class="mat-cell" flex>
                <span class="app-warn-fg">{{
                  'CLIENT_UPLOAD.UPLOAD_DATA_ERROR' | translate
                }}</span>
              </div>
            </div>
            <div class="mat-row" *ngFor="let error of fileProcessingErrorList">
              <div class="mat-cell" flex>
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions layout="row">
      <div flex></div>
      <div>
        <button
          type="button"
          mat-raised-button
          color="primary"
          [disabled]="
            isProcessing || !fileProcessed || fileProcessingErrorList.length > 0
          "
          (click)="uploadData()"
        >
          {{ 'CLIENT_UPLOAD.UPLOAD_DATA' | translate }}
        </button>
        <button mat-button mat-dialog-close [disabled]="isProcessing">
          {{ 'GENERAL.CANCEL' | translate }}
        </button>
      </div>
    </mat-dialog-actions>
  `,
  styles: [``]
})
export class FileUploadComponent implements OnInit {
  // Component properties
  isProcessing: boolean = false;
  fileProcessed: boolean = false;
  fileProcessingErrorList: Array<any> = [];
  public uploader: FileUploader;
  public hasBaseDropZoneOver: boolean = false;
  columns: Array<any> = [];
  clients: Array<any> = [];
  clientFieldsMapping: Array<any> = APPSHARED.CLIENT_FIELDS_MAPPING;
  customCategories: Array<any> = [];
  
  private serverFileName: string;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<FileUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private appDataService: AppDataService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {
    this.uploader = new FileUploader({ url: 'something' });
    this.uploader.onAfterAddingFile = (f) => {
      if (this.uploader.queue.length > 1) {
        this.uploader.removeFromQueue(this.uploader.queue[0]);
      }
    };

    // Get droplist custom categories
    // Add to field mappings
    this.appDataService.getDropListCustomCategories().subscribe(res => {
      this.customCategories = res;
      res.forEach(item => {
        this.clientFieldsMapping.push({ fieldName: item, description: item});
      })
    });
  }

  // File over event
  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  // File dropped event
  public fileDropped(e: any): void {}

  // Process file
  public processFile() {
    this.isProcessing = true;
    this.columns = [];

    const formData = new FormData();
    formData.append('file_to_upload', this.uploader.queue[0]._file);
    this.appDataService.processCSVFile(formData).subscribe(
      (res) => {
        for (let i = 0; i < Object.keys(res.clients[0]).length; i++) {
          this.columns.push({ colIndex: i, mapTo: null });
        }

        this.clients = res.clients;
        this.serverFileName = res.fileName;

        this.isProcessing = false;
        this.fileProcessed = true;
      },
      (err) => {
        this.isProcessing = false;
      }
    );
  }

  // Upload data
  uploadData() {
    // Ensure mandatory fields are mapped
    const filteredColumns = _.filter(this.columns, function (column) {
      return _.includes(['name', 'drl', 'email'], column.mapTo);
    });

    if (filteredColumns.length < 3) {
      this.appNotificationService.showSnackBar(
        'CLIENT_UPLOAD.COLUMN_MAPPING_ERROR',
        2000,
        'error'
      );
      return;
    }

    // Check if column is part of custom client category
    // set the mapping accordingly
    this.columns.forEach(column => {
      if(this.customCategories.includes(column.mapTo)) {
        column.isCustomCategory = true;
      } else {
        column.isCustomCategory = false;
      }
    });


    // Confirm upload process and begin uploading of data
    const dialogRef = this.dialog.open(AsyncDialogComponent, {
      disableClose: true,
      data: { action: APPSHARED.ASYNC_DIALOG_ACTIONS.UPLOAD_CLIENTS }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;
      this.fileProcessingErrorList = [];

      this.appDataService
        .uploadClientData(this.serverFileName, this.columns)
        .subscribe(
          (res: any) => {
            dialogRef.close();

            if (res.errMsg && res.errMsg.length) {
              this.appNotificationService.showSnackBar(
                'CLIENT_UPLOAD.UPLOAD_ERROR',
                2000,
                'error'
              );
              this.fileProcessingErrorList = res.errMsg;
            } else {
              this.appNotificationService.showSnackBar(
                'CLIENT_UPLOAD.UPLOAD_SUCCESS',
                2000,
                'success'
              );
              this.fileProcessed = false;
              this.uploader.removeFromQueue(this.uploader.queue[0]);
            }
          },
          (err) => {
            this.appNotificationService.showSnackBar(
              'CLIENT_UPLOAD.UPLOAD_ERROR',
              2000,
              'error'
            );
            this.fileProcessed = false;
            dialogRef.close();
            this.uploader.removeFromQueue(this.uploader.queue[0]);
          }
        );
    });
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }
}
