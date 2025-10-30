/**
 * Auth component wrapper
 * @description
 * Wrapper for sub components of the auth module
 * Components such as login, registration are loaded within this component
 */

import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { routerTransition } from '../animations/router.animation';

@Component({
  selector: 'app-auth',
  animations: [routerTransition],
  template: `
    <div class="top-toolbar" fxLayout="row" fxLayoutAlign="start center">
      <img
        src="../assets/images/app-logo-white.png"
        alt="App Logo"
        class="app-logo"
      />
    </div>
    <div class="top-header">
      <h1 class="mat-headline">{{ 'LOGIN.TOP_HEADER' | translate }}</h1>
    </div>

    <div [@routerTransition]="getState(o)">
      <router-outlet #o="outlet">
        <!-- Auth components added here -->
      </router-outlet>
    </div>

    <footer>
      <app-copyright-footer></app-copyright-footer>
      <div style="flex:1 1 auto;"></div>
      <span
        class="text-muted"
        [innerHTML]="'FOOTER.VERSION' | translate"
      ></span>
    </footer>
  `,
  styles: [
    `
      :host {
        min-height: 100%;
        display: block;
      }
    `
  ]
})
export class AuthComponent implements OnInit {
  constructor(
    public appStateService: AppStateService,
    public appDataService: AppDataService
  ) {}

  ngOnInit() {
    // Remove the loading image
    const elem = document.getElementById('img-app-loading');
    if (elem) {
      elem.parentNode.removeChild(elem);
    }
  }

  // Get activated route state
  getState(outlet: any) {
    return outlet.activatedRouteData.state;
  }
}
