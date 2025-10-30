// Imports
import * as _ from 'lodash';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { IOrganisation, IDropList, IUserProfile } from '../models/data-model';
import { ImageCropperDialogComponent } from '../helper-components/image-cropper-dialog.component';

import { Observable } from 'rxjs';

// User profile component
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  providers: [AppComponentStateService]
})
export class UserProfileComponent implements OnInit {

  // Component properties
  userProfile: IUserProfile;
  userProfileForm: FormGroup;
  emptyProfilePictureFile: string = APPSHARED.EMPTY_PROFILE_PHOTO;
  profilePictureSource: string;
  profilePictureFile: any = null;
  passwordUpdateViewVisible = false;
  password: string = null;
  passwordRepeat: string = null;

  // Component constructor
  constructor(
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.profilePictureSource = this.emptyProfilePictureFile;
  }

  // OnInit
  ngOnInit() {
    this.loadData();
    this.createForm();
  }

  // Fetch data from backend
  loadData() {
    this.appComponentStateService.isLoading = true;
    this.appDataService.getUserProfile(this.appStateService.loggedUser.objectId).subscribe(result => {
      this.userProfile = result;
      this.appComponentStateService.isLoading = false;
      this.setFormValuesFromModel();

    }, err => {

      this.appComponentStateService.hasError = true;
    });
  }

  // Create form
  createForm() {
    this.userProfileForm = this.fb.group({
      objectId: null,
      vendorId: null,
      level: null,
      firstName: [null, Validators.required],
      middleName: null,
      lastName: [null, Validators.required],
      picture: null,
      designation: null,
      department: null,
      phone: null,
      mobile: null,
      userName: null,
      email: [null, Validators.compose([Validators.required, Validators.email])],
      lastSuccessfulLogin: null,
      lastFailedLogin: null,
      loginHistory: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Set form values from model
  setFormValuesFromModel() {
    this.userProfileForm.setValue(_.clone(this.userProfile));
    if (this.userProfileForm.value.picture) { this.profilePictureSource = APPSHARED.APP_DATA_PATH + this.appStateService.loggedUser.vendorId + '/' + this.userProfileForm.value.picture; }

  }

  // Save changes
  saveChanges() {

    this.appComponentStateService.isSaving = true;
    this.userProfile = _.clone(this.userProfileForm.value);

    (() => {

      if (this.profilePictureFile) {
        const formData = new FormData();

        formData.append('file_to_upload', this.profilePictureFile);
        formData.append('prefix', 'profile');
        formData.append('vendorId', this.appStateService.loggedUser.vendorId);
        return this.appDataService.uploadFile(formData);

      } else {
        return of(false);
      }

    })().pipe(mergeMap(profileFileName => {
      if (profileFileName) {
        this.userProfileForm.patchValue({'picture': profileFileName});
        this.userProfile.picture = profileFileName;
      }
      return this.appDataService.saveUserProfile(this.userProfile);
    })).subscribe(res => {
      this.profilePictureFile = null;
      this.appComponentStateService.isSaving = false;

      this.translateService.get('GENERAL.SAVE_SUCCESS').subscribe(value => {
        this.snackBar.open(value);
      });
    });

  }

  // Revert to original state
  revertChanges() {
    this.userProfileForm.reset();
    this.setFormValuesFromModel();
  }

  // Modify password
  modifyPassword() {
    this.appDataService.updateUserPassword(this.appStateService.loggedUser.objectId, this.password).subscribe(res => {

      this.translateService.get('PROFILE.PASSWORD_UPDATED').subscribe(value => {
        this.snackBar.open(value);
      });

    });
  }

  // Open cropper dialog
  openImageCropperModal(event: any): void {

    if (event) {
      event.preventDefault();
    }

    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '500px',
      data: { aspectX: 1, aspectY: 1 }
    });

    dialogRef.afterClosed().subscribe(result => {
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
    this.userProfileForm.patchValue({'logo': null});
  }

  // Toggle password update view
  togglePasswordUpdateView(event: any) {
    event.preventDefault();
    this.passwordUpdateViewVisible = !this.passwordUpdateViewVisible;
    this.password = this.passwordRepeat = null;
  }

}
