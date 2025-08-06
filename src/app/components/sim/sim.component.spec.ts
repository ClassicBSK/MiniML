import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimComponent } from './sim.component';

describe('SimComponent', () => {
  let component: SimComponent;
  let fixture: ComponentFixture<SimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
