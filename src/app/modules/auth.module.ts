/**
 * Auth Module
 *
 * Contains Login, ForgotPassword, ResetPassword, Register components
 * Components within the auth module do not require tokens
 */

// Angular core
import { NgModule } from '@angular/core';

// Auth components
import { AuthComponent } from './auth.component';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from '../login/login.component';
import { ForgotPasswordComponent } from '../login/forgot-password.component';
import { ResetPasswordComponent } from '../login/reset-password.component';
import { RegisterComponent } from '../login/register.component';

// Shared module - used by both auth and app modules
import { SharedModule } from './shared.module';

@NgModule({
  imports: [AuthRoutingModule, SharedModule],

  declarations: [
    AuthComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    RegisterComponent
  ]
})
export class AuthModule {}
