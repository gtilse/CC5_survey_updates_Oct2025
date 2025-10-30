/**
    Interceptor for HTTP requests
    Adds auth header with the JSON Web token for all requests going out of the app
*/

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { AppStateService } from './app-state.service';
import { Observable } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(public appStateService: AppStateService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (this.appStateService.loggedUser && this.appStateService.loggedUser.token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.appStateService.loggedUser.token}`
        }
      });
    }

    return next.handle(request);
  }
}
