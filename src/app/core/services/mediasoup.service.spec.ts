/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { MediasoupService } from './mediasoup.service';

describe('Service: Mediasoup', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediasoupService]
    });
  });

  it('should ...', inject([MediasoupService], (service: MediasoupService) => {
    expect(service).toBeTruthy();
  }));
});
