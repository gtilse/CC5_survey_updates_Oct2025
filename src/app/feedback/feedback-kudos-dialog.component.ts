// Angular
import { Component, OnInit, Inject, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

import {FormControl} from '@angular/forms';
import {MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

// Translate
import { TranslateService } from '@ngx-translate/core';
// App imports
import { AppDataService } from '../services/app-data.service';
import { AppStateService } from '../services/app-state.service';
import { AppNotificationService } from '../services/app-notification.service';

// Const
const TEAM_PLACEHOLDER = 'Kudos to {{client contact}} and team for great work for this client. Well done!';
const CLIENT_PLACEHOLDER = 'Dear {{client}}\n\nThank you very much for participating in our recent client survey. It is very important to us to make sure that we are doing a good job. I’m glad to hear that you have been satisfied with our service.';
const CLIENT_PLACEHOLDER_NEUTRAL = 'Dear {{client}}\n\nThank you very much for participating in our recent client survey. We have noted your feedback and the potential for us to improve our service for you. We’ll do our best to improve. Please don’t hesitate to get in touch at any stage if you wish to discuss this further.';
const CLIENT_PLACEHOLDER_DETRACTOR = 'Dear {{client}}\n\nThank you very much for participating in our recent client survey. We are sorry to hear that our service has not met your expectations. We would love the opportunity to discuss this further with you. Please let me know when might suit you to catch-up and discuss how we can do better.';

// Dialog component
@Component({
  selector: 'app-feedback-kudos-dialog',
  templateUrl: './feedback-kudos-dialog.component.html',
  styleUrls: ['./feedback-kudos-dialog.component.scss']
})
export class FeedbackKudosDialogComponent implements OnInit {

  // Properties
  staffList: Array<any> = [];
  staffs: Array<any> = [];
  comments = '';
  isProcessing = false;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  staffCtrl = new FormControl();
  filteredStaffs: Observable<any[]>;
  @ViewChild('staffInput') staffInput: ElementRef<HTMLInputElement>;
  @ViewChild('staffInput', { read: MatAutocompleteTrigger }) 
  autoComplete: MatAutocompleteTrigger;
  department = '';

  // Constructor
  constructor(
    public dialogRef: MatDialogRef<FeedbackKudosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { type: 'CLIENT' | 'TEAM', obj: any },
    private translateService: TranslateService,
    private appDataService: AppDataService,
    private appNotificationService: AppNotificationService,
    private appStateService: AppStateService
  ) { }

  // Component init
  ngOnInit(): void {

    //console.log(this.dialogData.obj)
    
    // Set placeholder
    if(this.dialogData.type === 'CLIENT') {
      this.comments = this.dialogData.obj.score >=9 ? CLIENT_PLACEHOLDER : (this.dialogData.obj.score >= 7 ? CLIENT_PLACEHOLDER_NEUTRAL : CLIENT_PLACEHOLDER_DETRACTOR);
      this.comments = this.comments.replace('{{client}}', this.dialogData.obj.name);
    } else {
      this.comments = TEAM_PLACEHOLDER;
      this.comments = this.comments.replace('{{client contact}}', this.dialogData.obj.drlName);
    }

    // Get the staffs list
    this.isProcessing = true;
    this.appDataService.getFilters().subscribe((res) => {

      // Remove inactive staff
      res.staff = res.staff.filter(s => s.active==="1" || s.active === 1);
      const selectedStaff = res.staff.find(s => s.objectId === this.dialogData.obj.drlId);
      selectedStaff && (this.department = selectedStaff.department);


      // Get the drl team
      this.appDataService.getDescendantsForUser(this.dialogData.obj.drlId)
          .subscribe(resTeam => {
            this.isProcessing = false;
            res.staff = res.staff.map(i => {
              return { ...i, teamMember: false }
            });

            res.staff.forEach(member => {
              const found = resTeam.find(i => i.objectId === member.objectId);
              if(found && found.objectId !== this.dialogData.obj.drlId) {
                member.teamMember = true;
                
              }
            });

            this.staffList = res.staff;
            // Staff filter
            this.filteredStaffs = this.staffCtrl.valueChanges.pipe(
              startWith(null),
              map((staff: string | null) => {
                return staff ? this._filter(staff) : this.staffList.slice()
              }),
            );
            
            // Add the drl
            if(this.dialogData.type === 'TEAM') {
              this.staffs.push(this.staffList.find(i => i.objectId === this.dialogData.obj.drlId));
            }
          });

      
    });


  }

  // Send kudos
  sendKudos() {

    const kudos = this.dialogData.obj.kudos;

    if(!kudos.kudos) kudos.kudos = [];
    if(!kudos.thanks) kudos.thanks = [];

    const params: any = {
      objectId: this.dialogData.obj.objectId,
      toEmails: [],
      comment: this.comments,
      client: { score: this.dialogData.obj.score, name: this.dialogData.obj.name, email: this.dialogData.obj.email, comments: this.dialogData.obj.comments, receivedOnDate: this.dialogData.obj.receivedOnDate }
    }

    if(this.dialogData.type === 'CLIENT') {
      params.toEmails = [ { name: this.dialogData.obj.name, email: this.dialogData.obj.email }];
      params.kudos = kudos;
      params.kudos.thanks.push({
        fromDrlId: this.appStateService.loggedUser.objectId,
        fromDrlName: this.appStateService.loggedUser.firstName + ' ' + this.appStateService.loggedUser.lastName,
        message: this.comments,
        date: new Date().toISOString(),
        to: [{
          objectId: this.dialogData.obj.clientId,
          name: this.dialogData.obj.name
        }]
      });
    } else {
      params.toEmails = this.staffs.map(s => {
        return { name: s.fullName, email: s.email }
      });

      params.kudos = kudos;

      params.kudos.kudos.push({
        fromDrlId: this.appStateService.loggedUser.objectId,
        fromDrlName: this.appStateService.loggedUser.firstName + ' ' + this.appStateService.loggedUser.lastName,
        message: this.comments,
        date: new Date().toISOString(),
        to: this.staffs.map(s => {
          return { objectId: s.objectId, name: s.fullName }
        })
      });
    }

    this.isProcessing = true;
    this.appDataService.sendKudos(params).subscribe(
      () => {
        this.isProcessing = false;
        this.appNotificationService.showSnackBar(
          'GENERAL.EMAIL_SUCCESS',
          2000
        );
        
        this.dialogRef.close();
      },
      () => {
        this.isProcessing = false;
        this.appNotificationService.showSnackBar(
          'GENERAL.EMAIL_ERROR',
          2000,
          'error'
        );
      }
    );
  }

  // Close dialog
  close() {
    this.dialogRef.close();
  }

  //#region Chip list handling

  private _filter(value: string): any[] {
    return this.staffList.filter(staff => staff.fullName.toLowerCase().includes(value?.toLowerCase()));
  }

  add(event: MatChipInputEvent): void {

    return;
    const value = event.value;

    // Add our fruit
    if (value) {
      this.staffs.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.staffCtrl.setValue(null);
    console.log(this.staffs)
  }

  remove(staff: any): void {
    const index = this.staffs.indexOf(staff);

    if (index >= 0) {
      this.staffs.splice(index, 1);
    }

  }

  addClearStaff(type: 'ADD' | 'CLEAR' | 'TEAM' | 'DEPARTMENT') {
    if(type === 'ADD') {
      this.staffs = [ ...this.staffList];
      this.autoComplete.closePanel();
    }
    
    else if(type === 'TEAM') {
      this.staffs = [this.staffList.find(i => i.objectId === this.dialogData.obj.drlId)];
      const team = this.staffList.filter(i => i.teamMember === true);
      if(team.length) {
        team.forEach(element => {
          if(!this.staffs.find(o => o.email.toLowerCase() === element.email.toLowerCase())) {
            this.staffs.push(element);
          }
        });
      }
      //team.length && (this.staffs = [...this.staffs, ...team]);
      this.autoComplete.closePanel();
    } else if(type === 'DEPARTMENT')  {
      
      if(!this.department) return;
      const dept = this.staffList.filter(i => i.department === this.department);
      if(dept.length) {
        dept.forEach(element => {
          if(!this.staffs.find(o => o.email.toLowerCase() === element.email.toLowerCase())) {
            this.staffs.push(element);
          }
        });
      }
      
      this.autoComplete.closePanel();
    }
    
    else {
      this.staffs = [];
    }

  }

  selected(event: MatAutocompleteSelectedEvent): void {
    
    this.staffs.push(this.staffList.find(i => i.fullName === event.option.value));
    this.staffInput.nativeElement.value = '';
    this.staffCtrl.setValue(null);
    
  }

  //#endregion

}
