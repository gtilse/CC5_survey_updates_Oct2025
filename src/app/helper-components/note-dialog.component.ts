// Imports
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

// Note dialog component
@Component({
  selector: 'app-note-dialog',
  template: `
    <h2 mat-dialog-title>{{ dialogTitle }}</h2>
    <mat-dialog-content>
      <mat-form-field
        class="full-width"
        hintLabel="{{ 'NOTE_DIALOG.MAX_2000' | translate }}"
      >
        <textarea
          matInput
          maxlength="2000"
          matTextareaAutosize
          matAutosizeMinRows="1"
          matAutosizeMaxRows="5"
          [(ngModel)]="note"
        >
        </textarea>
        <mat-hint align="end">{{ note?.length || 0 }}/2000</mat-hint>
      </mat-form-field>

      <mat-checkbox class="push-top-sm" [(ngModel)]="addToFollowup" *ngIf="dialogData.addFollowup">
        Count as follow-up
      </mat-checkbox>

    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close [disabled]="isProcessing">
        {{ 'GENERAL.CANCEL' | translate }}
      </button>
      <button
        mat-button
        color="primary"
        (click)="saveData()"
        [disabled]="isProcessing || !note"
      >
        {{ 'GENERAL.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class NoteDialogComponent implements OnInit {
  // Component properties
  dialogTitle: string = null;
  isProcessing: boolean = false;
  onSave = new EventEmitter<any>();
  note: string = null;
  addToFollowup = true;

  // Component constructor
  constructor(
    public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private translateService: TranslateService
  ) {}

  // Component init
  ngOnInit() {
    this.note = this.dialogData.note ? this.dialogData.note : null;
    this.translateService.get(this.dialogData.heading).subscribe((text) => {
      this.dialogTitle = text;
    });
  }

  // Emit event when Yes is clicked
  saveData() {

    const response = this.dialogData.addFollowup ? { note: this.note, addToFollowup: this.addToFollowup } : this.note;
    this.onSave.emit(response);
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }
}
