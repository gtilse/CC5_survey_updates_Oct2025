/**
 * Wraps the application
 * Child modules are loaded within the wrapper via lazy loading mechanism
 */

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../services/app-state.service';

// App wrapper component
@Component({
  selector: 'app-wrapper',
  template: ` <router-outlet></router-outlet> `,

  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class AppWrapperComponent implements OnInit, AfterViewInit {
  // Component constructor
  constructor(
    private http: HttpClient,
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appStateService: AppStateService
  ) {}

  // Component init
  ngOnInit() {
    // Set the default language to english
    this.translate.setDefaultLang('en');
    // Get the app configuration json
    this.http.get('./assets/config.json').subscribe((json) => {
      this.appStateService.appConfig = json;
    });
  }

  // After view init
  // Check if user is logged in, automatically redirect to app
  ngAfterViewInit() {
    const pathName = window.location.pathname || '/';

    // Redirect to auth module if user is not logged in
    if (
      (pathName === '/' || /^\/app/i.test(pathName)) &&
      this.appStateService.isUserLoggedIn === false
    ) {
      this.router.navigate(['/auth']);
    } else if (
      pathName === '/' &&
      this.appStateService.isUserLoggedIn === true
    ) {
      this.router.navigate(['/app']);
    } else {
      // Route as normal
    }
  }
}
