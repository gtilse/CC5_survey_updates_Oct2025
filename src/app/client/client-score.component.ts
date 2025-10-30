import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppDataService } from '../services/app-data.service';
import { IClientScore } from '../models/data-model';
import { isNgTemplate } from '@angular/compiler';

interface IClientScoreEdit extends IClientScore  {
  showDelete: boolean;
}

@Component({
  selector: 'app-client-score',
  templateUrl: './client-score.component.html',
  styleUrls: ['./client-score.component.scss'],
  providers: [AppComponentStateService]
})
export class ClientScoreComponent implements OnInit {
  // Component properties
  scores: Array<IClientScoreEdit> = [];
  isDeleting = false;

  // Component Constructor
  constructor(
    public appComponentStateService: AppComponentStateService,
    private appDataService: AppDataService,
    public dialogRef: MatDialogRef<ClientScoreComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {}

  // Component init
  ngOnInit() {

    this.appComponentStateService.isLoading = true;
    this.appDataService
      .getScoresForClient(this.dialogData.objectId)
      .subscribe((results) => {
        this.appComponentStateService.isLoading = false;
        this.scores = results.map((item:IClientScore) => {
          return { ...item, showDelete: false }
        });
      });
  }

  // Delete score
  deleteScore(row: IClientScoreEdit) {
    this.isDeleting = true;
    this.appDataService.deleteScoreForClient(row.surveyLogId).subscribe(res => {
      this.scores = this.scores.filter(function(el) { return el.surveyLogId != row.surveyLogId; });
      this.isDeleting = false;
    });
  }

  // Close modal
  closeModal() {
    this.dialogRef.close();
  }
}
