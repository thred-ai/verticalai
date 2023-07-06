import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCoordComponent } from './view-coord.component';

describe('ViewCoordComponent', () => {
  let component: ViewCoordComponent;
  let fixture: ComponentFixture<ViewCoordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewCoordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewCoordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
