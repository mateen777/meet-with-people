import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { AuthEndPoints,ApiMethod } from '../constants/apiRestRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  http = inject(HttpService);
  constructor() { }

  registerUser(payload:any):Observable<any>{
    return this.http.requestCall(AuthEndPoints.register,ApiMethod.POST,payload);
  }

  set(key:string,data:any):void{
    try {
      localStorage.setItem(key,JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }
  
  get(key:string):unknown{
    try {
      const localStorageItem = localStorage.getItem(key);
      return localStorageItem ? JSON.parse(localStorageItem) : null
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
