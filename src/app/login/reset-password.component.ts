import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';

@Component({
  selector: 'app-reset-password',
  template: `
    <h2
      class="mat-title push-top-xl pad"
      [hidden]="isValid == true || isVerifying == true"
    >
      Invalid request, please contact support
    </h2>
    <div
      class="login-container"
      [hidden]="isValid == false || isVerifying == true"
    >
      <div class="push-top-xl">
        <h2 class="mat-title  push-top-xl">
          {{ 'LOGIN.RESET_PASSWORD_HEADING' | translate }}
        </h2>
        <div class="mat-caption" class="push-top-xl">
          {{ 'LOGIN.RESET_PASSWORD_SUB_HEADING' | translate }}
        </div>

        <form novalidate class="push-top-xxl">
          <div fxLayout="column" fxLayoutAlign="start">
            <!-- Username -->
            <mat-form-field>
              <input
                matInput
                name="password"
                type="password"
                maxlength="10"
                [(ngModel)]="password"
                placeholder="{{ 'LOGIN.NEW_PASSWORD' | translate }}"
              />
            </mat-form-field>

            <mat-form-field>
              <input
                matInput
                name="passwordAgain"
                type="password"
                maxlength="10"
                [(ngModel)]="passwordAgain"
                placeholder="{{ 'LOGIN.NEW_PASSWORD_AGAIN' | translate }}"
              />
            </mat-form-field>
          </div>

          <!-- Submit button -->
          <div fxLayout="row" fxLayoutAlign="start center">
            <div fxFlex="grow">
              {{ 'LOGIN.RESET_PASSWORD_FOOTER' | translate }}
            </div>
            <button
              type="submit"
              fxFlex="none"
              fxFlexOffset="10px"
              mat-raised-button
              color="primary"
              (click)="onSubmit()"
              [disabled]="
                isLoading ||
                !(
                  password &&
                  password.length >= 6 &&
                  passwordAgain &&
                  password == passwordAgain
                )
              "
            >
              {{ 'LOGIN.SUBMIT' | translate | uppercase }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  appLogo: string = APPSHARED.APP_LOGO;

  password = '';

  passwordAgain = '';

  userId: string;

  name: string;

  isValid = false;

  isLoading = false;

  isVerifying = true;

  constructor(
    private router: Router,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    private appNotificationService: AppNotificationService,
    private route: ActivatedRoute
  ) {}

  // Lifecycle hooks
  ngOnInit() {
    const verificationCode = this.route.snapshot.queryParamMap.get('id');

    if (!verificationCode) {
      // make sure we have a verification code
      this.isVerifying = false;
      this.isValid = false;
      return;
    }

    // check if verification code is valid and hasn't expired
    this.appDataService.verifyPasswordResetLink(verificationCode).subscribe(
      (data) => {
        this.isVerifying = false;
        this.isValid = true;
        this.userId = data.userId;
      },
      (error) => {
        // this.appNotificationService.showSnackBar("GENERAL.GENERIC_PROCESSING_ERROR",5000,"error");
        this.isVerifying = false;
        this.isValid = false;
      }
    );
  }

  // Submit
  // Change password in backend and redirect to /auth/login
  onSubmit() {
    this.isLoading = true;
    this.appDataService.resetPassword(this.userId, this.password).subscribe(
      (data) => {
        this.isLoading = false;
        this.password = '';
        this.passwordAgain = '';
        this.appNotificationService.showSnackBar(
          'LOGIN.RESET_PASSWORD_SUCCESS',
          5000,
          'success'
        );
        this.router.navigate(['/auth/login']);
      },
      (error) => {
        this.appNotificationService.showSnackBar(
          'GENERAL.GENERIC_PROCESSING_ERROR',
          5000,
          'error'
        );
        this.password = '';
        this.passwordAgain = '';
        this.isLoading = false;
      }
    );
  }
}
