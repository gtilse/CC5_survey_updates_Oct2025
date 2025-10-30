import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';

// Droplist add component
@Component({
  selector: 'app-droplist-add',
  template: `
    <h2 mat-dialog-title>
      {{
        'DROPLIST.ADD_NEW_HEADING'
          | translate: { value: dialogData.dropListCategory.DESC }
      }}
    </h2>
    <p></p>

    <mat-dialog-content>
      <form [formGroup]="dropListForm" novalidate>
        <mat-form-field>
          <input
            matInput
            placeholder="{{ 'DROPLIST.DESCRIPTION' | translate }}"
            formControlName="description"
            required
          />
          <mat-error ngxErrors="description">
            <div ngxError="required" when="touched">
              {{ 'DROPLIST.DESCRIPTION_ERROR' | translate }}
            </div>
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button
        mat-button
        mat-dialog-close
        [disabled]="appComponentStateService.isSaving"
      >
        {{ 'GENERAL.BTN_CANCEL' | translate }}
      </button>
      <button
        mat-button
        color="primary"
        (click)="saveRecord()"
        [disabled]="!dropListForm.valid || appComponentStateService.isSaving"
      >
        {{ 'GENERAL.BTN_SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  providers: [AppComponentStateService]
})
export class DropListAddComponent implements OnInit {
  // Component properties
  dropListForm: FormGroup;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<DropListAddComponent>,
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private snackBar: MatSnackBar
  ) {}

  // Component init
  ngOnInit() {
    this.dropListForm = this.fb.group({
      objectId: '0',
      vendorId: this.appStateService.loggedUser.vendorId,
      category: this.dialogData.dropListCategory.VALUE,
      description: [null, Validators.required],
      createdAt: null,
      updatedAt: null
    });
  }

  // Save record
  saveRecord() {
    this.appComponentStateService.isSaving = true;

    this.appDataService
      .saveRecord('DropList', this.dropListForm.value)
      .subscribe(
        (res) => {
          this.appComponentStateService.isSaving = false;
          this.dropListForm.patchValue({
            objectId: res.objectId,
            createdAt: res.createdAt,
            updatedAt: res.updatedAt
          });

          this.dialogRef.close(this.dropListForm.value);
        },
        (err) => {
          this.appComponentStateService.isSaving = false;

          this.translateService.get('GENERAL.SAVE_ERROR').subscribe((value) => {
            this.snackBar.open(value);
          });
        }
      );
  }
}
