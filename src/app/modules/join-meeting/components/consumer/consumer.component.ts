import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from 'src/app/core/services/socket.service';

@Component({
  selector: 'app-consumer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consumer.component.html',
  styleUrls: ['./consumer.component.scss']
})
export class ConsumerComponent implements AfterViewInit{

  vid:any;
  socketService = inject(SocketService);


  ngAfterViewInit(): void {
    this.init();
  }   

  async  init() {
    const peer = this.createPeer();
    peer.addTransceiver('video', { direction: 'recvonly' })
}

    createPeer() {
    const peer = new RTCPeerConnection();
    peer.ontrack = this.handleTrack;
    peer.onnegotiationneeded = () => this.handleonnegotiationneeded(peer);
    return peer;
}

handleTrack = async (ev:any) => {
    this.vid = ev.streams[0];
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

    this.socketService.consumer(payload).subscribe((response:any)=>{
      
        console.log(response.sdp,'from server consumer');
        peer.setRemoteDescription(new RTCSessionDescription(response.sdp));
      })

}


}
