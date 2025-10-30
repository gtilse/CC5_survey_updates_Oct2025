import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentStateService } from '../services/app-component-state.service';
import { AppDataService } from '../services/app-data.service';
import { IEmployeeInfo } from '../models/data-model';
import { APPSHARED } from '../app-setting';

@Component({
  selector: 'app-employee-info',
  templateUrl: './employee-info.component.html',
  providers: [AppComponentStateService]
})
export class EmployeeInfoDialogComponent implements OnInit {
  // Component properties
  public employeeInfo = <IEmployeeInfo>{};

  public surveys: Array<any> = [];

  public emailStatusDesc = APPSHARED.EMAIL_STATUS;

  public nps: number = null;

  public clientScore: number = null;

  // Component Constructor
  constructor(
    public appComponentStateService: AppComponentStateService,
    private appDataService: AppDataService,
    public dialogRef: MatDialogRef<EmployeeInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {}

  // Component init
  ngOnInit() {
    this.appComponentStateService.isLoading = true;
    this.appDataService
      .getEmployeeInfo(this.dialogData.employeeId)
      .subscribe((res: any) => {
        this.appComponentStateService.isLoading = false;
        this.employeeInfo = res.employeeInfo;
        this.surveys = res.surveys;
        // Calculate NPS and Client score for staff member
        [this.nps, this.clientScore] = APPSHARED.calculateScoresFromResponses(
          this.surveys
        );
      });
  }

  // Filtered list of surveys
  public filteredSurveys(displayNonResponders: boolean) {
    return this.surveys.filter((o) =>
      displayNonResponders ? true : typeof o.score === 'number'
    );
  }

  // Close modal
  closeModal() {
    this.dialogRef.close();
  }
}
