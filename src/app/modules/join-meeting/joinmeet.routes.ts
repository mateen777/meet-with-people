import { Routes } from '@angular/router';
import { JoinComponent } from './components/join/join.component';
import { ConsumerComponent } from './components/consumer/consumer.component';

export const joinRoutes: Routes = [
    {
        path:'',
        redirectTo:'page',
        pathMatch:'full'
    },
    {
        path:'page',
        component:JoinComponent
    },
    {
        path:'consumer',
        component:ConsumerComponent
    },
];
