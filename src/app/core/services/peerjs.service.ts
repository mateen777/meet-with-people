import { Injectable, OnInit, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiMethod, Webrtc } from '../constants/apiRestRequest';
import { Peer } from "peerjs";
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PeerjsService implements OnInit{

  http = inject(HttpService);
  router = inject(Router);
  public message$: BehaviorSubject<string> = new BehaviorSubject('');
  public userJoined$: BehaviorSubject<string> = new BehaviorSubject('');
  peer:any;
  peerId: any;
  conn: any;
  remoteCall: any;

  constructor() {}

  ngOnInit(): void {
    
  }

  initPeer(){
    this.peer = new Peer('',{
      host: "localhost",
      port: 9000,
      path: "/myapp",
    });
    let lastPeerId:any;
    this.peer.on('open', (id: any) => {
        this.peerId = id;
        console.log('My peer ID is: ' + id);
  
        if (this.peer.id === null) {
          console.log('Received null id from peer open');
          this.peer.id = lastPeerId;
      } else {
          lastPeerId = this.peer.id;
      }
      });
  
      this.peer.on('connection',(c:any)=> {
        // Allow only a single connection
        // if (this.conn && this.conn.open) {
        //   c.on('open', function () {
        //     c.send("Already connected to another client");
        //     setTimeout(function () { c.close(); }, 500);
        //   });
        //   return;
        // }
  
        this.conn = c;
        console.log("Connected to: " + this.conn.peer);

          this.conn.send('Hello');
        // Handle incoming data (messages only since this is the signal sender)
        this.conn.on('data', function (data: any) {
          console.log(data);
        });
        this.conn.on('close', function () {
          console.log("Connection closed");
        });
      });

      this.peer.on('call',(call:any)=>{
        this.remoteCall = call;
        this.router.navigate(['join/consumer']);
      })
  
      this.peer.on('disconnected', ()=> {
        console.log('Connection lost. Please reconnect');
  
        // Workaround for peer.reconnect deleting previous id
        this.peer.id = lastPeerId;
        this.peer._lastServerId = lastPeerId;
        this.peer.reconnect();
      });
  
      this.peer.on('close',()=> {
        this.conn = null;
        console.log('Connection destroyed');
      });
      this.peer.on('error',(err:any)=> {
        console.log(err);
        alert('' + err);
      });
  }

  getpeer(){
    return this.peer;
  }

  join(othersPeerId:any) {
    // Close old connection
    if (this.conn) {
      this.conn.close();
    }
  
    // Create connection to destination peer specified in the input field
    this.conn = this.peer.connect(othersPeerId, {
      reliable: true
    });
  
    this.conn.on('open', () => {
      console.log("Connected to: " + this.conn.peer);
  
      // Check URL params for comamnds that should be sent immediately
      // var command = getUrlParam("command");
      // if (command)
      //     conn.send(command);
      this.conn.send('Hello');
      this.router.navigate(['join'])
    });
    // Handle incoming data (messages only since this is the signal sender)
    this.conn.on('data', function (data: any) {
      console.log(data);
    });
    this.conn.on('close', function () {
      console.log("Connection closed");
    });
  };

  async getMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      
      console.log(stream,'stream')
      // this.vid = stream;
      return stream;
    } catch (error) {
      console.log(error);
      return null;
    }
}

}
