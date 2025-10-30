import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClientResponseComponent } from './client-response.component';

describe('ClientResponseComponent', () => {
  let component: ClientResponseComponent;
  let fixture: ComponentFixture<ClientResponseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ClientResponseComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
