// Component imports
import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';
import { DropListAddComponent } from '../helper-components/droplist-add.component';
import {
  IClient,
  IDropList,
  IEmployeesLocationsSelectList
} from '../models/data-model';

// Client edit component
@Component({
  selector: 'app-client-edit',
  templateUrl: './client-edit.component.html',
  styleUrls: ['./client-edit.component.scss'],
  providers: [AppComponentStateService]
})
export class ClientEditComponent implements OnInit {
  // Class properties
  client: IClient;
  clientForm: FormGroup;
  titleList: Array<any> = APPSHARED.TITLES;
  yearSelectionList: Array<number> = APPSHARED.yearSelectionList();
  clientValuationList: Array<string> = APPSHARED.CLIENT_VALUATIONS;
  accountSizeList: Array<string> = APPSHARED.ACCOUNT_SIZES;
  companySizeList: Array<string> = APPSHARED.COMPANY_SIZES;
  frequencyOfReviewList: Array<string> = APPSHARED.FREQUENCY_OF_REVIEW;
  activeTabIndex = 0;
  customDropListCategories: Array<any> = [];

  @Input() staffSelectList: Array<IEmployeesLocationsSelectList> = [];
  @Input() dropLists: Array<IDropList> = [];
  @Output() recordSaved: EventEmitter<any> = new EventEmitter();
  @Output() recordSaveCancelled: EventEmitter<any> = new EventEmitter();

  constructor(
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component OnInit
  ngOnInit() {

    // Get the custom categories
    this.appDataService.getDropListCustomCategories().subscribe(res => {
      res.forEach(item => {
        this.customDropListCategories.push({ VALUE: item, DESC: item});
      })
    });

    // Build the edit form
    this.createForm();

    // Custom validation
    this.clientForm.get('customCategory1').valueChanges
      .subscribe(value => {
        if(value) {
          this.clientForm.get('customCategory1Desc').setValidators(Validators.required)
        } else {
          this.clientForm.get('customCategory1Desc').clearValidators();
        }

        this.clientForm.get('customCategory1Desc').updateValueAndValidity();
      });

    this.clientForm.get('customCategory2').valueChanges
      .subscribe(value => {
        if(value) {
          this.clientForm.get('customCategory2Desc').setValidators(Validators.required)
        } else {
          this.clientForm.get('customCategory2Desc').clearValidators();
        }

        this.clientForm.get('customCategory2Desc').updateValueAndValidity();
      });

    this.clientForm.get('customCategory3').valueChanges
      .subscribe(value => {
        if(value) {
          this.clientForm.get('customCategory3Desc').setValidators(Validators.required)
        } else {
          this.clientForm.get('customCategory3Desc').clearValidators();
        }

        this.clientForm.get('customCategory3Desc').updateValueAndValidity();
      });

  }

  // Create form
  createForm() {
    this.clientForm = this.fb.group({
      objectId: null,
      vendorId: null,
      active: null,
      sendSurveyEmail: null,
      title: null,
      name: [null, Validators.required],
      organisation: null,
      email: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      code: null,
      yearOfBirth: [
        null,
        Validators.compose([Validators.min(1900), Validators.max(2000)])
      ],
      
      phone: null,
      frequencyOfReview: null,
      
      secondaryTitle: null,
      secondaryName: null,
      secondaryPhone: null,
      secondaryEmail: null,
      tertiaryTitle: null,
      tertiaryName: null,
      tertiaryPhone: null,
      tertiaryEmail: null,
      industry: null,
      companySize: null,
      category: null,
      clientGroup: null,
      clientSinceYear: null,
      accountSize: null,
      recommendedByExistingClient: null,
      referredBefore: null,
      drl: [null, Validators.required],
      drlInclude: [],
      tags: [],
      transferredFromDrl: null,
      transferredFromDrlDate: null,
      transferredFromDrlReason: null,
      customCategory1: null,
      customCategory1Desc: null,
      customCategory2: null,
      customCategory2Desc: null,
      customCategory3: null,
      customCategory3Desc: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Reset form
  resetForm(client?: IClient) {
    this.activeTabIndex = 0;

    if (client) {
      this.clientForm.reset(client);
    } else {
      this.clientForm.reset();
    }
  }

  // Set the underlying value for checkbox
  checkboxToggle(name: string) {
    const o = {};
    o[name] = 1 - this.clientForm.controls[name].value;
    this.clientForm.patchValue(o);
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
        this.clientForm.patchValue(o);
      }
    });
  }

  // Get attribute values based on user selection
  getCustomAttributeValues(val: any) {
    return this.dropLists.filter(elem => {
      return elem.category === val;
      
    })
  }

  // Add new
  addRecord(vendorId: string) {
    this.resetForm();

    this.clientForm.patchValue({
      objectId: '0',
      vendorId,
      active: APPSHARED.RECORD_STATE.ACTIVE.VALUE,
      sendSurveyEmail: true,
      recommendedByExistingClient: false,
      drlInclude: [],
      tags: []
    });
  }

  // Edit record
  editRecord(client: IClient) {
    this.resetForm(JSON.parse(JSON.stringify(client)));   // Deep copy
  }

  // Save record
  saveRecord() {
    this.appComponentStateService.isSaving = true;

    const oClient = _.clone(this.clientForm.value);
    oClient.drlInclude = oClient.drlInclude
      ? JSON.stringify(oClient.drlInclude)
      : [];

    oClient.tags = oClient.tags ? JSON.stringify(oClient.tags) : [];

    this.appDataService.saveRecord('Client', oClient).subscribe(
      (res) => {
        this.appComponentStateService.isSaving = false;
        // Emit saved event
        const eventData: any = _.clone(this.clientForm.value);
        eventData.objectId = res.objectId;
        eventData.createdAt = res.createdAt;
        eventData.updatedAt = res.updatedAt;
        this.recordSaved.emit(eventData);
        this.appNotificationService.showSnackBar('GENERAL.SAVE_SUCCESS', 2000);
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

  // Cancel/close
  close() {
    this.recordSaveCancelled.emit('cancelled');
  }

  // Add tag
  addTag(chip) {
    this.clientForm.get('tags').value.push(chip.value);
    chip.input.value = null;
  }

  // Remove tag
  removeTag(value) {
    const formVal = this.clientForm.get('tags').value;
    const i = formVal.indexOf(value);
    if(i >= 0) {
      formVal.splice(i,1);
    }
  }
}
