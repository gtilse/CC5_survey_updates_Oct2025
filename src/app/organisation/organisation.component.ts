import * as _ from 'lodash';

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, of, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppNotificationService } from '../services/app-notification.service';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { IOrganisation, IDropList } from '../models/data-model';
import { ImageCropperDialogComponent } from '../helper-components/image-cropper-dialog.component';
import { DropListAddComponent } from '../helper-components/droplist-add.component';

@Component({
  selector: 'app-organisation',
  templateUrl: './organisation.component.html',
  styleUrls: ['./organisation.component.scss'],
  providers: [AppComponentStateService]
})
export class OrganisationComponent implements OnInit {
  organisationModel: IOrganisation;

  organisationForm: FormGroup;

  dropLists: Array<any> = [];

  emptyLogoFile: string = APPSHARED.ORG_LOGO_PLACEHOLDER_PHOTO;

  logoSource: string;

  logoFile: any = null;

  // Constructor
  constructor(
    private router: Router,
    private fb: FormBuilder,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {
    this.logoSource = this.emptyLogoFile;
    this.createForm();
  }

  // Init
  ngOnInit() {
    this.loadData();
  }

  // Load Data
  loadData() {
    // Get organisation and drop lists
    this.appComponentStateService.isLoading = true;

    forkJoin([
      this.appDataService.getOrganisation(),
      this.appDataService.getDropLists()
    ]).subscribe(
      (results) => {
        this.appComponentStateService.isLoading = false;
        this.organisationModel = results[0];

        this.dropLists = results[1];

        this.setFormValuesFromModel();
      },
      (err) => {
        this.appComponentStateService.hasError = true;
      }
    );
  }

  // Create the organisation form
  createForm() {
    this.organisationForm = this.fb.group({
      objectId: null,
      name: [null, Validators.required],
      email: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      logo: null,
      address: null,
      city: null,
      state: null,
      postCode: null,
      primaryContact: [null, Validators.required],
      secondaryContact: null,
      alternateEmail: null,
      phone: null,
      fax: null,
      mobile: null
    });
  }

  // Set form values from model
  setFormValuesFromModel() {
    this.organisationForm.setValue(_.clone(this.organisationModel));
    if (this.organisationForm.value.logo) {
      this.logoSource = `${
        APPSHARED.APP_DATA_PATH + this.appStateService.loggedUser.vendorId
      }/${this.organisationForm.value.logo}`;
    }
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
        this.organisationForm.patchValue(o);
      }
    });
  }

  // Save changes
  saveChanges() {
    this.appComponentStateService.isSaving = true;
    this.organisationModel = _.clone(this.organisationForm.value);

    (() => {
      if (this.logoFile) {
        const formData = new FormData();

        formData.append('file_to_upload', this.logoFile);
        formData.append('prefix', 'logo');
        formData.append('vendorId', this.appStateService.loggedUser.vendorId);
        return this.appDataService.uploadFile(formData);
      }
      return of(false);
    })()
      .pipe(
        mergeMap((logoFileName) => {
          if (logoFileName) {
            this.organisationForm.patchValue({ logo: logoFileName });
            this.organisationModel.logo = logoFileName;
          }
          return this.appDataService.saveRecord(
            'Vendor',
            this.organisationModel
          );
        })
      )
      .subscribe(
        (res) => {
          this.logoFile = null;
          this.appComponentStateService.isSaving = false;

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

  // Revert to original state
  revertChanges() {
    this.organisationForm.reset();
    this.setFormValuesFromModel();
  }

  // Open cropper dialog
  openImageCropperModal(event: any): void {
    event.preventDefault();

    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.file) {
        this.logoSource = URL.createObjectURL(result.file);
        this.logoFile = result.file;
      }
    });
  }

  // Clear Logo
  clearLogo() {
    this.logoFile = null;
    this.logoSource = this.emptyLogoFile;
    this.organisationForm.patchValue({ logo: null });
  }
}
