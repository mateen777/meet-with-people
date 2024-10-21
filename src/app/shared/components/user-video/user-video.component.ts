import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { SocketService } from 'src/app/core/services/socket.service';
import { MediasoupService } from 'src/app/core/services/mediasoup.service';

@Component({
  selector: 'app-user-video',
  standalone: true,
  imports: [CommonModule,AvatarModule],
  templateUrl: './user-video.component.html',
  styleUrls: ['./user-video.component.scss']
})
export class UserVideoComponent implements OnInit, OnChanges ,OnDestroy {
  
  
  @ViewChild('audioVisualizer') audioVisualizer!: ElementRef;
  @ViewChild('left') left!: ElementRef;
  @ViewChild('middle') middle!: ElementRef;
  @ViewChild('right') right!: ElementRef;
  
  @Input() id!:any;
  @Input() userName!:any;
  @Input() peer!:any;
  @Input() videoStream!:MediaStream;
  @Input() audioStream!:MediaStream;
  @Input() screenStream!:MediaStream;
  @Input() users!:any;
  @Input() bg_color:string = '';
  
  audioContext!: AudioContext;
  analyserNode!: AnalyserNode;
  sourceNode: any;
  isHandRaised: boolean = false;

  socketService = inject(SocketService);
  mS = inject(MediasoupService);

  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['audioStream']) {
      this.audioStream ? this.initAudioContext() : this.stopAudio();
    }
  }
  
  ngOnInit(): void {
    this.mS.triggerHandRaise.subscribe((isHandRaised:boolean)=>{
      this.isHandRaised = isHandRaised;
    })
  }
  
  getRandomLightColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  initAudioContext(): void {
    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 512;
    
    try {
      this.sourceNode = this.audioContext.createMediaStreamSource(this.audioStream);
      this.sourceNode.connect(this.analyserNode);
      // this.analyserNode.connect(this.audioContext.destination);
      this.updateVisualizer();
    } catch (error) {
      console.log(error);
    }
  }
  
  updateVisualizer(): void {
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const volume =
    dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    
    if (this.left && this.right && this.middle) {
      const middleVolume = volume;
      this.middle.nativeElement.style.height = `${middleVolume}px`;
      
      const leftVolume = volume * 0.5; // Adjust as needed
      this.left.nativeElement.style.height = `${leftVolume}px`;
      
      const rightVolume = volume * 0.5; // Adjust as needed
      this.right.nativeElement.style.height = `${rightVolume}px`;
    }
    
    requestAnimationFrame(() => this.updateVisualizer());
  }
  
  stopAudio(): void {
    // if (this.audioStream) {
    //   this.audioStream.getTracks().forEach((track) => track.stop());
    // }
    if (this.audioContext && this.audioContext.state != 'closed') {
      this.audioContext.close();
    }
  }
  
  ngOnDestroy(): void {
    this.stopAudio();
  }
}
