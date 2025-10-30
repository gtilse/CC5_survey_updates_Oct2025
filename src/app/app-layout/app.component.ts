/**
 * AppComponent
 * @description
 * Wrapper for the primary application
 * Contains toolbar, sidenav, router and footer components
 */

// Imports
import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { APPSHARED } from '../app-setting';
import { APP_NAV } from '../app-navigation';
import { ILoggedUser } from '../models/data-model';
import { AppNotificationService } from '../services/app-notification.service';
import { NotificationComponent } from '../notification/notification.component';

// Declaration for AppComponent class
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [
    `
      :host {
      }
    `
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  // Component properties
  sidenavExpanded = false;

  rightSidenavExpanded = false;

  rightSidenavSection = 'HELP';

  appLogo = APPSHARED.APP_LOGO_WHITE;

  navItems = APP_NAV;

  loggedUser: ILoggedUser = this.appStateService.loggedUser;

  profilePhoto = APPSHARED.EMPTY_PROFILE_PHOTO;

  mobileQuery: MediaQueryList;

  private mobileQueryListener: () => void;

  public helpText = '';

  public appCurrentView = '';

  public appFeedbackOptions = APPSHARED.APP_FEEDBACK_OPTIONS;

  public appFeedbackSelectedOption = null;

  public appFeedbackText = '';

  public appFeedbackSubmitting = false;

  // Component Constructor
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private router: Router,
    private http: HttpClient,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    private dialog: MatDialog,
    private appNotificationService: AppNotificationService
  ) {
    // Detect changes to the view size
    this.mobileQuery = media.matchMedia('(max-width: 960px)');
    this.mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
    };
    // tslint:disable-next-line: deprecation
    this.mobileQuery.addListener(this.mobileQueryListener);
    // Subscribe to router navigation
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.helpText = '';
        this.appFeedbackSelectedOption = '';
        this.appFeedbackText = '';
        const pathArray = event.url.split('/');
        this.appCurrentView = pathArray[pathArray.length - 1];
        // Load help for the current view
        const helpFilePath = `./assets/help/${this.appCurrentView}.html`;
        http.get(helpFilePath, { responseType: 'text' }).subscribe(
          (data) => {
            this.helpText = data;
          },
          () => {
            this.helpText =
              '<div class="heading">Help Unavailable</div><div class="content">' +
              'We are sorry, help is currently not available for this section. Not to worry, we will get this fixed soon! </div>';
          }
        );
      }
    });
  }

  // Component onInit
  ngOnInit() {
    // Remove the loading image
    const elem = document.getElementById('img-app-loading');
    if (elem) {
      elem.parentNode.removeChild(elem);
    }

    this.appDataService.getPendingActionItemsCount().subscribe((response) => {
      this.appStateService.pendingActionItemsCount =
        response.pendingActionItemsCount;
    });
  }

  // Component destroy
  ngOnDestroy(): void {
    // Remove the mobile query listener on component destroy
    // tslint:disable-next-line: deprecation
    this.mobileQuery.removeListener(this.mobileQueryListener);
  }

  // Notifications modal
  openNotificationsModal() {
    const dialogRef = this.dialog.open(NotificationComponent, {
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate([result]);
      }
    });
  }

  // Navigate to action items
  openActionItems() {
    this.router.navigate(['/app/actionitems']);
  }

  // Menu item click
  menuItemClick() {
    if (this.mobileQuery.matches && this.sidenavExpanded) {
      this.toggleSidenav();
    }
  }

  // Toggle sidenav expanded state
  toggleSidenav() {
    if (this.rightSidenavExpanded) {
      this.rightSidenavExpanded = !this.rightSidenavExpanded;
    } else {
      this.sidenavExpanded = !this.sidenavExpanded;
    }

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1000);
  }

  // Toggle right sidenav
  toggleRightSidenav(section: string) {
    if (
      !this.rightSidenavExpanded ||
      (this.rightSidenavExpanded && this.rightSidenavSection === section)
    ) {
      this.rightSidenavExpanded = !this.rightSidenavExpanded;
    }

    if (this.rightSidenavExpanded) {
      this.rightSidenavSection = section;
    }
  }

  // Submit app feedback
  submitAppFeedback() {
    this.appFeedbackSubmitting = true;
    this.appDataService
      .submitAppFeedback({
        appArea: this.appCurrentView,
        feedbackType: this.appFeedbackSelectedOption,
        feedbackText: this.appFeedbackText
      })
      .subscribe(
        () => {
          this.appFeedbackSubmitting = false;
          const feedbackSuccessString =
            this.appFeedbackSelectedOption === 'Need help'
              ? 'FEEDBACK.NEED_HELP_FEEDBACK_SENT'
              : 'FEEDBACK.OTHER_FEEDBACK_SENT';
          this.appNotificationService.showSnackBar(feedbackSuccessString, 2000);
          this.toggleRightSidenav('FEEDBACK');
          this.appFeedbackSelectedOption = '';
          this.appFeedbackText = '';
        },
        () => {
          this.appFeedbackSubmitting = false;
          this.appNotificationService.showSnackBar(
            'GENERAL.SAVE_ERROR',
            2000,
            'error'
          );
        }
      );
  }
}
