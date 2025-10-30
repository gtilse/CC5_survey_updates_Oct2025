import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackKudosDialogComponent } from './feedback-kudos-dialog.component';

describe('FeedbackKudosDialogComponent', () => {
  let component: FeedbackKudosDialogComponent;
  let fixture: ComponentFixture<FeedbackKudosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedbackKudosDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackKudosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
