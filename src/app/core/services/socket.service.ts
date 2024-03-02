import { Injectable, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// import { io } from 'socket.io-client';
import { Socket } from 'ngx-socket-io';
import { HttpService } from './http.service';
import { ApiMethod, Webrtc } from '../constants/apiRestRequest';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnInit{

  http = inject(HttpService);
  public message$: BehaviorSubject<string> = new BehaviorSubject('');
  public userJoined$: BehaviorSubject<string> = new BehaviorSubject('');

  private socket!:Socket;
  constructor() {
    this.socket = new Socket({
      url: "http://localhost:8000",
      options: {},
     });
    // this.initSocketConnection();
  }

  // private socket:any;
  
  ngOnInit(): void {
    console.log('initSocket started');
    // this.initSocketConnection();
  }

  initSocketConnection(){
    // this.socket = io('http://localhost:8000');
    this.socket.on("connect", () => {
      console.log('abcdefgh');
      // console.log(this.socket.id,'connected');
    });
    this.socket.on("disconnect", () => {
      // console.log(this.socket.id,'disconnected');
    });

    this.socket.on("connect_error", () => {
      console.log('connect_error');
    });
    this.socket.on("from", (res:any) => {
      console.log(res,'pp[p');
    });
  }

  get getSocket(){
    return this.socket;
  }

  // this method is used to start connection/handhshake of socket with server
 connectSocket(message:any) {
  this.socket.emit('connect', message);
 }

 // this method is used to get response from server
 connectEvent() {
  return this.socket.fromEvent('connect');
 }
 disconnectEvent() {
  return this.socket.fromEvent('disconnect');
 }


 // this method is used to end web socket connection
 disconnectSocket() {
  this.socket.disconnect();
 }


  sendMessage(){
    this.socket.emit('check','dwadaw')
  }

  // socket!:any;

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
