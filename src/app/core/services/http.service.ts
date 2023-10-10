import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiMethod } from '../constants/apiRestRequest';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http:HttpClient) { }

  requestCall(api:any,method:ApiMethod,data?:any){
    let response:any;

    switch (method) {
      case ApiMethod.GET:
        response = this.http.get<any>(`${environment.url}${api}`).pipe(
          catchError((err)=> this.handleError(err)))
        break;

      case ApiMethod.POST:
        response = this.http.post<any>(`${environment.url}${api}`,data).pipe(
          catchError((err)=> this.handleError(err)))
        break;

      case ApiMethod.PUT:
        response = this.http.put<any>(`${environment.url}${api}`,data).pipe(
          catchError((err)=> this.handleError(err)))
        break;

      case ApiMethod.DELETE:
        response = this.http.delete<any>(`${environment.url}${api}`).pipe(
          catchError((err)=> this.handleError(err)))
        break;
      default:
        break;
      }

      return response;
  }

  handleError(error:HttpErrorResponse):Observable<any>{

    if (error.error instanceof ErrorEvent) {
        console.error('An error occured',error.error.message);
    } else {
      // to show which error in snackbar or some where.
      // this.whichError(error.status,error.message)
    }
    return throwError(()=> error)
  }

  whichError(){

  }
}
