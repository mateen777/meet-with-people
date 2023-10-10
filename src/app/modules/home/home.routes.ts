import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';


export const homeRoutes: Routes = [
    {
        path:'',
        redirectTo:'',
        pathMatch:'full'
    },
    {
        path:'',
        component:HomeComponent
    },
];
