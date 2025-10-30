import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="login-container">
      <div class="push-top-xl">
        <h2 class="mat-title  push-top-xl">
          {{ 'LOGIN.FORGOT_PASSWORD_HEADING' | translate }}
        </h2>
        <div class="mat-caption" class="push-top-xl">
          {{ 'LOGIN.FORGOT_PASSWORD_SUB_HEADING' | translate }}
        </div>

        <!-- Contents -->
        <form [formGroup]="forgotPasswordForm" class="push-top-xxl" novalidate>
          <div fxLayout="column" fxLayoutAlign="start">
            <!-- Username -->
            <mat-form-field>
              <input
                #username
                name="username"
                matInput
                placeholder="{{ 'LOGIN.USERNAME' | translate }}"
                formControlName="username"
                autofocus
              />
              <mat-icon matSuffix color="primary">account_circle</mat-icon>
            </mat-form-field>
          </div>

          <!-- Submit button -->
          <div fxLayout="row">
            <div fxFlex="grow"></div>
            <button
              fxFlex="none"
              type="submit"
              mat-raised-button
              color="primary"
              (click)="onSubmit()"
              [disabled]="!username.value || isLoading"
            >
              {{ 'LOGIN.SUBMIT' | translate | uppercase }}
            </button>
          </div>
        </form>

        <!-- Footer -->
        <div class="push-top push-bottom">
          {{ 'LOGIN.FORGOT_PASSWORD_FOOTER' | translate }}
        </div>

        <div class="push-bottom">
          <a routerLink="/auth/login">{{
            'LOGIN.BACK_TO_LOGIN' | translate
          }}</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent implements OnInit {
  isLoading = false;

  appLogo: string = APPSHARED.APP_LOGO;

  forgotPasswordForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    private appNotificationService: AppNotificationService
  ) {
    this.createForm();
  }

  // Lifecycle hooks
  ngOnInit() {}

  // Methods
  createForm() {
    this.forgotPasswordForm = this.fb.group({
      username: ''
    });
  }

  // Submit
  onSubmit() {
    this.isLoading = true;
    this.appDataService
      .createPasswordResetLink(this.forgotPasswordForm.get('username').value)
      .subscribe(
        (data) => {
          this.isLoading = false;
          this.forgotPasswordForm.setValue({
            username: ''
          });

          this.appNotificationService.showSnackBar(
            'LOGIN.FORGOT_PASSWORD_SUCCESS_NOTIFICATION',
            5000,
            'success'
          );
        },
        (error) => {
          this.appNotificationService.showSnackBar(
            'GENERAL.GENERIC_PROCESSING_ERROR',
            5000,
            'error'
          );
          this.forgotPasswordForm.setValue({
            username: ''
          });
          this.isLoading = false;
        }
      );
  }
}
