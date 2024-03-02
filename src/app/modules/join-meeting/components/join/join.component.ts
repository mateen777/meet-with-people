//Angular imports
import { AfterViewInit, Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

//rxjs imports
import { Subject, forkJoin, fromEvent, merge, of, timer } from 'rxjs';
import { debounceTime, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';

// primeNg imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';

// Service imports
import { SocketService } from 'src/app/core/services/socket.service';
import { PeerjsService } from 'src/app/core/services/peerjs.service';
import { CallService } from 'src/app/core/services/call.service';

//delete below line
import { TokenModel, RecordingInfo, BroadcastingError, OpenViduAngularModule, BroadcastingService, ParticipantService, RecordingService } from 'openvidu-angular';
import { FormsModule } from '@angular/forms';
import { NavigatorService } from 'src/app/core/services/navigator.service';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule,FormsModule,ButtonModule,TooltipModule,DropdownModule,DialogModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
  host:{
    '(window:keydown.control.d)':'toggleMic($event)',
    '(window:keydown.control.e)':'handleKeyPress($event)' 
  }
})
export class JoinComponent implements OnInit,AfterViewInit{

  // @ViewChild('video',{static:true}) video!:HTMLVideoElement;
  private keyDownSubject = new Subject<KeyboardEvent>();

  remoteSocketId:any = null;
  socketService = inject(SocketService);
  router = inject(Router);
  activatedRouter = inject(ActivatedRoute);
  callService = inject(CallService);
  nS = inject(NavigatorService);
  
  
  remoteVideo:any;
  remoteAudio:any;
  userName:string = '';
  isMicOn:boolean = true;
  isVideoOn:boolean = true;
  isVideoAllowed:boolean = false;
  isAudioAllowed:boolean = false;
  askPermissionModal:boolean = false;
  permissionDeniedModal:boolean = false;

  videoDevices: MediaDeviceInfo[] = [];
  audioDevices: MediaDeviceInfo[] = [];
  speakers: MediaDeviceInfo[] = [];

  selectedCamera:any;
  selectedMic:any;
  selectedSpeaker: any;

  
  countries:any[] = [
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'China', code: 'CN' },
    // { name: 'Egypt', code: 'EG' },
    // { name: 'France', code: 'FR' },

];

  async ngOnInit() {
    
    this.activatedRouter.queryParams.subscribe((qparams:any)=>{
      if (qparams && qparams.userName) {
        this.userName = qparams.userName
      }
    })

    this.keyDownSubject.pipe(
      filter((event: any) => {
        return !event.repeat && event.key === 'e';
      }),
      switchMap((e:any) => {
        return of(e);
      }),
    ).subscribe((event:any) => {
      // Your logic for handling the last keypress here
      console.log('Mateen',event);
      this.toggleVideo(event);
    })

    this.socketService.connectEvent().subscribe((socket:any)=>{

      console.log(socket,'connect in join comp')
    })

    // Call the function to check permissions
    await this.checkVideoAudioPermissions();
  }

  
  async checkVideoAudioPermissions() {
    try {
      const cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName});
  
      console.log(cameraPermissionStatus)
      console.log(microphonePermissionStatus)
      
      if (cameraPermissionStatus.state === 'granted' || microphonePermissionStatus.state === 'granted') {

        if (cameraPermissionStatus.state === 'granted') {
          this.isVideoAllowed = true;
          this.isVideoOn = true;
          this.nS.getVideoDevices().subscribe({
            next:(videoDevices:any)=> { this.videoDevices = videoDevices; this.selectedCamera = this.videoDevices[0]; this.initVideo() },
            error:(error:any) => console.log(error)
          })
        }else{
          this.isVideoAllowed = false;
          this.isVideoOn = false;
          this.askPermissionModal = true;
          await this.askPermission();
        } 

        if (microphonePermissionStatus.state === 'granted') {
          this.isAudioAllowed = true;
          this.isMicOn = true;
          this.nS.getAudioDevices().subscribe({
            next:(audios:any)=> { this.audioDevices = audios; this.selectedMic = this.audioDevices[0]; this.initAudio()},
            error:(error:any) => console.log(error)
          }) 
          this.nS.getSpeakers().subscribe({
            next:(speakers:any)=> { 
              this.speakers = speakers; 
              this.selectedSpeaker = this.speakers[0]; 
            },
            error:(error:any) => console.log(error)
          }) 
        }else{
          this.isAudioAllowed = false;
          this.isMicOn = false;

          this.askPermissionModal = true;
          await this.askPermission();
        }

        // await this.initVideo();
        console.log('Camera and microphone permissions granted.');
      }else if(cameraPermissionStatus.state === 'prompt' || microphonePermissionStatus.state === 'prompt'){
        cameraPermissionStatus.state === 'prompt' ? this.isVideoAllowed = false : this.isVideoAllowed = true;
        microphonePermissionStatus.state === 'prompt' ? this.isAudioAllowed = false : this.isAudioAllowed = true;

        this.askPermissionModal = true;
        await this.askPermission();

        if (this.isVideoAllowed && this.isAudioAllowed) {
          forkJoin([this.nS.getVideoDevices(),this.nS.getAudioDevices(),this.nS.getSpeakers()]).subscribe({
            next:([videoDevices,audios,speakers]:any)=> { 
              this.videoDevices = videoDevices; 
              this.audioDevices = audios; 
              this.speakers = speakers; 
  
              this.selectedCamera = this.videoDevices[0];
              this.selectedMic = this.audioDevices[0];
              this.selectedSpeaker = this.speakers[0]; 
              this.initVideo();
              console.log(videoDevices,audios,speakers,'res')
            },
            error:(error:any) => console.log(error)
          })
        }
        console.log('Camera and microphone permissions need to ask.');
      }
       else {
        this.isVideoAllowed = false;
        this.isAudioAllowed = false;
        this.isMicOn = false;
        this.isVideoOn = false;
        console.log('Camera and/or microphone permissions are denied.');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }

  async askPermission(){
    try {
      if (!this.isVideoAllowed && this.isAudioAllowed) {
        let stream = await getMedia({video:true});
        this.isVideoAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }else if (!this.isAudioAllowed && this.isVideoAllowed) {
        // await this.initAudio();
        let stream = await getMedia({audio:true});
        this.isAudioAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }else{
        // await this.initVideo();
        // await this.initAudio();
        let stream = await getMedia({video:true,audio:true});
        this.isVideoAllowed = true;
        this.isAudioAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }
    } catch (error:any) {
      if (error instanceof DOMException) {
          this.askPermissionModal = false;
        if (error.message == 'Permission dismissed') {
          if (!this.isVideoAllowed) {
            this.isVideoOn = false;
          }
          if (!this.isAudioAllowed) {
            this.isMicOn = false;
          }
        }
        if (error.message == 'Permission denied') {
          this.permissionDeniedModal = true;
        }
      }
      console.log(error,error.code,error.name,error.message);
    }

    async function getMedia(settings:any) {
      
      return await navigator.mediaDevices.getUserMedia(settings);
    }

  }
  
  call(){
    // this.init();
  }

  ngAfterViewInit(){
  }

async stopTracks(stream:any) {
  stream.getTracks().forEach((track:any) => {
      track.stop();
  });
}
  
  async initVideo() {

    try {
      if (this.remoteVideo) {
        await this.stopTracks(this.remoteVideo);
      }
      const deviceId = this.selectedCamera.deviceId;
      const videoConstraints = {
          audio: false,
          video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              deviceId: deviceId,
              aspectRatio: 1.777,
          },
      };
      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
    
      this.remoteVideo = stream;
      console.log(this.remoteVideo,'remoteVideo');
    } catch (error:any) {
      console.log(error.status,'uoyoyoyo');
      console.log(typeof error,'type');
    }
}

async initAudio() {

  try {
    if (this.remoteAudio) {
      await this.stopTracks(this.remoteAudio);
    }
    const deviceId = this.selectedMic.deviceId;
    const audioConstraints = {
        audio: true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
  
    this.remoteAudio = stream;
    console.log(this.remoteAudio,'remoteAudio');
  } catch (error:any) {
    console.log(error.status,'remoteAudio uoyoyoyo');
    console.log(typeof error,'remoteAudio type');
  }
}

toggleMic(e:any){
  e.preventDefault();
  if (this.isAudioAllowed) {
    this.isMicOn = !this.isMicOn;
    if (this.isMicOn) {
      this.initAudio();
    } else {
      if (this.remoteAudio) {
        this.stopTracks(this.remoteAudio);
        this.remoteAudio = null;
      }
    }
  } else {
    this.permissionDeniedModal = true;
  }
}

handleKeyPress(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.ctrlKey && event.key === 'e') {
      this.keyDownSubject.next(event);
    }
  }

async toggleVideo(e:any){
  e.preventDefault();
  if (this.isVideoAllowed) {
    this.isVideoOn = !this.isVideoOn;
    console.log(e)
    if (this.isVideoOn) {
      this.initVideo();
    } else {
      if (this.remoteVideo) {
        this.stopTracks(this.remoteVideo);
        this.remoteVideo = null;
      }
    }
  }else{
    this.permissionDeniedModal= true;
  }
}

joinNow(){
  this.socketService.sendMessage()
}

}
