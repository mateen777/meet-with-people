import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumerComponent } from './consumer.component';

describe('ConsumerComponent', () => {
  let component: ConsumerComponent;
  let fixture: ComponentFixture<ConsumerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConsumerComponent]
    });
    fixture = TestBed.createComponent(ConsumerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
