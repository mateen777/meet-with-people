//Angular imports
import { AfterViewInit, Component, DestroyRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketEvents } from '../../../../core/constants/apiRestRequest';

//rxjs imports
import { Subject, Subscription, forkJoin, of, } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// primeNg imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

// Service imports
import { SocketService } from 'src/app/core/services/socket.service';
import { CallService } from 'src/app/core/services/call.service';
import { NavigatorService } from 'src/app/core/services/navigator.service';
import { MediasoupService } from 'src/app/core/services/mediasoup.service';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule,FormsModule,ButtonModule,TooltipModule,DropdownModule,DialogModule,AvatarModule,AvatarGroupModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
  host:{
    '(window:keydown.control.d)':'toggleMic($event)',
    '(window:keydown.control.e)':'handleKeyPress($event)' 
  }
})
export class JoinComponent implements OnInit,AfterViewInit,OnDestroy {

  // @ViewChild('video',{static:true}) video!:HTMLVideoElement;
  private keyDownSubject = new Subject<KeyboardEvent>();

  remoteSocketId:any = null;
  socketService = inject(SocketService);
  mediasoupService = inject(MediasoupService);
  router = inject(Router);
  activatedRouter = inject(ActivatedRoute);
  callService = inject(CallService);
  nS = inject(NavigatorService);
  destroyRef = inject(DestroyRef)
  
  room_id:string = '';
  remoteVideo:any;
  remoteAudio:any;
  userName:string = '';
  isMicOn:boolean = true;
  isVideoOn:boolean = true;
  isVideoAllowed:boolean = false;
  isAudioAllowed:boolean = false;
  askPermissionModal:boolean = false;
  permissionDeniedModal:boolean = false;
  peerclosedSubscription!:Subscription;

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

  constructor(){
    this.mediasoupService.isLobby = true;
  }

  async ngOnInit() {
    
    this.activatedRouter.params.subscribe((params:any)=>{
      if (params && params.id) {
        this.room_id = params.id
        this.mediasoupService.room_id = this.room_id;
      }
    })
    this.activatedRouter.queryParams.subscribe((qparams:any)=>{
      if (qparams && qparams.userName) {
        this.userName = qparams.userName
        this.mediasoupService.userName = qparams.userName
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

    this.socketService.emitSocketEvent(SocketEvents.CREATE_ROOM,{ room_id :this.room_id,userName:this.userName}).subscribe({
      next: async (response:any)=> { 
        console.log(response);
        const { isExist, message, room_info, status } = response;
        
        if (status == "OK") {
        console.log(JSON.parse(room_info.peers),'room_info.peers');
        // const peersMap = new Map(JSON.parse(room_info.peers));
        // const peers = Array.from(peersMap.values());
        
        // console.log(peers,'peers');

        this.mediasoupService.peers = JSON.parse(room_info.peers);
        console.log(message,this.mediasoupService.peers);
      }else{
        console.log(message,room_info);
      }

      this.getRtpCapabilities();
    },
    error:(error:any) => console.log(error)
    })

    this.socketService.fromEvent(SocketEvents.NEW_PEER).subscribe((res:any)=>{

      const { peer } = res;
      console.log(peer,':peer joined into room');
        this.mediasoupService.peers.push(peer);
        this.mediasoupService.triggerAspectRation.next(true);
    })

    this.peerclosedSubscription = this.socketService.fromEvent(SocketEvents.PEER_CLOSED + this.room_id).subscribe(({peer_id}:any)=>{
      const socketId = this.socketService.socketId;
      console.log('wwwwwwwwwwwwwwwwwwwwwwwwww',peer_id)
      let index = this.mediasoupService.peers.findIndex(val => val.id == peer_id);
      if (index != -1) {
        this.mediasoupService.peers.splice(index,1);
      }
    })

    // Call the function to check permissions
    await this.checkVideoAudioPermissions();
  }

  async getRtpCapabilities(){
  this.socketService.emitSocketEvent(SocketEvents.GET_ROUTER_RTPCAPABILITIES,'').subscribe({
    next:async (res:any)=> { 
      console.log(res,'RouterRtpCapabilities')
      this.mediasoupService.RouterRtpCapabilitiesData = res;

      await this.mediasoupService.loadDevice();
  },
    error:(error:any) => console.log(error)
  });
  }

  
  async checkVideoAudioPermissions() {
    try {
      const cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName});
  
      console.log(cameraPermissionStatus)
      console.log(microphonePermissionStatus)
      
      if (cameraPermissionStatus.state === 'granted' || microphonePermissionStatus.state === 'granted') {

        if (cameraPermissionStatus.state === 'granted') {
          this.mediasoupService.isVideoAllowed = true;
          this.mediasoupService.isVideoOn = true;
          this.nS.getVideoDevices().subscribe({
            next:(videoDevices:any)=> { 
              this.videoDevices = videoDevices; 
              this.selectedCamera = this.videoDevices[0]; 
              this.mediasoupService.videoDevices = videoDevices; 
              this.mediasoupService.selectedCamera = this.videoDevices[0]; 
              this.initVideo() 
            },
            error:(error:any) => console.log(error)
          })
        }else{
          this.mediasoupService.isVideoAllowed = false;
          this.mediasoupService.isVideoOn = false;
          this.askPermissionModal = true;
          await this.askPermission();
        } 

        if (microphonePermissionStatus.state === 'granted') {
          this.mediasoupService.isAudioAllowed = true;
          this.mediasoupService.isMicOn = true;
          this.nS.getAudioDevices().subscribe({
            next:(audios:any)=> { 
              this.audioDevices = audios; 
              this.selectedMic = this.audioDevices[0]; 

              this.mediasoupService.audioDevices = audios; 
              this.mediasoupService.selectedMic = this.audioDevices[0]; 
              this.initAudio()},
            error:(error:any) => console.log(error)
          }) 
          this.nS.getSpeakers().subscribe({
            next:(speakers:any)=> { 
              this.speakers = speakers; 
              this.selectedSpeaker = this.speakers[0]; 

              this.mediasoupService.speakers = speakers; 
              this.mediasoupService.selectedSpeaker = this.speakers[0]; 
            },
            error:(error:any) => console.log(error)
          }) 
        }else{
          this.mediasoupService.isAudioAllowed = false;
          this.mediasoupService.isMicOn = false;

          this.askPermissionModal = true;
          await this.askPermission();
        }

        // await this.initVideo();
        console.log('Camera and microphone permissions granted.');
      }else if(cameraPermissionStatus.state === 'prompt' || microphonePermissionStatus.state === 'prompt'){
        cameraPermissionStatus.state === 'prompt' ? this.mediasoupService.isVideoAllowed = false : this.mediasoupService.isVideoAllowed = true;
        microphonePermissionStatus.state === 'prompt' ? this.mediasoupService.isAudioAllowed = false : this.mediasoupService.isAudioAllowed = true;

        this.askPermissionModal = true;
        await this.askPermission();

        if (this.mediasoupService.isVideoAllowed && this.mediasoupService.isAudioAllowed) {
          forkJoin([this.nS.getVideoDevices(),this.nS.getAudioDevices(),this.nS.getSpeakers()]).subscribe({
            next:([videoDevices,audios,speakers]:any)=> { 
              this.videoDevices = videoDevices; 
              this.audioDevices = audios; 
              this.speakers = speakers;

              this.mediasoupService.videoDevices = videoDevices; 
              this.mediasoupService.audioDevices = audios; 
              this.mediasoupService.speakers = speakers; 
  
              this.selectedCamera = this.videoDevices[0];
              this.selectedMic = this.audioDevices[0];
              this.selectedSpeaker = this.speakers[0]; 

              this.mediasoupService.selectedCamera = this.videoDevices[0];
              this.mediasoupService.selectedMic = this.audioDevices[0];
              this.mediasoupService.selectedSpeaker = this.speakers[0]; 
              this.initVideo();
              console.log(videoDevices,audios,speakers,'res')
            },
            error:(error:any) => console.log(error)
          })
        }
        console.log('Camera and microphone permissions need to ask.');
      }
       else {
        this.mediasoupService.isVideoAllowed = false;
        this.mediasoupService.isAudioAllowed = false;
        this.mediasoupService.isMicOn = false;
        this.mediasoupService.isVideoOn = false;
        console.log('Camera and/or microphone permissions are denied.');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }

  async askPermission(){
    try {
      if (!this.mediasoupService.isVideoAllowed && this.mediasoupService.isAudioAllowed) {
        let stream = await getMedia({video:true});
        this.mediasoupService.isVideoAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }else if (!this.mediasoupService.isAudioAllowed && this.mediasoupService.isVideoAllowed) {
        // await this.initAudio();
        let stream = await getMedia({audio:true});
        this.mediasoupService.isAudioAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }else{
        // await this.initVideo();
        // await this.initAudio();
        let stream = await getMedia({video:true,audio:true});
        this.mediasoupService.isVideoAllowed = true;
        this.mediasoupService.isAudioAllowed = true;
        this.askPermissionModal = false;
        await this.stopTracks(stream);
      }
    } catch (error:any) {
      if (error instanceof DOMException) {
          this.askPermissionModal = false;
        if (error.message == 'Permission dismissed') {
          if (!this.mediasoupService.isVideoAllowed) {
            this.mediasoupService.isVideoOn = false;
          }
          if (!this.mediasoupService.isAudioAllowed) {
            this.mediasoupService.isMicOn = false;
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
      if (this.mediasoupService.localVideo) {
        await this.stopTracks(this.mediasoupService.localVideo);
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
    
      this.mediasoupService.localVideo = stream;
      console.log(this.mediasoupService.localVideo,'remoteVideo');
    } catch (error:any) {
      console.log(error.status,'uoyoyoyo');
      console.log(typeof error,'type');
    }
}

async initAudio() {

  try {
    if (this.mediasoupService.localAudio) {
      await this.stopTracks(this.mediasoupService.localAudio);
    }
    const deviceId = this.selectedMic.deviceId;
    const audioConstraints = {
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: true,
        deviceId: deviceId,
      },
      video: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

    this.mediasoupService.localAudio = stream;
    console.log(this.mediasoupService.localAudio,'remoteAudio');
  } catch (error:any) {
    console.log(error.status,'remoteAudio uoyoyoyo');
    console.log(typeof error,'remoteAudio type');
  }
}

toggleMic(e:any){
  e.preventDefault();
  if (this.mediasoupService.isAudioAllowed) {
    this.mediasoupService.isMicOn = !this.mediasoupService.isMicOn;
    // if (this.mediasoupService.isMicOn) {
    //   this.initAudio();
    // } else {
    //   if (this.mediasoupService.localAudio) {
    //     this.stopTracks(this.mediasoupService.localAudio);
    //     this.mediasoupService.localAudio = null;
    //   }
    // }
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
  if (this.mediasoupService.isVideoAllowed) {
    this.mediasoupService.isVideoOn = !this.mediasoupService.isVideoOn;
    console.log(e)
    if (this.mediasoupService.isVideoOn) {
      this.initVideo();
    } else {
      if (this.mediasoupService.localVideo) {
        this.stopTracks(this.mediasoupService.localVideo);
        this.mediasoupService.localVideo = null;
      }
    }
  }else{
    this.permissionDeniedModal= true;
  }
}

joinNow(){
  const payload = {
    room_id:this.room_id , userName:this.userName
  }
  this.socketService.emitSocketEvent(SocketEvents.JOIN_ROOM,payload).subscribe({
    next:({joined,isExist,peer}:any)=> { 
      if (joined) {
        this.mediasoupService.peers.push(peer);
        this.router.navigate(['join/room',this.room_id],{
          queryParams:{ userName:peer.peer_name }
        });
        console.log('joined',joined,peer) 
      }
      
      if (!isExist) {
        this.createRoom();
      }
    },
    error:(error:any) => console.log(error)
  });
}

  createRoom(){
    this.socketService.emitSocketEvent(SocketEvents.CREATE_ROOM,{ room_id :this.room_id,userName:this.userName}).subscribe({
      next: async (response:any)=> { 
        console.log(response);
        const { isExist, status, message, room_info} = response;
        
        if (status == 'OK') {
          console.log(JSON.parse(room_info.peers),'room_info.peers');
          this.mediasoupService.peers = JSON.parse(room_info.peers);
          console.log(message,this.mediasoupService.peers);
          await this.getRtpCapabilities();
          this.joinNow();
        }else{
          console.log(message,room_info);
        }
    },
    error:(error:any) => console.log(error)
    })
  }

  ngOnDestroy(): void {
    if (this.peerclosedSubscription) this.peerclosedSubscription.unsubscribe()
  }
}
