// Component imports
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';

// New account registration component
@Component({
  selector: 'app-register-account',
  templateUrl: './register.component.html',
  providers: [AppComponentStateService]
})
export class RegisterComponent implements OnInit {
  // Component properties
  registerForm: FormGroup;

  isLoading = false;

  appLogo: string = APPSHARED.APP_LOGO;

  // Component constructor
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private translateService: TranslateService,
    public appStateService: AppStateService,
    private appDataService: AppDataService,
    public appComponentStateService: AppComponentStateService,
    private appNotificationService: AppNotificationService
  ) {}

  // Component OnInit
  ngOnInit() {
    this.createForm();
  }

  // Convenience method to get form controls
  get f() {
    return this.registerForm.controls;
  }

  // Create the form
  createForm() {
    this.registerForm = this.fb.group({
      companyName: [null, Validators.required],
      primaryContact: [null, Validators.required],
      email: [null, [Validators.required]],
      username: [null, [Validators.required, Validators.minLength(3)]],
      password: [
        null,
        [Validators.required, Validators.minLength(6), Validators.maxLength(10)]
      ],
      passwordAgain: [
        null,
        [Validators.required, Validators.minLength(6), Validators.maxLength(10)]
      ]
    });
  }

  // Create new account
  createAccount() {
    this.isLoading = true;
    this.appDataService.createOrganisation(this.registerForm.value).subscribe(
      (data) => {
        this.appNotificationService.showSnackBar(
          'LOGIN.REGISTER_ACCOUNT_SUCCESS_NOTIFICATION',
          5000,
          'success'
        );
        this.router.navigate(['/auth/login']);
        this.isLoading = false;
      },
      (error) => {
        this.appNotificationService.showSnackBar(
          'LOGIN.REGISTER_ACCOUNT_ERROR',
          5000,
          'error'
        );
        this.isLoading = false;
      }
    );
  }
}
