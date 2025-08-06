import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { UploadDatasetComponent } from './components/upload-dataset/upload-dataset.component';
import { DateRangesComponent } from './components/data-range/data-range.component';
import { TrainComponent } from './components/train/train.component';
import { SimComponent } from './components/sim/sim.component'; 
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    { path: 'dashboard', component: DashboardComponent },
    {path: 'upload', component: UploadDatasetComponent},
    {path: 'data-range', component: DateRangesComponent},
    {path: 'train', component: TrainComponent},
    {path: 'sim', component: SimComponent}
];
