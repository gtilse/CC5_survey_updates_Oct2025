// Imports
import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import {
  IClient,
  IDropList,
  IStaffSelectList,
  IEmployeesLocationsSelectList,
  IClientScore
} from '../models/data-model';
import { ClientEditComponent } from './client-edit.component';
import { ClientScoreComponent } from './client-score.component';
import { FileUploadComponent } from '../helper-components/file-upload.component';
import { EmployeeIdToName } from '../app.pipes';

import {forkJoin} from 'rxjs';


// Client Component
@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss'],
  providers: [AppComponentStateService]
})
export class ClientComponent implements OnInit {
  // Constructor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {}

  // Component properties
  isFetching: boolean = true;
  editorOpened: boolean = false;
  dropLists: Array<IDropList> = [];
  clientsScore: Array<IClientScore> = [];
  staffSelectList: Array<IStaffSelectList> = [];
  staffDescendantsList: Array<IEmployeesLocationsSelectList> = [];
  clientListKey: Array<string> = [];
  clientListValue: Array<any> = [];
  dateRanges = APPSHARED.DATE_RANGES;
  clients: Array<IClient> = [];
  
  filterCriteria: any = {
    clientGroup: null,
    clientContacts: [],
    dateRange: null,
    filterString: '',
    active: 1
  }

  dataOffset = 0;
  dataLimit = 50;
  hasMoreRecords = true;
  totalRecordCount = 0;

  selection = new SelectionModel(true, []);
  columns = ['select', 'info', 'name', 'organisation', 'email', 'phone', 'clientContact', 'actions'];
  
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild(ClientEditComponent)
  clientEditComponent: ClientEditComponent;

  // OnInit
  ngOnInit() {
    
  }

  // After view init
  ngAfterViewInit() {
    this.appComponentStateService.isLoading = true;
    this.loadFilters();
    this.loadData();
  }

  // Load filters
  loadFilters() {
    forkJoin([
      this.appDataService.getDropLists(),
      this.appDataService.getStaffSelectList(),
      this.appDataService.getFilters(),
      this.appDataService.getDescendantsForUser()
    ]).subscribe(results => {
        this.dropLists = results[0];
        this.staffSelectList = results[1];
        this.clientListKey = results[2].clientGroups.key;
        this.clientListValue = results[2].clientGroups.value;
        this.staffDescendantsList = results[3];
        
    });
  }

  // Load client data
  loadData(isFilter: boolean = false) {
    
    this.isFetching = true;
    this.selection.clear();

    const options = { ...this.filterCriteria };
    
    options.sort = this.sort.active;
    options.sortDirection = this.sort.direction;


    options.dataLimit = this.dataLimit;
    this.dataOffset = options.dataOffset = isFilter ? 0 : this.dataOffset;
    options.userId = this.appStateService.loggedUser.objectId;
    
    if(isFilter) {
      this.clients = [];
    }

    
    this.appDataService.getClients(options).subscribe(
      (results: any) => {
        
        this.appComponentStateService.isLoading = false;
        this.isFetching = false;

        this.totalRecordCount = results.count;
        if (results && results.clients && results.clients.length) {
        
          this.hasMoreRecords = true;
          this.dataOffset += this.dataLimit;
  
          this.clients = [ ...this.clients, ...results.clients ];
          
        } else {
          this.hasMoreRecords = false;
        }
        
      },
      (err) => {
        this.appComponentStateService.hasError = true;
        this.isFetching = false;
        this.hasMoreRecords = false;
      
      }
    );
  }

  // Get score for client
  getScoreForClient(row): number {
    const score = -1;
    const client = _.find(this.clientsScore, { clientId: row.objectId });
    if (client) return client.score;
    return score;
  }

  // Open details dialog
  showScoreDetails(row) {
    const dialogRef = this.dialog.open(ClientScoreComponent, {
      width: '600px',
      data: row
    });
  }

  // Row select
  editRecord(row: any): void {
    this.editorOpened = true;
    this.clientEditComponent.editRecord(row);
  }

  // Add new record
  addRecord(): void {
    this.editorOpened = true;
    this.clientEditComponent.addRecord(
      this.appStateService.loggedUser.vendorId
    );
  }

  // Editor events
  recordSaved(eventData) {
    // Reload the table
    this.loadData(true);
    this.editorOpened = false;
  }
  
  // Cancel save record
  recordSaveCancelled(event) {
    this.editorOpened = false;
  }

  // Upload clients dialog
  uploadClients() {
    const dialogRef = this.dialog.open(FileUploadComponent, {
      disableClose: true,
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      data: {}
    });
  }

  //#region Selection

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.clients.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.clients);
  }

  // Delete selected records
  deleteSelectedRecords() {
    const dialogRef = this.dialog.open(AsyncDialogComponent, {
      disableClose: true,
      data: {
        action: APPSHARED.ASYNC_DIALOG_ACTIONS.DELETE,
        selectedRecordCount: this.selection.selected.length
      }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;

      const objectIds = this.selection.selected.map((o) => o.objectId);

      this.appDataService.deleteRecords('Client', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DELETE_SUCCESS',
            2000
          );

          dialogRef.componentInstance.close();
          this.selection.clear();

          this.loadData(true);
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
        selectedRecordCount: this.selection.selected.length
      }
    });

    dialogRef.componentInstance.onYes.subscribe(() => {
      dialogRef.componentInstance.isProcessing = true;

      const objectIds = this.selection.selected.map((o) => o.objectId);

      this.appDataService.deactivateRecords('Client', objectIds).subscribe(
        (result) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DEACTIVATE_SUCCESS',
            2000,
            'success'
          );

          dialogRef.componentInstance.close();

          this.selection.clear();
          this.loadData(true);
          
        },
        (err) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.DEACTIVATE_ERROR',
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
