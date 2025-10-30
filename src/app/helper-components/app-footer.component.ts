import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-footer',
  template: `
    <footer fxLayout="column" fxLayout.gt-sm="row">
      <app-copyright-footer></app-copyright-footer>
      <div style="flex:1 1 auto;"></div>
      <span
        class="text-muted"
        [innerHTML]="'FOOTER.VERSION' | translate"
      ></span>
    </footer>
  `
})
export class AppFooterComponent implements OnInit {
  constructor(
    public appStateService: AppStateService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {}
}
