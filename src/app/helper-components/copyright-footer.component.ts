/*
 * Copyright component
 * Displays copyright message and terms/privacy in footer
 */

import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-copyright-footer',
  template: `
    <span
      class="text-muted push-right-md"
      [innerHTML]="'FOOTER.COPYRIGHT' | translate"
    ></span>
    <a
      class="push-right-md"
      href="{{ appStateService.appConfig.company.termsConditions }}"
      target="_blank"
      fxHide
      >{{ 'FOOTER.TERMS_CONDITIONS' | translate }}</a
    >
    <a
      class=""
      href="{{ appStateService.appConfig.company.privacyPolicy }}"
      target="_blank"
      fxHide
      >{{ 'FOOTER.PRIVACY_POLICY' | translate }}</a
    >
  `
})
export class CopyrightFooterComponent implements OnInit {
  constructor(public appStateService: AppStateService) {}

  ngOnInit() {}
}
