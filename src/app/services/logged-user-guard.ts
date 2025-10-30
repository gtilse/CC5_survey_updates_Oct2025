import { CanActivate, Router } from "@angular/router";
import { Injectable } from '@angular/core';
import { AppStateService } from './app-state.service';

@Injectable()
export class LoggedUserGuard implements CanActivate {

  constructor(private appStateService: AppStateService,private router: Router){

  }

  canActivate() {

    if(this.appStateService.isUserLoggedIn)
      return true;
    else {
      //console.log("guard failed....redirect to login")
      this.router.navigate(["/auth"]);
      return false;
    }
  }
}
