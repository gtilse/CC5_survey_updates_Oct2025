import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClientScoreComponent } from './client-score.component';

describe('ClientScoreComponent', () => {
  let component: ClientScoreComponent;
  let fixture: ComponentFixture<ClientScoreComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ClientScoreComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
