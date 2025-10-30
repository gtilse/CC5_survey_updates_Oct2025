import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { IEmployee, IDropList, ILocation } from '../models/data-model';
import { ImageCropperDialogComponent } from '../helper-components/image-cropper-dialog.component';
import { DropListAddComponent } from '../helper-components/droplist-add.component';
import { AppNotificationService } from '../services/app-notification.service';

@Component({
  selector: 'app-employee-edit',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.scss'],
  providers: [AppComponentStateService]
})
export class EmployeeEditComponent implements OnInit {
  // Class properties
  employee: IEmployee;

  employeeForm: FormGroup;

  reportsToList: Array<any> = [];

  displayDataForList: Array<any> = [];

  userLevels: Array<any> = [];

  emptyProfilePictureFile: string = APPSHARED.EMPTY_PROFILE_PHOTO;

  profilePictureSource: string;

  profilePictureFile: any = null;

  @Input() locations: Array<ILocation> = [];

  @Input() employees: Array<IEmployee> = [];

  @Input() dropLists: Array<IDropList> = [];

  @Output() recordSaved: EventEmitter<any> = new EventEmitter();

  @Output() recordSaveCancelled: EventEmitter<any> = new EventEmitter();

  // Constructor
  constructor(
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {
    this.profilePictureSource = this.emptyProfilePictureFile;
  }

  // OnInit
  ngOnInit() {
    this.createForm();

    _.forOwn(APPSHARED.USER_LEVEL, (value, key) => {
      this.userLevels.push({ value: value.VALUE, description: value.DESC });
    });
  }

  // Init Form
  createForm() {
    this.employeeForm = this.fb.group({
      objectId: null,
      vendorId: null,
      active: null,
      parentId: null,
      type: null,
      level: null,
      userOverrideId: null,
      locationId: null,
      firstName: [null, Validators.required],
      middleName: null,
      lastName: [null, Validators.required],
      picture: null,
      email: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      designation: null,
      department: null,
      phone: null,
      mobile: null,
      staffSurveyOnly: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Set the underlying value for checkbox
  checkboxToggle(name: string) {
    const o = {};
    o[name] = 1 - this.employeeForm.controls[name].value;
    this.employeeForm.patchValue(o);
  }

  // Select list selection changed
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
        this.employeeForm.patchValue(o);
      }
    });
  }

  // Reset form
  resetForm(employee?: IEmployee) {
    if (employee) {
      this.employeeForm.reset(employee);
    } else {
      this.employeeForm.reset();
    }

    // set reportsTo and displayDataFor lists
    this.reportsToList = [];
    this.displayDataForList = [];

    _.forEach(this.employees, (value) => {
      if (value.objectId !== this.employeeForm.value.objectId) {
        if (value.type == APPSHARED.EMPLOYEE_TYPE.EMPLOYEE.VALUE) {
          this.reportsToList.push({
            objectId: value.objectId,
            active: value.active,
            name: `${value.firstName} ${value.lastName}`
          });
          this.displayDataForList.push({
            objectId: value.objectId,
            active: value.active,
            name: `${value.firstName} ${value.lastName}`
          });
        } else {
          this.reportsToList.push({
            objectId: value.objectId,
            active: value.active,
            name: value.locationName
          });
        }
      }
    });

    // Profile picture
    if (this.employeeForm.value.picture) {
      this.profilePictureSource = `${
        APPSHARED.APP_DATA_PATH + this.appStateService.loggedUser.vendorId
      }/${this.employeeForm.value.picture}`;
    }
  }

  // Add new
  addRecord(vendorId: string) {
    this.resetForm();

    this.employeeForm.patchValue({
      objectId: '0',
      vendorId,
      type: APPSHARED.EMPLOYEE_TYPE.EMPLOYEE.VALUE,
      level: APPSHARED.USER_LEVEL.MEMBER.VALUE,
      active: APPSHARED.RECORD_STATE.ACTIVE.VALUE,
      staffSurveyOnly: 0
    });
  }

  // Edit record
  editRecord(employee: IEmployee) {
    this.resetForm(employee);
  }

  // Cancel/close
  close() {
    this.recordSaveCancelled.emit('cancelled');
  }

  // Save record
  saveRecord() {
    this.appComponentStateService.isSaving = true;

    (() => {
      if (this.profilePictureFile) {
        const formData = new FormData();

        formData.append('file_to_upload', this.profilePictureFile);
        formData.append('prefix', 'profile');
        formData.append('vendorId', this.appStateService.loggedUser.vendorId);
        return this.appDataService.uploadFile(formData);
      }
      return of(false);
    })()
      .pipe(
        mergeMap((pictureFileName) => {
          if (pictureFileName) {
            this.employeeForm.patchValue({ picture: pictureFileName });
          }

          return this.appDataService.saveRecord(
            'User',
            this.employeeForm.value
          );
        })
      )
      .subscribe(
        (res) => {
          this.profilePictureFile = null;
          this.appComponentStateService.isSaving = false;

          // Emit saved event
          const eventData: IEmployee = _.clone(this.employeeForm.value);
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
          this.appComponentStateService.isSaving = true;
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error'
          );
        }
      );
  }

  // Open cropper dialog
  openImageCropperModal(): void {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.file) {
        this.profilePictureSource = URL.createObjectURL(result.file);
        this.profilePictureFile = result.file;
      }
    });
  }

  // Clear Logo
  clearLogo() {
    this.profilePictureFile = null;
    this.profilePictureSource = this.emptyProfilePictureFile;
    this.employeeForm.patchValue({ picture: null });
  }
}
