import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        redirectTo:'',
        pathMatch:'full'
    },
    // {
    //     path:'auth',
    //     loadChildren:()=> import('src/app/modules/authentication/auth.routes').then((m)=> m.registerRoutes)
    // },
    {
        path:'',
        loadChildren:()=> import('src/app/modules/home/home.routes').then((m)=> m.homeRoutes)
    },
    {
        path:'join',
        loadChildren:()=> import('src/app/modules/join-meeting/joinmeet.routes').then((m)=> m.joinRoutes)
    },
];
