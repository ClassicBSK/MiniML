import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataRangeComponent } from './data-range.component';

describe('DataRangeComponent', () => {
  let component: DataRangeComponent;
  let fixture: ComponentFixture<DataRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataRangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
