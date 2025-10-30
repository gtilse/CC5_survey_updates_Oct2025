// Imports
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

// App notification service class
@Injectable()
export class AppNotificationService {
  // Component constructor
  constructor(
    public snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {}

  //
  public showSnackBar(
    translateKey: string,
    duration: number = 2000,
    notificationType: string = 'success',
    message?: string
  ) {
    this.translateService.get(translateKey).subscribe(value => {
      if (message) {
        value += '[' + message + ']';
      }

      const snackBar = this.snackBar.open(value, null, {
        duration: duration,
        panelClass: notificationType
      });

      // snackBar.action.subscribe()
    });
  }

  // Display backend errors
  // Error obj => { code:'error_code', message: 'message to be displayed' }
  public showBackendError(errorInfo: any) {
    if (errorInfo && errorInfo.message) {
      this.snackBar.open(errorInfo.message, null, {
        duration: 3000,
        panelClass: 'error'
      });
    } else {
      this.snackBar.open('An unhandled error occured. Try again later.', null, {
        duration: 3000,
        panelClass: 'error'
      });
    }
  }
}
