// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss'],
  providers: []
})
export class SummaryCardComponent implements OnInit, OnChanges, AfterViewInit {
  
  mode: string = 'program';
  @Input() data: any;

  // Component constrcutor
  constructor(
    private router: Router,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  changeMode() {}

  ngOnChanges() {}

  ngAfterViewInit() {
    this.changeMode();
  }

  onResized() {}
}
