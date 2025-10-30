// Imports
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { APPSHARED } from '../app-setting';

// Additional questions dialog component
@Component({
  selector: 'additional-questions-dialog',
  template: `
    <h2 class="mat-title">{{ dialogData.heading }}</h2>
    <h3 class="mat-subheading-2 text-secondary">
      {{ dialogData.subHeading | utcToLocal }}
    </h3>
    <mat-divider></mat-divider>
    <mat-dialog-content>
      <div
        class="push-top"
        *ngFor="let question of dialogData.additionalQuestions"
      >
        <h3 class="mat-subheading-2" *ngIf="question.heading">
          {{ question.heading }}
        </h3>
        <h4 class="mat-subheading-1" *ngIf="question.subHeading">
          {{ question.subHeading }}
        </h4>
        <p class="push-top" *ngIf="question.type === 0">
          {{ question.textInput }}
        </p>
        <div
          class="push-top"
          *ngIf="question.type === 2 || question.type === 1"
        >
          <div *ngFor="let option of question.options">
            <i
              class="fa"
              [ngClass]="[
                isOptionSelected(
                  option,
                  question.type == 1
                    ? [question.singleSelectionValue]
                    : question.multipleSelectionValue
                )
                  ? 'fa-check-square-o'
                  : 'fa-square-o'
              ]"
            ></i
            >&nbsp;&nbsp;
            <span>{{ option }}</span>
          </div>
        </div>

        <mat-divider class="push-top"></mat-divider>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions layout="row" layout-align="end center">
      <button mat-button mat-dialog-close>
        {{ 'GENERAL.CLOSE' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class AdditionalQuestionsDialogComponent implements OnInit {
  // Component properties

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<AdditionalQuestionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {}

  // Is option selected
  isOptionSelected(option: string, options: Array<any>) {
    return options.indexOf(option) !== -1;
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }
}
