import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { UploadDatasetComponent } from './components/upload-dataset/upload-dataset.component';
import { DateRangesComponent } from './components/data-range/data-range.component';
import { TrainComponent } from './components/train/train.component';
import { SimComponent } from './components/sim/sim.component'; 
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { CreateSimComponent } from './components/create-sim/create-sim.component';

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    { path: 'dashboard', component: DashboardComponent },
    { path: 'create-sim', component: CreateSimComponent },
    {path: 'upload/:id', component: UploadDatasetComponent},
    {path: 'data-range/:id', component: DateRangesComponent},
    {path: 'train/:id', component: TrainComponent},
    {path: 'sim/:id', component: SimComponent}
];
