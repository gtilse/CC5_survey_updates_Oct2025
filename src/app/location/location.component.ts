// Imports
import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';
import { ILocation, IDropList } from '../models/data-model';
import { LocationEditComponent } from './location-edit.component';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  providers: [AppComponentStateService]
})
export class LocationComponent implements OnInit {
  // Component constructor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private appNotificationService: AppNotificationService,
    private dialog: MatDialog
  ) {}

  // Component properties
  @ViewChild(LocationEditComponent)
  locationEditComponent: LocationEditComponent;

  @ViewChild(MatSort) sort: MatSort;

  filterVal: string = '';

  editorOpened = false;

  locations: Array<ILocation> = [];

  filteredData: Array<ILocation> = [];

  dropLists: Array<IDropList> = [];

  tableDataSelection = new SelectionModel(true, []);

  // Component init
  ngOnInit() {
    this.loadData();
  }

  // Load data
  loadData() {
    this.appComponentStateService.isLoading = true;
    forkJoin([
      this.appDataService.getLocations(),
      this.appDataService.getDropLists()
    ]).subscribe(
      (results) => {
        this.appComponentStateService.isLoading = false;
        this.locations = this.filteredData = results[0];
        this.dropLists = results[1];
      },
      (err) => {
        this.appComponentStateService.hasError = true;
      }
    );
  }

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
    // Filter
    this.filteredData = _.clone(this.locations);
    if (this.filterVal && this.filterVal.trim()) {
      this.filteredData = this.filteredData.filter((o) => {
        return (
          o.name.toUpperCase().indexOf(this.filterVal.toUpperCase()) !== -1
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

  // Edit record
  editRecord(row: any): void {
    this.editorOpened = true;
    this.locationEditComponent.editRecord(row);
  }

  // Add new record
  addRecord(): void {
    this.editorOpened = true;
    this.locationEditComponent.addRecord(
      this.appStateService.loggedUser.vendorId
    );
  }

  // Editor events
  recordSaved(eventData) {
    this.editorOpened = false;
    const index: number = _.findIndex(this.locations, {
      objectId: eventData.objectId
    });
    if (index >= 0) {
      this.locations[index] = <ILocation>eventData;
    } else {
      this.locations.push(<ILocation>eventData);
    }

    this.showRecords();
  }

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

      this.appDataService.deleteRecords('Location', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_SUCCESS',
            2000
          );

          dialogRef.componentInstance.close();

          // remove records from the array
          const tableData = this.locations;
          _.remove(tableData, (o) => {
            return objectIds.indexOf(o.objectId) !== -1;
          });

          this.locations = tableData;
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
}
