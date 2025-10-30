/**
 * Wrapper module
 * @description
 * Wrapper module for the entire application
 * - Loads the auth and app modules as child
 */

// Angular core modules
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  HttpClientModule,
  HttpClient,
  HTTP_INTERCEPTORS
} from '@angular/common/http';

// Other third party modules
import { QuillModule } from 'ngx-quill';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable, throwError } from 'rxjs';

// App related services
import { TokenInterceptor } from '../services/token.interceptor';
import { APPSHARED } from '../app-setting';
import { AppWrapperComponent } from './app-wrapper.component';

import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';

import { LoggedUserGuard } from '../services/logged-user-guard';
import { AdminGuard } from '../services/admin-guard';
import { ILoggedUser } from '../models/data-model';

// Routes
// -- The app is split into APP and AUTH modules which are lazy loaded
const routes: Routes = [
  {
    path: 'app',
    canActivate: [LoggedUserGuard],
    loadChildren: () => import('./app.module').then((m) => m.AppModule)
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth.module').then((m) => m.AuthModule)
  },

  {
    path: '',
    component: AppWrapperComponent
  }
];

// HTTP Loader Factory - for ngxTranslate
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// Module decorator
@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
        QuillModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })
    ],
    providers: [
        // Intercepting HTTP requests
        // Adds json token to each request
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
        // App state
        AppStateService,
        // App data services
        AppDataService,
        // Routing guards
        LoggedUserGuard,
        AdminGuard
    ],
    declarations: [
        // App wrapper component
        // added to the DOM as <app-wrapper>
        AppWrapperComponent
    ]
})

/**
 * Wrapper module for the application
 * Application level services are provided by this module
 */
export class AppWrapperModule {
  // Constructor functions
  constructor(
    private appStateService: AppStateService,
    private appDataService: AppDataService
  ) {}

  // Bootstrap
  ngDoBootstrap(app: any) {
    // Add the component element to body
    const componentElement = document.createElement('app-wrapper');
    document.body.appendChild(componentElement);

    // Bootstrap the app
    setTimeout(() => {
      // Check application state
      ((): Observable<any> => {
        const pathName = window.location.pathname;

        // if (window.location.pathname === '/' || window.location.pathname.indexOf('/auth') !== -1) {
        //   return throwError(false);
        // }

        // If pathname begins with auth, skip loggedin checks
        if (/^\/Auth/i.test(pathName)) {
          return throwError(false);
        }

        // Check for local storage object
        const loggedUser = this.appDataService.getLocalStorage(
          APPSHARED.LOCAL_STORAGE_KEY
        );
        if (!loggedUser) {
          return throwError(false);
        }

        // Verify user and token
        return this.appDataService.verifyLoggedUser(
          loggedUser.objectId,
          loggedUser.token
        );
      })().subscribe(
        (res) => {
          this.appStateService.isUserLoggedIn = true;
          this.appStateService.loggedUser = <ILoggedUser>res;
          this.appDataService.setLocalStorage(APPSHARED.LOCAL_STORAGE_KEY, res);

          // Bootstrap the application
          app.bootstrap(AppWrapperComponent);
        },
        (err) => {
          // Bootstrap the application anyways
          // Clear local storage
          this.appDataService.clearLocalStorage();
          app.bootstrap(AppWrapperComponent);
        }
      );
    }, 3000);
  }
}
