import { Injectable, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// import { io } from 'socket.io-client';
import { Socket } from 'ngx-socket-io';
import { HttpService } from './http.service';
import { ApiMethod } from '../constants/apiRestRequest';
import { MediasoupService } from './mediasoup.service';
import { ActivatedRoute } from '@angular/router';

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
    console.log('initSocket started',this.socket);
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

  get socketId(){
    return this.socket.ioSocket.id;
  }

  // this method is used to start connection/handhshake of socket with server
 connectSocket(message:any) {
  this.socket.emit('connect', message);
 }

 // this method is used to get response from server
//  connectEvent() {
//   return this.socket.fromEvent('connect');
//  }
//  disconnectEvent() {
//   return this.socket.fromEvent('disconnect');
//  }

 userJoinedEvent(roomId:string) {
  const eventName = roomId + 'joinedinroom';
  return this.socket.fromEvent(eventName);
 }


 // this method is used to end web socket connection
 disconnectSocket() {
  this.socket.disconnect();
 }


  sendMessage(){
    this.socket.emit('joinRoom','awad',(response:any) => {
      console.log(response);
    })
  }

  fromEvent(eventName:string) {
    return this.socket.fromEvent(eventName);
   }

  emitSocketEvent(eventName: string, payload: any, extras?: any): Observable<any> {
    return new Observable((observer) => {
      this.socket.emit(eventName, payload, (response: any) => {
        observer.next(response); // Emit the response to observers
        observer.complete(); // Complete the observable
      });
    });
  }


}
