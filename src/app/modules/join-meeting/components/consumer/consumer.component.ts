import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from 'src/app/core/services/socket.service';
import { ButtonModule } from 'primeng/button';
import { PeerjsService } from 'src/app/core/services/peerjs.service';
@Component({
  selector: 'app-consumer',
  standalone: true,
  imports: [CommonModule,ButtonModule],
  templateUrl: './consumer.component.html',
  styleUrls: ['./consumer.component.scss']
})
export class ConsumerComponent implements OnInit, AfterViewInit{
  
  vid:any;
  remoteStream:any;
  socketService = inject(SocketService);
  peerService = inject(PeerjsService);
  
  ngOnInit(): void {
        
  }

  ngAfterViewInit(): void {
    // this.init();
    // let stream = this.peerService.getMedia();
    //     this.vid = stream;
    //     this.peerService.remoteCall.answer(stream);
    //     this.peerService.remoteCall.on('stream', (remoteStream:any)=> {
    //       // Show stream in some video/canvas element.
    //       this.remoteStream = remoteStream;
    //     });

    // this.init();
  }
  
  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      console.log(stream,'stream')
      this.vid = stream;

      this.peerService.remoteCall.answer(stream);
        this.peerService.remoteCall.on('stream', (remoteStream:any)=> {
          // Show stream in some video/canvas element.
          this.remoteStream = remoteStream;
        });
    } catch (error) {
      console.log(error);
    }
}

  call(){
    // this.init()
  }

//   async  init() {
//     const peer = this.createPeer();
//     peer.addTransceiver('video', { direction: 'recvonly' })
// }

    createPeer() {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
            urls: "stun:stun.stunprotocol.org"
        },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        },
    ]
    });
    peer.ontrack = this.handleTrack;
    peer.onnegotiationneeded = () => this.handleonnegotiationneeded(peer);
    return peer;
}

handleTrack = async (ev:any) => {
  console.log(ev,'senderstream');
    this.vid = ev.streams[0];
    console.log(this.vid,'vid')
}

async handleonnegotiationneeded(peer:any) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    }

    // const response = await(await fetch('/consumer', { 
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(payload),
    // })).json();
    console.log(peer.localDescription,'localDescription');
    this.socketService.consumer(payload).subscribe((response:any)=>{
      
        console.log(response.sdp,'from server consumer');
        peer.setRemoteDescription(new RTCSessionDescription(response.sdp));
      })

}

onLoadedMetadata(e:any){
  console.log(e,'metadata loaded');
}


}
