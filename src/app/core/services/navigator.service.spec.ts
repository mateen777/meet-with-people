/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NavigatorService } from './navigator.service';

describe('Service: Navigator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavigatorService]
    });
  });

  it('should ...', inject([NavigatorService], (service: NavigatorService) => {
    expect(service).toBeTruthy();
  }));
});
