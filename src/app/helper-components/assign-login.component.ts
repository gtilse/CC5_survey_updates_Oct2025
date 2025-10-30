import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { APPSHARED } from '../app-setting';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';

// Staff login component
@Component({
  selector: 'app-assign-login',
  template: `
    <h2 class="mat-dialog-title">
      {{ 'ASSIGN_LOGIN.HEADING' | translate }}&nbsp;{{ dialogData.firstName }}
    </h2>
    <h4 class="mat-subheading-1 text-secondary">
      {{ 'ASSIGN_LOGIN.SUB_HEADING' | translate }}
    </h4>

    <mat-dialog-content>
      <form [formGroup]="assignLoginForm" novalidate>
        <mat-form-field class="full-width">
          <input
            type="text"
            matInput
            maxlength="10"
            placeholder="{{ 'ASSIGN_LOGIN.USERNAME' | translate }}"
            formControlName="userName"
          />
          <mat-error ngxErrors="userName">
            <div
              [ngxError]="['required', 'minlength', 'maxlength']"
              when="touched"
            >
              {{ 'ASSIGN_LOGIN.USERNAME_ERROR' | translate }}
            </div>
          </mat-error>
        </mat-form-field>

        <mat-form-field class="full-width">
          <input
            type="password"
            matInput
            maxlength="10"
            placeholder="{{ 'ASSIGN_LOGIN.PASSWORD' | translate }}"
            formControlName="password"
          />
          <mat-error ngxErrors="password">
            <div
              [ngxError]="['required', 'minlength', 'maxlength']"
              when="touched"
            >
              {{ 'ASSIGN_LOGIN.PASSWORD_ERROR' | translate }}
            </div>
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions layout="row" layout-align="end center">
      <button
        mat-button
        mat-dialog-close
        [disabled]="appComponentStateService.isSaving"
      >
        {{ 'GENERAL.CANCEL' | translate }}
      </button>
      <button
        mat-button
        color="primary"
        (click)="saveRecord()"
        [disabled]="!assignLoginForm.valid || appComponentStateService.isSaving"
      >
        {{ 'GENERAL.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  providers: [AppComponentStateService]
})
export class AssignLoginComponent implements OnInit {
  // Component properties
  assignLoginForm: FormGroup;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<AssignLoginComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {
    this.assignLoginForm = this.fb.group({
      objectId: this.dialogData.objectId,
      userName: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(10)
        ])
      ],
      password: [
        null,
        Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(10)
        ])
      ]
    });
  }

  // Save record
  saveRecord() {
    const val = this.assignLoginForm.value;
    this.appComponentStateService.isSaving = true;

    this.appDataService
      .assignLogin(val.objectId, val.userName, val.password)
      .subscribe(
        (result) => {
          this.appComponentStateService.isSaving = false;
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_SUCCESS',
            2000
          );
          this.dialogRef.close(this.assignLoginForm.value);
        },
        (err) => {
          this.appComponentStateService.isSaving = false;
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error',
            err.error.message
          );
        }
      );
  }
}
