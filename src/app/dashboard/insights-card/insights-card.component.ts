// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import {Sort} from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { AppDataService } from '../../services/app-data.service';


@Component({
  selector: 'app-insights-card',
  templateUrl: './insights-card.component.html',
  styleUrls: ['./insights-card.component.scss'],
  providers: []
})
export class InsightsCardComponent implements OnInit, OnChanges, AfterViewInit {
  
  mode: string = 'team';
  @Input() results: Array<any> = [];
  @Input() isLoading = false;
  @Output() groupChange: EventEmitter<any> = new EventEmitter();
  sortedData: Array<any> = [];
  customCategories: Array<any> = [];

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService,
    private appData: AppDataService
  ) {
    
  }

  // Component init
  ngOnInit() {
    this.appData.getDropListCustomCategories().subscribe(res => {
      this.customCategories = res;
    })
  }

  // Selection change
  changeMode() {
    this.groupChange.emit(this.mode); 
  }

  // On changes
  ngOnChanges() {
    this.sortedData = this.results.slice();
  }

  // After view init
  ngAfterViewInit() {
    this.changeMode();
  }

  sortData(sort: Sort) {
    
    const data = this.results.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'group': return compare(a.groupCol, b.groupCol, isAsc);
        case 'lastNPS': return compare(a.lastNPS, b.lastNPS, isAsc);
        case 'lastResponseRate': return compare(a.lastResponseRate, b.lastResponseRate, isAsc);
        case 'date': return compare(a.lastSurveyDate, b.lastSurveyDate, isAsc);
        case 'consolidatedNPS': return compare(a.consolidatedNPS, b.consolidatedNPS, isAsc);
        case 'consolidatedResponseRate': return compare(a.consolidatedResponseRate, b.consolidatedResponseRate, isAsc);
        default: return 0;
      }
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}


