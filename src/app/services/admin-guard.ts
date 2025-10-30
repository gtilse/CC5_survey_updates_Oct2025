import { CanActivate, Router } from "@angular/router";
import { Injectable } from '@angular/core';
import { AppStateService } from './app-state.service';

@Injectable()
export class AdminGuard implements CanActivate {

  constructor(private appStateService: AppStateService,private router: Router){

  }

  canActivate() {

    if(this.appStateService.loggedUser.accessLevel === 1)
      return true;
    else {
      this.router.navigate(["/auth"]);
      return false;
    }
  }
}
