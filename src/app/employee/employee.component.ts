// Imports
import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateService } from '@ngx-translate/core';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';
import { EmployeeIdToName } from '../app.pipes';

import { IEmployee, IDropList, ILocation } from '../models/data-model';
import { EmployeeEditComponent } from './employee-edit.component';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import { AssignLoginComponent } from '../helper-components/assign-login.component';

// Employee Component
@Component({
  selector: 'app-employees',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
  providers: [AppComponentStateService]
})
export class EmployeeComponent implements OnInit {
  // Constructor
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component properties
  @ViewChild(EmployeeEditComponent)
  employeeEditComponent: EmployeeEditComponent;

  editorOpened = false;

  employees: Array<IEmployee> = [];

  filteredData: Array<IEmployee> = [];

  dropLists: Array<IDropList> = [];

  locations: Array<ILocation> = [];

  filterVal = '';

  tableDataSelection = new SelectionModel(true, []);

  @ViewChild(MatSort) sort: MatSort;

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;
    this.loadData();
  }

  // After view init
  ngAfterViewInit() {}

  // Load data
  loadData() {
    this.appComponentStateService.isLoading = true;
    forkJoin([
      this.appDataService.getEmployees(),
      this.appDataService.getDropLists(),
      this.appDataService.getLocations()
    ]).subscribe(
      (results) => {
        this.appComponentStateService.isLoading = false;
        this.employees = this.filteredData = results[0];

        this.dropLists = results[1];
        this.locations = results[2];
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
    this.filteredData = _.clone(this.employees);
    if (this.filterVal && this.filterVal.trim()) {
      this.filteredData = this.filteredData.filter((o) => {
        return (
          o.firstName.toUpperCase().indexOf(this.filterVal.toUpperCase()) !==
            -1 ||
          o.lastName.toUpperCase().indexOf(this.filterVal.toUpperCase()) !== -1
        );
      });
    }

    // Sort
    if (!this.sort.active || this.sort.direction == '') {
      return;
    }

    this.filteredData = this.filteredData.sort((a, b) => {
      if (this.sort.active == 'parentId') {
        const employeeIdToNamePipe = new EmployeeIdToName();
        return (
          (employeeIdToNamePipe.transform(a[this.sort.active], this.employees) <
          employeeIdToNamePipe.transform(b[this.sort.active], this.employees)
            ? -1
            : 1) * (this.sort.direction == 'asc' ? 1 : -1)
        );
      }
      return (
        (a[this.sort.active] < b[this.sort.active] ? -1 : 1) *
        (this.sort.direction == 'asc' ? 1 : -1)
      );
    });
  }

  // Row select
  editRecord(row: any): void {
    this.editorOpened = true;
    this.employeeEditComponent.editRecord(row);
  }

  // Add new record
  addRecord(): void {
    this.editorOpened = true;
    this.employeeEditComponent.addRecord(
      this.appStateService.loggedUser.vendorId
    );
  }

  // Editor events
  recordSaved(eventData) {
    this.editorOpened = false;
    const index: number = _.findIndex(this.employees, {
      objectId: eventData.objectId
    });
    if (index >= 0) {
      this.employees[index] = _.merge(
        {},
        this.employees[index],
        <IEmployee>eventData
      );
    } else {
      this.employees.push(<IEmployee>eventData);
    }

    this.showRecords();
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

      this.appDataService.deleteRecords('User', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_SUCCESS',
            2000
          );

          dialogRef.componentInstance.close();

          // remove records from the array
          const tableData = this.employees;
          _.remove(tableData, (o) => {
            return objectIds.indexOf(o.objectId) !== -1;
          });

          this.employees = tableData;
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

  // Deactivate selected records
  deactivateSelectedRecords() {
    const dialogRef = this.dialog.open(AsyncDialogComponent, {
      disableClose: true,
      data: {
        action: APPSHARED.ASYNC_DIALOG_ACTIONS.DEACTIVATE,
        selectedRecordCount: this.tableDataSelection.selected.length
      }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;

      const objectIds = this.tableDataSelection.selected.map((o) => o.objectId);

      this.appDataService.deactivateRecords('User', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_SUCCESS',
            2000
          );
          dialogRef.componentInstance.close();

          // remove records from the array
          const tableData = this.employees;
          _.forEach(tableData, (o) => {
            if (objectIds.indexOf(o.objectId) !== -1) {
              o.active = 0;
            }
          });

          this.employees = tableData;
          this.tableDataSelection.clear();
          this.showRecords();
        },
        (err) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.TXT_DEACTIVATE_ERROR',
            2000,
            'error'
          );
          dialogRef.componentInstance.close();
        }
      );
    });
  }

  // Manage logins
  manageLogins() {}

  // Toggle login
  toggleLogin(row) {
    if (row.userName) {
      // Delete
      const dialogRef = this.dialog.open(AsyncDialogComponent, {
        disableClose: true,
        data: {
          action: APPSHARED.ASYNC_DIALOG_ACTIONS.REMOVE_LOGIN,
          username: row.userName
        }
      });

      dialogRef.componentInstance.onYes.subscribe(() => {
        dialogRef.componentInstance.isProcessing = true;

        this.appDataService.removeLogin(row.objectId).subscribe(
          (result) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_SUCCESS',
              2000
            );
            dialogRef.componentInstance.close();

            // remove records from the array
            const tableData = this.employees;
            const obj = tableData.find((o) => o.objectId === row.objectId);
            if (obj) {
              obj.userName = null;
            }

            this.employees = tableData;
            this.showRecords();
          },
          (err) => {
            this.appNotificationService.showSnackBar(
              'GENERAL.SAVE_ERROR',
              2000,
              'error'
            );
            dialogRef.componentInstance.close();
          }
        );
      });
    } else {
      // Assign new login
      const dialogRef = this.dialog.open(AssignLoginComponent, {
        width: '500px',
        disableClose: true,
        data: row
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.userName) {
          const tableData = this.employees;
          const obj = tableData.find((o) => o.objectId === row.objectId);
          if (obj) {
            obj.userName = result.userName;
          }

          this.employees = tableData;
          this.showRecords();
        }
      });
    }
  }
}
