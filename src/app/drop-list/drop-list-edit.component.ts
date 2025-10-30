// Imports
import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { IDropList } from '../models/data-model';

// Droplist Edit component
@Component({
  selector: 'app-drop-list-edit',
  templateUrl: './drop-list-edit.component.html',
  styleUrls: ['./drop-list-edit.component.scss'],
  providers: [AppComponentStateService]
})
export class DropListEditComponent implements OnInit {
  // Component properties
  dropListForm: FormGroup;
  dropListCategories: Array<any> = [];
  _dropListCategories: Array<any> = [];
  newCategoryName: string = '';
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
    private snackBar: MatSnackBar
  ) {}

  // OnInit
  ngOnInit() {

    // Add default categories
    for (const key in APPSHARED.DROPLIST) {
      this.dropListCategories.push({...APPSHARED.DROPLIST[key]});
      this._dropListCategories.push({...APPSHARED.DROPLIST[key]});
    }

    // Get the custom categories
    this.appDataService.getDropListCustomCategories().subscribe(res => {
      res.forEach(item => {
        this.dropListCategories.push({ VALUE: item, DESC: item});
      })
    });

    // Build the form
    this.createForm();
  }

  // Init Form
  createForm() {
    this.dropListForm = this.fb.group({
      objectId: null,
      vendorId: null,
      category: [null, Validators.required],
      description: [null, Validators.required],
      isCustom: 0,
      createdAt: null,
      updatedAt: null
    });
  }

  // Reset form
  resetForm(dropList?: IDropList) {

    this.newCategoryName = '';

    if (dropList) {
      this.dropListForm.reset(dropList);
    } else {
      this.dropListForm.reset();
    }
  }

  // Add new
  addRecord(vendorId: string) {
    this.resetForm();

    this.dropListForm.patchValue({
      objectId: '0',
      vendorId,
      category: null,
      description: null,
      createdAt: null,
      updatedAt: null
    });
  }

  // Edit record
  editRecord(dropList: IDropList) {
    this.resetForm(dropList);
  }

  // Cancel/close
  close() {
    this.recordSaveCancelled.emit('cancelled');
  }

  // Save record
  saveRecord() {
    this.appComponentStateService.isSaving = true;

    // Check if custom category
    const category = this.dropListForm.value.category;
    const found = this._dropListCategories.find(elem => elem.VALUE === category);

    this.dropListForm.patchValue({ isCustom: found ? 0 : 1});

    // Save
    this.appDataService
      .saveRecord('DropList', this.dropListForm.value)
      .subscribe(
        (res) => {
          this.appComponentStateService.isSaving = false;

          // Emit saved event
          const eventData: IDropList = _.clone(this.dropListForm.value);
          eventData.objectId = res.objectId;
          eventData.createdAt = res.createdAt;
          eventData.updatedAt = res.updatedAt;
          this.recordSaved.emit(eventData);

          this.translateService
            .get('GENERAL.TXT_SAVE_SUCCESS')
            .subscribe((value) => {
              this.snackBar.open(value);
            });
        },
        (err) => {
          this.translateService
            .get('GENERAL.TXT_SAVE_ERROR')
            .subscribe((value) => {
              this.snackBar.open(value);
            });
        }
      );
  }

  // Create category
  createCategory() {
    this.dropListCategories.push({ 'VALUE': this.newCategoryName, 'DESC': this.newCategoryName});
    this.dropListForm.patchValue({ category: this.newCategoryName});
    this.newCategoryName = '';
  }
}
