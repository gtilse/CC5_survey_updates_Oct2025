import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthComponent } from './auth.component';
import { LoginComponent } from '../login/login.component';
import { ForgotPasswordComponent } from '../login/forgot-password.component';
import { ResetPasswordComponent } from '../login/reset-password.component';
import { RegisterComponent } from '../login/register.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent, data: { state: 'login' } },
      {
        path: 'forgotpassword',
        component: ForgotPasswordComponent,
        data: { state: 'forgotpassword' }
      },
      {
        path: 'passwordreset',
        component: ResetPasswordComponent,
        data: { state: 'passwordReset' }
      },
      {
        path: 'register',
        component: RegisterComponent,
        data: { state: 'register' }
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
