import { Injectable, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io } from 'socket.io-client';
import { HttpService } from './http.service';
import { ApiMethod, Webrtc } from '../constants/apiRestRequest';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnInit{

  http = inject(HttpService);
  public message$: BehaviorSubject<string> = new BehaviorSubject('');
  public userJoined$: BehaviorSubject<string> = new BehaviorSubject('');

  constructor() {}

  ngOnInit(): void {
    
  }

  // socket = io('http://localhost:8000');
  socket!:any;

  public joinRoom(payload:any) {
    this.socket.emit('room:join', payload);
  }

  public confirmationFromRoomJoin = () => {
    this.socket.on('room:join', (message:any) =>{
      this.message$.next(message);
    });
    
    return this.message$.asObservable();
  };

  public userJoined = () => {
    this.socket.on('user:joined', (user:any) =>{
      this.userJoined$.next(user);
    });
    
    return this.userJoined$.asObservable();
  };

  broadcast(payload:any):Observable<any>{
    return this.http.requestCall(Webrtc.broadcast,ApiMethod.POST,payload);
  }

  consumer(payload:any):Observable<any>{
    return this.http.requestCall(Webrtc.consumer,ApiMethod.POST,payload);
  }


}
