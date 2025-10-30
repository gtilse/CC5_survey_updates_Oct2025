import { Injectable } from '@angular/core';
import * as _ from 'lodash';

import { ILoggedUser, IDropList } from '../models/data-model';

@Injectable()
export class AppStateService {

  trialMode: number = 0;
  isUserLoggedIn: boolean = false;
  loggedUser: ILoggedUser;
  appConfig: any;
  pendingActionItemsCount: number = 0;

  public clientList: any;
  public staffList: any;

  constructor() {
  }

  // Filter drop list by category param
  getDropListByCategory(dropLists: Array<IDropList>, filter: string): Array<IDropList> {
    let returnArr: Array<IDropList> = [];
    _.forEach(dropLists,function(value){
      if(value.category === filter)
        returnArr.push(value);
    });
    return returnArr;
  }

}
