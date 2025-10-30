import * as _ from 'lodash';
import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { ILocation, IDropList } from '../models/data-model';
import { DropListAddComponent } from '../helper-components/droplist-add.component';
import { AppNotificationService } from '../services/app-notification.service';

@Component({
  selector: 'app-location-edit',
  templateUrl: './location-edit.component.html',
  styleUrls: ['./location-edit.component.scss'],
  providers: [AppComponentStateService]
})
export class LocationEditComponent implements OnInit {
  // Class properties
  // Class properties
  location: ILocation;

  locationForm: FormGroup;

  @Input() dropLists: Array<IDropList> = [];

  @Output() recordSaved: EventEmitter<any> = new EventEmitter();

  @Output() recordSaveCancelled: EventEmitter<any> = new EventEmitter();

  // Component constructor
  constructor(
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Init
  ngOnInit() {
    this.createForm();
  }

  // Init Form
  createForm() {
    this.locationForm = this.fb.group({
      objectId: null,
      vendorId: null,
      name: [null, Validators.required],
      address: null,
      city: null,
      state: null,
      postCode: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Reset form
  resetForm(location?: ILocation) {
    if (location) {
      this.locationForm.reset(location);
    } else {
      this.locationForm.reset();
    }
  }

  // Add new
  addRecord(vendorId: string) {
    this.resetForm();

    this.locationForm.patchValue({
      objectId: '0',
      vendorId
    });
  }

  // Edit record
  editRecord(location: ILocation) {
    this.resetForm(location);
  }

  // Cancel/close
  close() {
    this.recordSaveCancelled.emit('cancelled');
  }

  // Save record
  saveRecord() {
    this.appComponentStateService.isSaving = true;

    this.appDataService
      .saveRecord('Location', this.locationForm.value)
      .subscribe(
        (res) => {
          this.appComponentStateService.isSaving = false;

          // Emit saved event
          const eventData: ILocation = _.clone(this.locationForm.value);
          eventData.objectId = res.objectId;
          eventData.createdAt = res.createdAt;
          eventData.updatedAt = res.updatedAt;
          this.recordSaved.emit(eventData);
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_SUCCESS',
            2000
          );
        },
        (err) => {
          this.appComponentStateService.isSaving = false;
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error'
          );
        }
      );
  }

  // Add to drop list
  addToDropList(formControlName: string, dropListIdentity: string) {
    const dialogRef = this.dialog.open(DropListAddComponent, {
      disableClose: true,
      data: { dropListCategory: APPSHARED.DROPLIST[dropListIdentity] }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const dropListsCopy = _.clone(this.dropLists);

        dropListsCopy.push({
          objectId: result.objectId,
          vendorId: result.vendorId,
          category: result.category,
          description: result.description
        });

        this.dropLists = dropListsCopy;

        const o = {};
        o[formControlName] = result.description;
        this.locationForm.patchValue(o);
      }
    });
  }
}
