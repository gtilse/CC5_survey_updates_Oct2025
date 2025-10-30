// Component imports

// Angular
import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatRadioChange } from '@angular/material/radio';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

// Application
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../services/app-state.service';
import { AppDataService } from '../services/app-data.service';
import { AppComponentStateService } from '../services/app-component-state.service';
import { APPSHARED as AppSetting } from '../app-setting';
import { AppNotificationService } from '../services/app-notification.service';
import { ISurvey, IDropList, IEmployeesLocationsSelectList, IStaffSelectList } from '../models/data-model';

// Other libs
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import {ENTER, COMMA} from '@angular/cdk/keycodes';
import { QuillEditorComponent } from 'ngx-quill'

// Survey edit component
@Component({
  selector: 'app-survey-edit',
  templateUrl: './survey-edit.component.html',
  styleUrls: ['./survey-edit.component.scss'],
  providers: [AppComponentStateService]
})
export class SurveyEditComponent implements OnInit {

    //#region Component
    // Class properties
    survey: ISurvey;
    surveyForm: FormGroup;
    toolbarConfig: any = AppSetting.EMAIL_CONTENT_EDITOR_CONFIG;
    clientValuations: Array<string> = AppSetting.CLIENT_VALUATIONS;
    reminderDaysSelectList: Array<number> = AppSetting.reminderDaysSelectionList();
    monthsSelectionList: Array<number> = AppSetting.monthsSelectionList();
    activeTabIndex:number = 0;
    customDropListCategories: Array<any> = [];

    @ViewChild('surveyHtmlEditor') surveyHtmlEditor: QuillEditorComponent;
    @ViewChild('reminderHtmlEditor') reminderHtmlEditor: QuillEditorComponent;

    @Input() staffSelectList: Array<IStaffSelectList> = [];
    @Input() dropLists: Array<IDropList> = [];

    @Output() recordSaved: EventEmitter<any> = new EventEmitter();
    @Output() recordSaveCancelled: EventEmitter<any> = new EventEmitter();

    separatorKeysCodes = [ENTER, COMMA];
    quillModules: any = {
        "toolbar": [
        ['bold', 'italic', 'underline'],
        [{ 'header': 1 }, { 'header': 2 }]
        ]
    }

    // Component constructor
    constructor(
        private fb:FormBuilder,
        private translateService: TranslateService,
        public appStateService: AppStateService,
        private appDataService: AppDataService,
        public appComponentStateService: AppComponentStateService,
        private dialog: MatDialog,
        private appNotificationService: AppNotificationService
    ) {

    }

    // Component init
    ngOnInit() {
        this.createForm();

        // Get the custom categories
        this.appDataService.getDropListCustomCategories().subscribe(res => {
            res.forEach(item => {
            this.customDropListCategories.push({ VALUE: item, DESC: item});
            })
        });

        this.surveyForm.get('customClientCategory1').valueChanges
            .subscribe(value => {
                if(value) {
                this.surveyForm.get('customClientCategory1Desc').setValidators(Validators.required)
                } else {
                this.surveyForm.get('customClientCategory1Desc').clearValidators();
                }

                this.surveyForm.get('customClientCategory1Desc').updateValueAndValidity();
            });
    }

    //#endregion Component

    //#region Survey form
    // Create form
    createForm(){
        this.surveyForm = this.fb.group({
        objectId: null,
        vendorId: null,
        active: null,
        type: null,
        description: [null,Validators.required],
        surveyHtml: ["", Validators.required],
        reminderHtml: ["", Validators.required],
        emailFrom: null,
        emailSubject: [null,Validators.required],
        emailSubjectReminder: [null,Validators.required],
        frequency: null,
        splitSend: null,
        addLogo: null,
        newClientsOnly: null,
        reminderDays: null,
        includeDRLS: null,
        includeCategories: null,
        additionalQuestions: this.fb.array([]),
        loyaltyDrivers: this.fb.array([]),
        clientSurveyMonthsLimit: 0,
        excludeEmployees: null,
        createdAt: null,
        updatedAt: null,
        addHowToImproveQuestion: 0,
        addHowToImproveQuestion2: 0,
        howToImproveQuestionText: null,
        howToImproveQuestion2Text: null,
        customClientCategory1: null,
        customClientCategory1Desc: null,
        tags: [],
        scoreLeftLabel: null,
        scoreRightLabel: null,
        });
    }

    // Reset form
    resetForm(survey?: ISurvey){

        this.activeTabIndex = 0;
        
        if(survey) {

            this.surveyForm.reset(survey);

            // set values of additional questions array
            this.surveyForm.setControl("additionalQuestions",this.fb.array([]));
            this.surveyForm.setControl("loyaltyDrivers",this.fb.array([]));

            _.forEach(survey.additionalQuestions,(question:any,index)=>{
                (<FormArray>this.surveyForm.get("additionalQuestions")).push(this.createAddtionalQuestion(question));

                _.forEach(question.options, option => {
                const optionsArr = (<FormArray>this.surveyForm.controls["additionalQuestions"]).controls[index]["controls"].options as FormArray;
                optionsArr.push(this.fb.control(option));
                })
            })

            _.forEach(survey.loyaltyDrivers,(value: string)=>{
                (<FormArray>this.surveyForm.get("loyaltyDrivers")).push(this.createLoyaltyDriver(value));
            })

            if(survey.customization) {
                const customization = survey.customization;
                this.surveyForm.patchValue({
                    scoreLeftLabel: customization.leftScoreLabel,
                    scoreRightLabel: customization.rightScoreLabel
                });
            }

        }

        else {
            this.surveyForm.reset();
            this.surveyForm.setControl("additionalQuestions",this.fb.array([]));
            this.surveyForm.setControl("loyaltyDrivers",this.fb.array([]));

        }


    }

    // Loyalty Driver
    createLoyaltyDriver(value: string = ''): FormGroup {
        return this.fb.group({
            heading: [value || null, Validators.required]
        });
    }

    addLoyaltyDriver(){
        (<FormArray>this.surveyForm.get("loyaltyDrivers")).push(this.createLoyaltyDriver());

    }

    removeLoyaltyDriver(index: number) {
        (<FormArray>this.surveyForm.get("loyaltyDrivers")).removeAt(index);
    }

    // Create additional question
    createAddtionalQuestion(question:any={}): FormGroup {

        return this.fb.group({
        heading: [question.heading || null,Validators.required],
        subHeading: question.subHeading || null,
        type: question.type==null ? 0 : question.type,
        options: this.fb.array([])

        })
    }

    // Add additional question
    addAdditionalQuestion(){
        (<FormArray>this.surveyForm.get("additionalQuestions")).push(this.createAddtionalQuestion());

    }

    // Remove additional question
    removeAdditionalQuestion(index: number){
        (<FormArray>this.surveyForm.get("additionalQuestions")).removeAt(index);
    }

    // Add question option
    addQuestionOption(index:number,event: MatChipInputEvent): void {
        let input = event.input;
        let value = event.value;

        if ((value || '').trim()) {

        const optionsArr = (<FormArray>this.surveyForm.controls["additionalQuestions"]).controls[index]["controls"].options as FormArray;
        optionsArr.push(this.fb.control(value.trim()));

        }

        // Reset the input value
        if (input) {
        input.value = '';
        }
    }

    // Remove question option
    removeQuestionOption(index,optionIndex){
        const optionsArr = (<FormArray>this.surveyForm.controls["additionalQuestions"]).controls[index]["controls"].options as FormArray;
        optionsArr.removeAt(optionIndex);
    }

    // Set the underlying value for checkbox
    checkboxToggle(name: string){
        let o = {};
        o[name] = 1 - this.surveyForm.controls[name].value;
        this.surveyForm.patchValue(o);
    }

    getCustomAttributeValues(val: any) {
        return this.dropLists.filter(elem => {
          return elem.category === val;
          
        })
    }

    //#endregion

    //#region Form actions

    // Add new
    addRecord(vendorId: string){
        this.resetForm();
        this.surveyForm.patchValue({
        objectId: "0",
        vendorId: vendorId,
        active: AppSetting.RECORD_STATE.ACTIVE.VALUE,
        type: AppSetting.SURVEY_TYPE.CLIENT.VALUE,
        emailSubject: AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT,
        emailSubjectReminder: AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT,
        surveyHtml: AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT,
        reminderHtml: AppSetting.SURVEY_DEFAULTS.REMINDER_TEXT,
        frequency: 0,
        splitSend: 0,
        addLogo: 1,
        newClientsOnly: 1,
        reminderDays: 7,
        includeDRLS: [],
        includeCategories: [],
        excludeEmployees: [],
        addHowToImproveQuestion: 0,
        addHowToImproveQuestion2: 0,
        howToImproveQuestionText: AppSetting.SURVEY_DEFAULTS.IMPROVEMENT_QUESTION,
        howToImproveQuestion2Text: AppSetting.SURVEY_DEFAULTS.IMPROVEMENT_QUESTION2,
        clientSurveyMonthsLimit:0,
        tags: [],
        scoreLeftLabel: null,
        scoreRightLabel: null,
        });

    }

    // Edit record
    editRecord(survey: ISurvey){
        this.resetForm(survey);

    }

    // Save record
    saveRecord(){

        //Prepare data for save
        let oSurvey = _.clone(this.surveyForm.value);
        
        oSurvey.includeDRLS = JSON.stringify(oSurvey.includeDRLS);
        oSurvey.includeCategories = JSON.stringify(oSurvey.includeCategories);
        oSurvey.additionalQuestions = JSON.stringify(oSurvey.additionalQuestions);
        oSurvey.excludeEmployees = JSON.stringify(oSurvey.excludeEmployees);
        oSurvey.tags = oSurvey.tags ? JSON.stringify(oSurvey.tags) : [];

        oSurvey.loyaltyDrivers = oSurvey.loyaltyDrivers ? JSON.stringify(oSurvey.loyaltyDrivers.map(e => e.heading)) : [];
        
        oSurvey.customization = (oSurvey.scoreLeftLabel || oSurvey.scoreRightLabel) ? JSON.stringify({ leftScoreLabel: oSurvey.scoreLeftLabel || null, rightScoreLabel: oSurvey.scoreRightLabel || null }) : null;
        delete oSurvey.scoreLeftLabel;
        delete oSurvey.scoreRightLabel;

        // Save record
        
        this.appComponentStateService.isSaving = true;

        this.appDataService.saveRecord("Survey",oSurvey).subscribe(res=>{
            this.appComponentStateService.isSaving = false;
            // Emit saved event
            // Note: not used as the survey report is reloaded in the parent component
            let eventData = _.clone(this.surveyForm.value);
            eventData.objectId = res.objectId;
            eventData.loyaltyDrivers = eventData.loyaltyDrivers ? eventData.loyaltyDrivers.map((e: any) => e.heading) : [];
            eventData.createdAt = res.createdAt;
            eventData.updatedAt = res.updatedAt;
            eventData.customization = (eventData.scoreLeftLabel || eventData.scoreRightLabel) ? { leftScoreLabel: eventData.scoreLeftLabel || null, rightScoreLabel: eventData.scoreRightLabel || null } : null;
            delete eventData.scoreRightLabel;
            delete eventData.scoreLeftLabel;

            this.recordSaved.emit(eventData);
            
            this.appNotificationService.showSnackBar("GENERAL.SAVE_SUCCESS",2000);

        },err=>{
        this.appComponentStateService.isSaving = false;
        this.appNotificationService.showSnackBar("GENERAL.SAVE_ERROR",2000,"error");
        });
    }

    // Cancel/close
    close(){
        this.recordSaveCancelled.emit("cancelled");
    }

    // Survey type changed event
    surveyTypeChanged(event: MatRadioChange){

        let emailSubject = "";
        let emailSubjectReminder = "";
        let surveyHtml = "";
        let reminderHtml = "";

        switch(event.value){
        case 0:     // Client
            emailSubject = AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT;
            emailSubjectReminder = AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT;
            surveyHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT;
            reminderHtml = AppSetting.SURVEY_DEFAULTS.REMINDER_TEXT;
            break;

        case 1:     // Staff
            emailSubject = AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT;
            emailSubjectReminder = AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT;
            surveyHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_STAFF;
            reminderHtml = AppSetting.SURVEY_DEFAULTS.REMINDER_TEXT_STAFF;
            break;

        case 2:     // Pulse
            emailSubject = AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT_PULSE;
            emailSubjectReminder = AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT_PULSE;
            surveyHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_PULSE;
            reminderHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_PULSE;
            break;

        case 3:     // Manager
            emailSubject = AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT_MANAGER;
            emailSubjectReminder = AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT_MANAGER;
            surveyHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_MANAGER;
            reminderHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_MANAGER;
            break;

        case 4:     // Triage
            emailSubject = AppSetting.SURVEY_DEFAULTS.EMAIL_SUBJECT_TRIAGE;
            emailSubjectReminder = AppSetting.SURVEY_DEFAULTS.REMINDER_SUBJECT_TRIAGE;
            surveyHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_TRIAGE;
            reminderHtml = AppSetting.SURVEY_DEFAULTS.EMAIL_TEXT_TRIAGE;
            break;

        }

        this.surveyForm.patchValue({
        emailSubject: emailSubject,
        emailSubjectReminder: emailSubjectReminder,
        surveyHtml: surveyHtml,
        reminderHtml: reminderHtml,
        newClientsOnly: null,
        includeDRLS: [],
        includeCategories: [],
        excludeEmployees: [],
        customClientCategory1: null,
        customClientCategory1Desc: null
        });

    }

    //
    selectedTabChange(e){
        if(e.index==1){
        this.surveyForm.patchValue({ surveyHtml: this.surveyForm.value.surveyHtml });

        } else if (e.index==2) {
        this.surveyForm.patchValue({ reminderHtml: this.surveyForm.value.reminderHtml });
        } else {

        }
    }

    // Add tag
    addTag(chip) {
        this.surveyForm.get('tags').value.push(chip.value);
        chip.input.value = null;
    }

    // Remove tag
    removeTag(value) {
        const formVal = this.surveyForm.get('tags').value;
        const i = formVal.indexOf(value);
        if(i >= 0) {
        formVal.splice(i,1);
        }
    }

    // Insert dynamic contents into text editor
    insertText(textEditor: any, text: string){
        //textEditor.quillEditor.editor.insertText(0,`{{${text}}}`);
        // textEditor.editorInstance.model.change( writer => {
        //   const insertPosition = textEditor.editorInstance.model.document.selection.getFirstPosition();
        //   writer.insertText(`{{${text}}}`, insertPosition );
        // } );
    }

    drop(event: CdkDragDrop<string[]>) {
        this.moveItemInFormArray(this.surveyForm.get("loyaltyDrivers") as FormArray, event.previousIndex, event.currentIndex);
    }

    moveItemInFormArray(formArray: FormArray, fromIndex: number, toIndex: number): void {
        const from = this.clamp(fromIndex, formArray.length - 1);
        const to = this.clamp(toIndex, formArray.length - 1);
    
        if (from === to) {
          return;
        }
    
        const previous = formArray.at(from);
        const current = formArray.at(to);
        formArray.setControl(to, previous);
        formArray.setControl(from, current);
    }
    
    /** Clamps a number between zero and a maximum. */
    clamp(value: number, max: number): number {
    return Math.max(0, Math.min(max, value));
    }

    //#endregion

}
