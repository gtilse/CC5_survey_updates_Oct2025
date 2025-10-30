import { Injectable } from '@angular/core';
import * as _ from 'lodash';

@Injectable()
export class RecordSelectService {

  records: Array<any> = [];
  allRecordsSelected: boolean = false;

  constructor() { }

  // Set all records to un-checked
  resetSelectedRecords(data:Array<any>){
    this.records = data.map(o=>{
      return {"objectId": o.objectId,"checked":false}
    });

    this.allRecordsSelected = false;
  }

  // Check/uncheck one or all
  toggleRecordSelection(checked,index){
    if(index == -1) { //select/unselect all
      _.forEach(this.records,function(value){
        value.checked = checked;
      });

      this.allRecordsSelected = checked;
    } else {
      let allRecordsSelected = true;

      this.records[index].checked = checked;
      _.forEach(this.records,function(value){
        if(value.checked == false) allRecordsSelected = false;
      });

      this.allRecordsSelected = allRecordsSelected;
    }
  }

  // Check if any records selected
  selectedRecordsCount(){
    let selectedRecordsCount: number = 0;
    if(!this.records.length) return selectedRecordsCount;
    _.forEach(this.records,function(value){
      if(value.checked) selectedRecordsCount+=1;
    });
    return selectedRecordsCount;
  }

}
