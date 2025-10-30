/**
 * Application login component
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  isLoading = false;

  appLogo: string = APPSHARED.APP_LOGO;

  loginForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    private appNotificationService: AppNotificationService
  ) {
    this.createForm();

    // Clear local storage when user navigates to login screen
    this.appStateService.isUserLoggedIn = false;
    this.appDataService.clearLocalStorage();
  }

  // Lifecycle hooks
  ngOnInit() {}

  // Methods
  createForm() {
    this.loginForm = this.fb.group({
      username: null,
      password: null,
      rememberMe: true
    });
  }

  // Submit
  onSubmit() {
    this.isLoading = true;
    this.appDataService
      .loginUser(
        this.loginForm.get('username').value,
        this.loginForm.get('password').value
      )
      .subscribe(
        (data) => {
          // If rememberme checked, save state to local storage for retreival later
          if (this.loginForm.get('rememberMe').value) {
            this.appDataService.setLocalStorage(
              APPSHARED.LOCAL_STORAGE_KEY,
              data
            );
          }

          // Set app state and navigate to main app
          this.appStateService.loggedUser = data;
          this.appStateService.isUserLoggedIn = true;
          this.router.navigate(['/app/dashboard']);
        },

        (err) => {
          this.appNotificationService.showBackendError(err.error);
          this.loginForm.setValue({
            username: '',
            password: '',
            rememberMe: true
          });
          this.isLoading = false;
        }
      );
  }
}
