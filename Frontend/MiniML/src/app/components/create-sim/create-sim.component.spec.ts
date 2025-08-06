import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSimComponent } from './create-sim.component';

describe('CreateSimComponent', () => {
  let component: CreateSimComponent;
  let fixture: ComponentFixture<CreateSimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSimComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
