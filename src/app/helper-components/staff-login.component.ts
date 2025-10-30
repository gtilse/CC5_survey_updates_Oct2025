import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Staff login component
@Component({
  selector: 'app-staff-login',
  template: `
    <h2 mat-dialog-title>{{ 'STAFF_LOGIN.HEADING' | translate }}</h2>
    <p>{{ 'STAFF_LOGIN.SUB_HEADING' | translate }}</p>

    <mat-dialog-content>
      <div class="mat-table">
        <div class="mat-header-row">
          <div class="mat-header-cell" flex="20">
            {{ 'STAFF_LOGIN.FIRST_NAME' | translate }}
          </div>
          <div class="mat-header-cell" flex="20">
            {{ 'STAFF_LOGIN.LAST_NAME' | translate }}
          </div>
          <div class="mat-header-cell" flex="40">
            {{ 'STAFF_LOGIN.EMAIL' | translate }}
          </div>
          <div class="mat-header-cell" flex="20">
            {{ 'STAFF_LOGIN.USERNAME' | translate }}
          </div>
        </div>

        <div class="mat-row small" *ngFor="let login of loginsData">
          <div class="mat-cell" flex="20">{{ login.firstName }}</div>
          <div class="mat-cell" flex="20">{{ login.lastName }}</div>
          <div class="mat-cell" flex="40">{{ login.email }}</div>
          <div class="mat-cell" flex="20">
            <input
              matInput
              placeholder="{{ 'STAFF_LOGIN.ASSIGN_LOGIN' | translate }}"
              [(ngModel)]="login.userName"
              class="table-input"
            />
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions layout="row" layout-align="end center">
      <button mat-button mat-dialog-close>
        {{ 'GENERAL.CANCEL' | translate }}
      </button>
      <button mat-button color="primary" (click)="saveRecord()">
        {{ 'GENERAL.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class StaffLoginComponent implements OnInit {
  // Component properties
  loginsData: Array<any> = [];

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<StaffLoginComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {
    this.loginsData = this.dialogData.map((val) => {
      return {
        objectId: val.objectId,
        firstName: val.firstName,
        lastName: val.lastName,
        email: val.email,
        userName: val.userName,
        editMode: false
      };
    });
  }

  // Save record
  saveRecord() {
    this.dialogRef.close();
  }
}
