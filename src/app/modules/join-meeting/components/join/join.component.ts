import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from 'src/app/core/services/socket.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule,ButtonModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit,AfterViewInit{

  // @ViewChild('video',{static:true}) video!:HTMLVideoElement;
  vid:any;
  srcObject:any;
  remoteSocketId:any = null;
  socketService = inject(SocketService);

  ngOnInit(): void {
  
    // this.socketService.userJoined().subscribe((user: any) => {
    //   // this.messageList.push(message);
    //   console.log('userjoined',user);
    //   this.remoteSocketId = user;
    // })
    this.init();
  }

  call(){
    
  }

  ngAfterViewInit(){
  }
  
  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // let videoTag = document.getElementById('my-video').srcObject;
      // this.srcObject = stream;
      console.log(stream,'stream')
      this.vid = stream;
      const peer = this.createPeer();
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    } catch (error) {
      console.log(error);
    }
}

  createPeer() {
    const peer = new RTCPeerConnection();
    peer.onnegotiationneeded = () => this.handleonnegotiationneeded(peer);
    return peer;
}

async handleonnegotiationneeded(peer:any) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    }
    // const response = await(await fetch('/broadcast', { 
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(payload),
    // })).json();
    console.log(peer.localDescription,'localDescription');
    this.socketService.broadcast(payload).subscribe((response:any)=>{
      
      console.log(response.sdp,'from server');
      peer.setRemoteDescription(new RTCSessionDescription(response.sdp));
    })
}

}

console.log("mateen")