import { Routes } from '@angular/router';
import { JoinComponent } from './components/join/join.component';
import { ConsumerComponent } from './components/consumer/consumer.component';
import { MeetingRoomComponent } from './components/meeting-room/meeting-room.component';

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
        path:'room/:id',
        component:MeetingRoomComponent
    },
];
