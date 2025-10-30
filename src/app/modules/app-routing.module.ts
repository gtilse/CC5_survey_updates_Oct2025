import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// import route components
import { AppComponent } from '../app-layout/app.component';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { OrganisationComponent } from '../organisation/organisation.component';
import { EmployeeComponent } from '../employee/employee.component';
import { LocationComponent } from '../location/location.component';
import { ClientComponent } from '../client/client.component';
import { SurveyComponent } from '../survey/survey.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { SettingComponent } from '../setting/setting.component';
import { DropListComponent } from '../drop-list/drop-list.component';
import { ActionItemComponent } from '../action-item/action-item.component';
import { ReportComponent } from '../reports/report.component';
import { FeedbackComponent } from '../feedback/feedback.component';

// Router guards
import { LoggedUserGuard } from '../services/logged-user-guard';
import { AdminGuard } from '../services/admin-guard';

// Paths definitions
const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'feedback',
        component: FeedbackComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'actionitems',
        component: ActionItemComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'organisation',
        component: OrganisationComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'staff',
        component: EmployeeComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'location',
        component: LocationComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'client',
        component: ClientComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'survey',
        component: SurveyComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'setting',
        component: SettingComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'droplist',
        component: DropListComponent,
        canActivate: [LoggedUserGuard, AdminGuard]
      },
      {
        path: 'reports',
        component: ReportComponent,
        canActivate: [LoggedUserGuard]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

// Route module
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
