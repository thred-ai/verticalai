import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseTableComponent } from './database-table.component';

describe('DatabaseTableComponent', () => {
  let component: DatabaseTableComponent;
  let fixture: ComponentFixture<DatabaseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatabaseTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatabaseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
