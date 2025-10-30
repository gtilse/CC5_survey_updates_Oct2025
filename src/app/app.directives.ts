import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppStateService } from './services/app-state.service';
import { AppDataService } from './services/app-data.service';
import { ClientInfoDialogComponent } from './client-info/client-info.component';
import { EmployeeInfoDialogComponent } from './employee-info/employee-info.component';

// Toggle sibling directive
@Directive({
  selector: '[toggleSibling]'
})
export class ToggleSiblingDirective implements OnInit {
  // Properties
  private isCollapsed = false;

  // Constructor
  constructor(private el: ElementRef) {}

  // Directive init
  ngOnInit() {
    const iconElem = this.el.nativeElement.firstElementChild;
    iconElem.classList.add('fa-angle-double-right');
  }

  // Show/hide sibling
  @HostListener('click') onClick() {
    this.isCollapsed = !this.isCollapsed;
    const siblingElem = this.el.nativeElement.nextElementSibling;
    const iconElem = this.el.nativeElement.firstElementChild;

    siblingElem.classList.toggle('collapsed');

    if (this.isCollapsed) {
      iconElem.classList.remove('fa-angle-double-right');
      iconElem.classList.add('fa-angle-double-down');
    } else {
      iconElem.classList.add('fa-angle-double-right');
      iconElem.classList.remove('fa-angle-double-down');
    }
  }
}

// Formatted text/placeholder directive
@Directive({
  selector: '[appFormattedText]'
})
export class FormattedTextDirective implements OnInit, OnChanges {
  // Properties
  @Input() appFormattedText: string | null;

  @Input() appFormattedTextPlaceholder: string;

  // Constructor
  constructor(private el: ElementRef) {}

  // Directive init
  ngOnInit() {
    const element = this.el.nativeElement;
    element.innerHTML = this.appFormattedTextPlaceholder || '-';
    if (!this.appFormattedText) {
      element.classList.add('text-muted', 'text-italic');
    } else {
      this.el.nativeElement.innerHTML = this.appFormattedText;
    }
  }

  // On changes
  ngOnChanges(simpleChanges: SimpleChanges) {
    if (
      simpleChanges.appFormattedText &&
      simpleChanges.appFormattedText.currentValue
    ) {
      this.el.nativeElement.innerHTML =
        simpleChanges.appFormattedText.currentValue;
      this.el.nativeElement.classList.remove('text-muted', 'text-italic');
    }
  }
}

// Client info directive
@Directive({
  selector: '[appClientInfo]'
})
export class ClientInfoDirective implements OnInit {
  // Component properties
  @Input() appClientInfo: string;

  // Constructor
  constructor(
    private el: ElementRef,
    private dialog: MatDialog,
    public appStateService: AppStateService,
    private appDataService: AppDataService
  ) {}

  // Component init
  ngOnInit() {
    const el = this.el.nativeElement;
    el.classList.add('client-info-link');
  }

  // Open client info modal
  @HostListener('click', ['$event']) onClick(e: any) {
    e.preventDefault();
    const dialogRef: MatDialogRef<ClientInfoDialogComponent> = this.dialog.open(
      ClientInfoDialogComponent,
      {
        width: '1200px',
        data: { clientId: this.appClientInfo }
      }
    );
  }
}

// Employee info directive
@Directive({
  selector: '[appEmployeeInfo]'
})
export class EmployeeInfoDirective implements OnInit {
  // Component properties
  @Input() appEmployeeInfo: string;

  // Constructor
  constructor(
    private el: ElementRef,
    private dialog: MatDialog,
    public appStateService: AppStateService,
    private appDataService: AppDataService
  ) {}

  // Component init
  ngOnInit() {
    const el = this.el.nativeElement;
    el.classList.add('employee-info-link');
  }

  // Open client info modal
  @HostListener('click', ['$event']) onClick(e: any) {
    e.preventDefault();
    const dialogRef: MatDialogRef<EmployeeInfoDialogComponent> = this.dialog.open(
      EmployeeInfoDialogComponent,
      {
        width: '960px',
        data: { employeeId: this.appEmployeeInfo }
      }
    );
  }
}

// Material checkbox directive for custom true|false values
@Directive({
  selector: '[appMatCheckboxValue]'
})
export class MatCheckboxValueDirective implements OnInit {
  // Component properties
  @Input() appMatCheckboxValue: FormControl;

  @Input() trueValue = 1;

  @Input() falseValue = 0;

  // Constructor
  constructor(private checkbox: MatCheckbox) {}

  // Init
  ngOnInit() {
    this.checkbox.registerOnChange((checked: boolean) => {
      // Set value of the form control
      this.appMatCheckboxValue.setValue(checked ? 1 : 0);
    });
  }
}
