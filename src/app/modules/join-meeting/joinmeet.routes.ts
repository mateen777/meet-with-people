import { Routes } from '@angular/router';
import { JoinComponent } from './components/join/join.component';
import { ConsumerComponent } from './components/consumer/consumer.component';

export const joinRoutes: Routes = [
    {
        path:'',
        redirectTo:':id',
        pathMatch:'full'
    },
    {
        path:':id',
        component:JoinComponent
    },
    {
        path:'consumer',
        component:ConsumerComponent
    },
];
