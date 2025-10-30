import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DropListEditComponent } from './drop-list-edit.component';

describe('DropListEditComponent', () => {
  let component: DropListEditComponent;
  let fixture: ComponentFixture<DropListEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DropListEditComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropListEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
