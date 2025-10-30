/*
 * Component State Service
 * Each component will have a state loading, saving, error
 * use this service to manage these states via provider pattern
 */

import { Injectable } from '@angular/core';

@Injectable()
export class AppComponentStateService {

  _hasError: boolean;
  _isLoading: boolean;
  _isSaving: boolean;

  constructor() {
    this.resetAllStates();
  }

  // Getters
  get hasError(){
    return this._hasError;
  }

  get isLoading(){
    return this._isLoading;
  }

  get isSaving(){
    return this._isSaving;
  }

  // Setters
  set hasError(state: boolean){
    this._hasError = state;
    this._isLoading = false;
    this._isSaving = false;
  }

  set isLoading(state: boolean){
    this._isLoading = state;
    this._hasError = false;
    this._isSaving = false;
  }

  set isSaving(state: boolean){
    this._isSaving = state;
    this._isLoading = false;
    this._hasError = false;
  }

  // Reset States
  resetAllStates(){
    this._hasError = false;
    this._isLoading = false;
    this._isSaving = false;
  }

}
