// Imports
import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';

import { IDropList } from '../models/data-model';
import { DropListEditComponent } from './drop-list-edit.component';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';

import {forkJoin} from 'rxjs';

// Droplist component
@Component({
  selector: 'app-drop-list',
  templateUrl: './drop-list.component.html',
  styleUrls: ['./drop-list.component.scss'],
  providers: [AppComponentStateService]
})
export class DropListComponent implements OnInit {
  
  // Component properties
  editorOpened = false;
  dropListCategories: Array<any> = [];
  dropLists: Array<IDropList> = [];
  filteredData: Array<IDropList> = [];
  tableDataSelection = new SelectionModel(true, []);
  filterVal = '';
  
  @ViewChild(DropListEditComponent)
  dropListEditComponent: DropListEditComponent;

  @ViewChild(MatSort)
  sort: MatSort;

  columns = ['select', 'category','description', 'actions'];

  // Component constructor
  constructor(
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component init
  ngOnInit() {
    
    this.appComponentStateService.isLoading = true;

    // Add the default categories
    for (const key in APPSHARED.DROPLIST) {
      this.dropListCategories.push(APPSHARED.DROPLIST[key]);
    }

    // Get the custom categories
    this.appDataService.getDropListCustomCategories().subscribe(res => {
      res.forEach(item => {
        this.dropListCategories.push({ VALUE: item, DESC: item});
      })
    });

    // Load data from backend
    this.loadData();
  }

  // After View init
  ngAfterViewInit() {}

  // Load data
  loadData() {
    this.appComponentStateService.isLoading = true;
    forkJoin([this.appDataService.getDropLists()]).subscribe(
      (results) => {
        this.appComponentStateService.isLoading = false;
        this.dropLists = this.filteredData = results[0];
      },
      (err) => {
        this.appComponentStateService.hasError = true;
      }
    );
  }

  //#region Table actions

  // Check if all rows are selected
  isAllSelected() {
    const numSelected = this.tableDataSelection.selected.length;
    const numRows = this.filteredData.length;
    return numSelected === numRows;
  }

  // Select all rows if not selected else clear selection
  masterToggle() {
    this.isAllSelected()
      ? this.tableDataSelection.clear()
      : this.filteredData.forEach((row) => this.tableDataSelection.select(row));
  }

  // Apply filter and sort to redisplay the records
  showRecords() {
    this.tableDataSelection.clear();

    // Filter
    this.filteredData = _.clone(this.dropLists);
    if (this.filterVal && this.filterVal.trim()) {
      this.filteredData = this.filteredData.filter((o) => {
        return (
          o.category.toUpperCase().indexOf(this.filterVal.toUpperCase()) !== -1
        );
      });
    }

    // Sort
    if (!this.sort.active || this.sort.direction == '') {
      return;
    }

    this.filteredData = this.filteredData.sort((a, b) => {
      return (
        (a[this.sort.active] < b[this.sort.active] ? -1 : 1) *
        (this.sort.direction == 'asc' ? 1 : -1)
      );
    });
  }

  //#endregion

  //#region Data actions

  // Row select
  editRecord(row: any): void {
    this.editorOpened = true;
    this.dropListEditComponent.editRecord(row);
  }

  // Add new record
  addRecord(): void {
    this.editorOpened = true;
    this.dropListEditComponent.addRecord(
      this.appStateService.loggedUser.vendorId
    );
  }

  // Editor events
  recordSaved(eventData) {
    this.editorOpened = false;
    const index: number = _.findIndex(this.dropLists, {
      objectId: eventData.objectId
    });
    if (index >= 0) {
      this.dropLists[index] = <IDropList>eventData;
    } else {
      this.dropLists.push(<IDropList>eventData);
    }

    this.showRecords();

    // Add to droplist category if does not exist
    const found = this.dropListCategories.find(e => e.VALUE === eventData.category)
    if(!found) {
      this.dropListCategories.push({ VALUE: eventData.category, DESC: eventData.category });
    }
    
  }

  // Cancel record save
  recordSaveCancelled(event) {
    this.editorOpened = false;
  }

  // Delete selected records
  deleteSelectedRecords() {
    const dialogRef = this.dialog.open(AsyncDialogComponent, {
      disableClose: true,
      data: {
        action: APPSHARED.ASYNC_DIALOG_ACTIONS.DELETE,
        selectedRecordCount: this.tableDataSelection.selected.length
      }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;

      const objectIds = this.tableDataSelection.selected.map((o) => o.objectId);

      this.appDataService.deleteRecords('DropList', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_SUCCESS',
            2000
          );
          dialogRef.componentInstance.close();

          // remove records from the array
          const tableData = this.dropLists;
          _.remove(tableData, (o) => {
            return objectIds.indexOf(o.objectId) !== -1;
          });

          this.dropLists = tableData;
          this.tableDataSelection.clear();
          this.showRecords();
        },
        (err) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_ERROR',
            2000,
            'error'
          );
          dialogRef.componentInstance.close();
        }
      );
    });
  }

  //#endregion
}
