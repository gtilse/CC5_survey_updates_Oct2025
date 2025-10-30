/**
 * Application Module
 * @description
 * This module is lazily loaded by the AppWrapper module when user navigates to
 * /app/* route.
 */

// Modules
import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { AppRoutingModule } from './app-routing.module';
import { MAT_DATE_LOCALE } from '@angular/material/core'


// Components that belong to AppModule
import { AppComponent } from '../app-layout/app.component';
import { AppVersionHistoryComponent } from '../helper-components/app-version-history.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { ClientFollowUpCardComponent } from '../dashboard/client-follow-up-card/client-follow-up-card.component';
import { SummaryCardComponent } from '../dashboard/summary-card/summary-card.component';
import { ClientScoreChangeCardComponent } from '../dashboard/client-score-change-card/client-score-change-card.component';
import { InsightsCardComponent } from '../dashboard/insights-card/insights-card.component';
import { LatestSurveyCardComponent } from '../dashboard/latest-survey-card/latest-survey-card.component';
import { ConsolidatedResultsCardComponent } from '../dashboard/consolidated-results-card/consolidated-results-card.component';
import { OurStrengthCardComponent } from '../dashboard/our-strength-card/our-strength-card.component';
import { ClientScoreCardComponent } from '../dashboard/client-score-card/client-score-card.component';
import { OrganisationComponent } from '../organisation/organisation.component';
import { EmployeeComponent } from '../employee/employee.component';
import { ImageCropperDialogComponent } from '../helper-components/image-cropper-dialog.component';
import { LoadingComponent } from '../helper-components/loading.component';
import { EmployeeEditComponent } from '../employee/employee-edit.component';
import { LocationComponent } from '../location/location.component';
import { LocationEditComponent } from '../location/location-edit.component';
import { ClientComponent } from '../client/client.component';
import { ClientEditComponent } from '../client/client-edit.component';
import { ClientScoreComponent } from '../client/client-score.component';
import { SurveyComponent } from '../survey/survey.component';
import { SurveyEditComponent } from '../survey/survey-edit.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { SettingComponent } from '../setting/setting.component';
import { AsyncDialogComponent } from '../helper-components/async-dialog.component';
import { ErrorHandlerComponent } from '../helper-components/error-handler.component';
import { StaffLoginComponent } from '../helper-components/staff-login.component';
import { DropListAddComponent } from '../helper-components/droplist-add.component';
import { DropListComponent } from '../drop-list/drop-list.component';
import { DropListEditComponent } from '../drop-list/drop-list-edit.component';
import { FileUploadComponent } from '../helper-components/file-upload.component';
import { SurveyListDialogComponent } from '../helper-components/survey-list-dialog.component';
import { SurveyViewQueueDialogComponent } from '../helper-components/survey-view-queue-dialog.component';
import { SurveyStatusDialogComponent } from '../helper-components/survey-status-dialog.component';
import { ClientResponseComponent } from '../client-response/client-response.component';
import { NoteDialogComponent } from '../helper-components/note-dialog.component';
import { ActionItemComponent } from '../action-item/action-item.component';
import { NotificationComponent } from '../notification/notification.component';
import { FeedbackComponent } from '../feedback/feedback.component';
import { ReportComponent } from '../reports/report.component';
import { ClientSurveyStatusReportComponent } from '../reports/client-survey-status-report.component';
import { ClientSurveyRespondersReportComponent } from '../reports/client-survey-responders-report.component';
import { ClientSurveyAllResultsReportComponent } from '../reports/client-survey-all-results-report';
import { ClientActionItemsReportComponent } from '../reports/client-action-items-report.component';
import { ClientSurveyNonRespondersReportComponent } from '../reports/client-survey-nonresponders-report.component';
import { ClientSatisfactionByReportComponent } from '../reports/client-satisfaction-by-report.component';
import { OrganisationSummaryReportComponent } from '../reports/organisation-summary-report.component';
import { StaffSurveyStatusReportComponent } from '../reports/staff-survey-status-report.component';
import { StaffSurveyRespondersReportComponent } from '../reports/staff-survey-responders-report.component';
import { PulseSurveyStatusReportComponent } from '../reports/pulse-survey-status-report.component';
import { PulseSurveyRespondersReportComponent } from '../reports/pulse-survey-responders-report.component';
import { ManagerSurveyStatusReportComponent } from '../reports/manager-survey-status-report.component';
import { ManagerSurveyRespondersReportComponent } from '../reports/manager-survey-responders-report.component';

import { DataExportDialogComponent } from '../reports/data-export-dialog.component';
import { AssignLoginComponent } from '../helper-components/assign-login.component';
import { AdditionalQuestionsDialogComponent } from '../helper-components/additional-questions-dialog.component';
import { SurveyQueueDialogComponent } from '../survey/survey-queue-dialog.component';
import { ClientInfoDialogComponent } from '../client-info/client-info.component';
import { EmployeeInfoDialogComponent } from '../employee-info/employee-info.component';
import { FeedbackKudosDialogComponent } from '../feedback/feedback-kudos-dialog.component';

// AppModule declaration
@NgModule({
    declarations: [
        AppComponent,
        AppVersionHistoryComponent,
        DashboardComponent,
        OrganisationComponent,
        EmployeeComponent,
        ImageCropperDialogComponent,
        LoadingComponent,
        EmployeeEditComponent,
        LocationComponent,
        LocationEditComponent,
        ClientComponent,
        ClientEditComponent,
        ClientScoreComponent,
        SurveyComponent,
        SurveyEditComponent,
        UserProfileComponent,
        SettingComponent,
        AsyncDialogComponent,
        ErrorHandlerComponent,
        StaffLoginComponent,
        DropListAddComponent,
        DropListComponent,
        DropListEditComponent,
        FileUploadComponent,
        SurveyListDialogComponent,
        SurveyViewQueueDialogComponent,
        SurveyStatusDialogComponent,
        ClientResponseComponent,
        NoteDialogComponent,
        ActionItemComponent,
        NotificationComponent,
        FeedbackComponent,
        ReportComponent,
        ClientSurveyStatusReportComponent,
        ClientSurveyRespondersReportComponent,
        ClientSurveyAllResultsReportComponent,
        ClientActionItemsReportComponent,
        ClientSurveyNonRespondersReportComponent,
        ClientSatisfactionByReportComponent,
        OrganisationSummaryReportComponent,
        StaffSurveyStatusReportComponent,
        StaffSurveyRespondersReportComponent,
        PulseSurveyStatusReportComponent,
        PulseSurveyRespondersReportComponent,
        ManagerSurveyStatusReportComponent,
        ManagerSurveyRespondersReportComponent,
        DataExportDialogComponent,
        AssignLoginComponent,
        AdditionalQuestionsDialogComponent,
        SurveyQueueDialogComponent,
        ClientInfoDialogComponent,
        EmployeeInfoDialogComponent,
        ClientFollowUpCardComponent,
        SummaryCardComponent,
        ClientScoreChangeCardComponent,
        InsightsCardComponent,
        LatestSurveyCardComponent,
        ConsolidatedResultsCardComponent,
        OurStrengthCardComponent,
        ClientScoreCardComponent,
        FeedbackKudosDialogComponent
    ],
    imports: [AppRoutingModule, SharedModule],
    exports: [],
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
    ]
})
export class AppModule {}
