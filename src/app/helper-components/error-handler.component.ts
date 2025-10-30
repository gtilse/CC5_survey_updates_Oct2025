import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Error handler component
@Component({
  selector: 'app-error-handler',
  styles: [
    `
      :host {
        display: block;
        padding: 16px;
      }
    `
  ],
  template: `
    <div layout="row" layout-align="start center">
      <mat-icon class="app-warn-fg md-48">error_outline</mat-icon>
      <span class="text-secondary push-left">{{
        'GENERAL.DATA_FETCH_ERROR' | translate
      }}</span>
    </div>

    <button
      type="button"
      color="primary"
      class="push-top"
      mat-raised-button
      (click)="refreshData()"
    >
      {{ 'GENERAL.TRY_AGAIN' | translate }}
    </button>
  `
})
export class ErrorHandlerComponent implements OnInit {
  // Component properties
  @Output() refresh = new EventEmitter();

  // Component constructor
  constructor(private translateService: TranslateService) {}

  // Component init
  ngOnInit() {}

  // Refresh
  refreshData() {
    this.refresh.emit();
  }
}
