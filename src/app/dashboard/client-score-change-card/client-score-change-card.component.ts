// Imports
import { Component, OnInit, OnChanges, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-client-score-change-card',
  templateUrl: './client-score-change-card.component.html',
  styleUrls: ['./client-score-change-card.component.scss'],
  providers: []
})
export class ClientScoreChangeCardComponent
  implements OnInit, OnChanges, AfterViewInit {

  mode: string = 'improving';
  @Input() data: any = {};

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
