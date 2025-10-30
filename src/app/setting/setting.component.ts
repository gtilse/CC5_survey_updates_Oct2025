// Imports
import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { TranslateService } from '@ngx-translate/core';

import { AppNotificationService } from '../services/app-notification.service';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { IOrganisationSetting } from '../models/data-model';

// Organisation setting component
@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  providers: [
    AppComponentStateService,
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS , useValue: { float: 'always' } }
  ]
})
export class SettingComponent implements OnInit {
  // Component properties
  organisationSetting: IOrganisationSetting;

  organisationSettingForm: FormGroup;

  clientSurveyLimit: Array<any> = APPSHARED.CLIENT_SURVEY_LIMIT;
  clientCheckIn: Array<any> = APPSHARED.CLIENT_CHECKIN;
  surveySchedule: Array<any> = APPSHARED.SURVEY_SCHEDULE;
  vendorLevel: Array<any> = APPSHARED.VENDOR_LEVEL;

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

  // Component onInit
  ngOnInit() {
    this.loadData();
    this.createForm();
  }

  // Fetch data from backend
  loadData() {
    this.appComponentStateService.isLoading = true;
    this.appDataService.getOrganisationSetting().subscribe(
      (result) => {
        this.organisationSetting = result;
        this.appComponentStateService.isLoading = false;
        this.setFormValuesFromModel();
      },
      (err) => {
        this.appComponentStateService.hasError = true;
      }
    );
  }

  // Create organisation setting form
  createForm() {
    this.organisationSettingForm = this.fb.group({
      objectId: null,
      vendorId: null,
      surveyEmailFrom: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      notificationsEmail: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      followupDays: null,
      emailMessageNotification: null,
      googlePage: [null, Validators.pattern(APPSHARED.URL_VALIDATION_PATTERN)],
      facebookPage: [
        null,
        Validators.pattern(APPSHARED.URL_VALIDATION_PATTERN)
      ],
      truelocalPage: [
        null,
        Validators.pattern(APPSHARED.URL_VALIDATION_PATTERN)
      ],
      displaySocialLinksInSurvey: null,
      automatedEmailSocialMedia: null,
      socialMediaReminderDays: null,
      socialLinksBeforeComments: null,
      testimonialType: null,
      bouncedEmailNotification: null,
      pendingActionItemsNotification: null,
      newResponsesNotification: null,
      clientSurveyLimit: null,
      clientCheckIn: null,
      surveySchedule: null,
      surveyScheduleCustom: '',
      vendorLevel: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Update form from model
  setFormValuesFromModel() {
    this.organisationSettingForm.setValue(_.clone(this.organisationSetting));
  }

  // Save record
  saveChanges() {
    this.appComponentStateService.isSaving = true;

    this.appDataService
      .saveRecord('Setting', this.organisationSettingForm.value)
      .subscribe(
        (res) => {
          this.appComponentStateService.isSaving = false;
          this.organisationSettingForm.value.updatedAt = res.updatedAt;

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

  // Set the underlying value for checkbox
  checkboxToggle(name: string) {
    const o = {};
    o[name] = 1 - this.organisationSettingForm.controls[name].value;
    this.organisationSettingForm.patchValue(o);
  }

  // Revert to original state
  revertChanges() {
    this.organisationSettingForm.reset();
    this.setFormValuesFromModel();
  }
}
