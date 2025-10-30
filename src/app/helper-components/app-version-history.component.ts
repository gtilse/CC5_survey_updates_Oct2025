// Imports
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';

// Note dialog component
@Component({
  selector: 'app-version-history',
  template: `
    <h2 mat-dialog-title>{{ 'VERSION.HEADING' | translate }}</h2>
    <mat-dialog-content>{{ versionHistory }}</mat-dialog-content>
    <mat-dialog-actions layout="row">
      <span flex></span>
      <button mat-button mat-dialog-close>
        {{ 'GENERAL.CLOSE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
      }

      mat-dialog-content {
        font-family: courier;
        white-space: pre-wrap;
        height: 400px;
        overflow-y: auto;
      }
    `
  ]
})
export class AppVersionHistoryComponent implements OnInit {
  // Component properties
  versionHistory: string = null;

  // Component constructor
  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<AppVersionHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {
    this.http
      .get('assets/version_history.txt', { responseType: 'text' })
      .subscribe((res) => {
        this.versionHistory = res;
      });
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }
}
