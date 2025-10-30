// Imports
import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppNotificationService } from '../services/app-notification.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import { INotification } from '../models/data-model';

// Notification Component
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  providers: [AppComponentStateService]
})
export class NotificationComponent implements OnInit {
  // Component properties
  notifications: Array<INotification> = [];

  notificationType = APPSHARED.APP_NOTIFICATION_TYPES;

  // Constructor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private dialogRef: MatDialogRef<NotificationComponent>,
    private appNotificationService: AppNotificationService
  ) {}

  // OnInit
  ngOnInit() {
    this.appComponentStateService.isLoading = true;
    this.loadData();
  }

  // Load data
  loadData() {
    this.appComponentStateService.isLoading = true;

    this.appDataService.getAppNotifications().subscribe(
      (res) => {
        this.appComponentStateService.isLoading = false;
        this.notifications = res;
      },
      (err) => {}
    );
  }

  // Route to link
  goToLink(event, obj) {
    event.preventDefault();
    let navLink = '';

    switch (obj.notificationType) {
      case 'CLIENT_SURVEY_QUEUED':
      case 'CLIENT_REMINDER_SENT':
      case 'STAFF_SURVEY_QUEUED':
        navLink = '/app/survey';
        break;

      case 'CLIENT_EMAIL_BOUNCED':
        navLink = '/app/client';
        break;

      case 'ACTION_ITEM':
        navLink = '/app/actionitems';
        break;

      case 'LOGIN_SUCCESS':
      case 'LOGIN_FAILED':
        navLink = '/app/staff';
        break;
    }

    this.dialogRef.close(navLink);
  }
}
