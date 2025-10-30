import { TestBed, inject } from '@angular/core/testing';

import { RecordSelectService } from './record-select.service';

describe('RecordSelectService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecordSelectService]
    });
  });

  it('should be created', inject([RecordSelectService], (service: RecordSelectService) => {
    expect(service).toBeTruthy();
  }));
});
