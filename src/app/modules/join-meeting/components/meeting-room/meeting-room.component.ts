//Angular imports
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fromEvent, Subscription, timer } from 'rxjs';
import { debounceTime, map, switchMap, take } from 'rxjs/operators';
import { SocketEvents } from '../../../../core/constants/apiRestRequest';

// primeNg imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { Menu, MenuModule } from 'primeng/menu';

// service imports
import { MediasoupService } from 'src/app/core/services/mediasoup.service';
import { NavigatorService } from 'src/app/core/services/navigator.service';
import { SocketService } from 'src/app/core/services/socket.service';
import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { UserVideoComponent } from 'src/app/shared/components/user-video/user-video.component';

// utility imports
import { setAspectRatio,resizeVideoMedia } from "../../../../core/utils/videoGrid";

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [CommonModule,FormsModule,MenuModule,ButtonModule,TooltipModule,DropdownModule,DialogModule,AvatarModule,AvatarGroupModule,UserVideoComponent],
  templateUrl: './meeting-room.component.html',
  styleUrls: ['./meeting-room.component.scss'],

})
export class MeetingRoomComponent implements OnInit,AfterViewInit, OnDestroy {

  @ViewChild('videogridContainer') videoContainer!: ElementRef;
  @ViewChildren('videoitem') videoGrid!: QueryList<ElementRef>;
  
  socketService = inject(SocketService);
  mS = inject(MediasoupService);
  router = inject(Router);
  activatedRouter = inject(ActivatedRoute);
  nS = inject(NavigatorService);

  today: number = Date.now();
  open:boolean = false;
  sideNavOpen:boolean = false;
  isEmojiVisible:boolean = false;
  isEmojiColorMenuActive:boolean = false;
  resizeSubscription$!: Subscription;
  emojiIndex: number = 0;
  emojiColor: string = '#fec724';

  items = [
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">radio_button_checked</span><span>Record Meeting</span>',
    escape: false,
    disabled:true,
    styleClass:'menu_item',
    google_icon:'radio_checked',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">dashboard</span><span>Change Layout</span>',
    escape: false,
    disabled:true,
    styleClass:'menu_item',
    google_icon:'dashboard',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">fullscreen</span><span>Full Screen</span>',
    escape: false,
    styleClass:'menu_item',
    google_icon:'fullscreen',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">picture_in_picture</span><span>Open picture-in-picture</span>',
    escape: false,
    disabled:true,
    styleClass:'menu_item',
    google_icon:'picture_in_picture',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">auto_awesome</span><span>Apply Visual Effects</span>',
    escape: false,
    disabled:true,
    styleClass:'menu_item',
    google_icon:'auto_awesome',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">closed_caption</span><span>Turn on captions</span>',
    escape: false,
    disabled:true,
    styleClass:'menu_item',
    google_icon:'closed_caption',
    command: () => { }
  },
  {
    label: '<span  class="material-symbols-rounded cursor-pointer text-xl rounded-full flex items-center justify-center ">settings</span><span>Settings</span>',
    escape: false,
    styleClass:'menu_item',
    google_icon:'settings',
    command: () => { }
  },
  ]

  emojicolorVarients = [
    {
      label: '<span class="w-10 h-10 p-2"><button style="background: #fec724" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      // label: '#fec724',
      emoji_color: '#fec724',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#fec724',0); }
    },
    {
      label: '<span class="w-10 h-10 p-2"><button style="background: #e2c6a7" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      // label: '#e2c6a7',
      emoji_color: '#e2c6a7',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#e2c6a7',1); }
    },
    {
      label: '<span class="w-10 h-10"><button style="background: #c7a786" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      // label: '#c7a786',
      emoji_color: '#c7a786',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#c7a786',2); }
    },
    {
      label: '<span class="w-10 h-10 p-2"><button style="background: #a68063" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      // label: '#a68063',
      emoji_color: '#a68063',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#a68063',3); }
    },
    {
      label: '<span class="w-10 h-10 p-2"><button style="background: #926241" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      emoji_color: '#926241',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#926241',4); }
    },
    {
      label: '<span class="w-10 h-10 p-2"><button style="background: #654c45" class="w-[20px] h-[20px] outline outline-offset-2 outline-2 rounded-full border-none cursor-pointer"></button></span>',
      emoji_color: '#654c45',
      escape: false,
      styleClass:'emojicolor_item',
      command: () => { this.setEmojiColor('#654c45',5); }
    },
    
    ]

  emojies:any[] = [
    {
      emoji_name:'Sparkling Heart',
      emoji: '💖',
      animated_emoji : 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.gif',
    },
    {
      emoji_name:'Thumbs Up Sign',
      emoji: '👍',
      emoji_skintone:['👍','👍🏻','👍🏼','👍🏽','👍🏾','👍🏿'],
      animated_emoji:[
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fb/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fc/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fd/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3fe/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d_1f3ff/512.gif'
      ],
    },
    {
      emoji_name:'Party Popper',
      emoji: '🎉',
      animated_emoji : 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif'
    },
    {
      emoji_name:'Clapping Hands',
      emoji: '👏',
      emoji_skintone:['👏','👏🏻','👏🏼','👏🏽','👏🏾','👏🏿'],
      animated_emoji:[
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f_1f3fb/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f_1f3fc/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f_1f3fd/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f_1f3fe/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f_1f3ff/512.gif'
      ]
      
    },
    {
      emoji_name:'Face with Tears of Joy',
      emoji: '😂',
      animated_emoji:'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif'
    },
    {
      emoji_name:'Face with Open Mouth',
      emoji: '😮',
      animated_emoji: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/512.gif'
    },
    {
      emoji_name:'Crying Face',
      emoji: '😢',
      animated_emoji: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/512.gif',
    },
    {
      emoji_name:'Thinking Face',
      emoji: '🤔',
      animated_emoji:'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif',
    },
    {
      emoji_name:'Thumbs Down',
      emoji: '👎',
      emoji_skintone:['👎','👎🏻','👎🏼','👎🏽','👎🏾','👎🏿'],
      
      animated_emoji:[
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e_1f3fb/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e_1f3fc/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e_1f3fd/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e_1f3fe/512.gif',
        'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44e_1f3ff/512.gif'
      ]
    },
  ]

  constructor(){
    this.mS.isLobby = false;
  }
  
  peerById(index:any, peer:any){
    return peer.id; 
 }

  ngOnInit() {

    setInterval(() => {
      this.today = Date.now();
    }, 1000);

    this.socketService.fromEvent('newProducers').subscribe((data:any)=>{
      console.log('newProducers',data);
      this.mS.handleNewProducers(data);
    });
    
    this.socketService.fromEvent('consumerClosed').subscribe((data:any)=>{
      console.log('consumerClosed');
      this.mS.handleConsumerClosed(data);
    });

    this.socketService.fromEvent('consumerPaused').subscribe((data:any)=>{
      console.log('consumerPaused');
      const { consumer_id, consumer_kind} = data;
      this.mS.pauseConsumer(consumer_id,consumer_kind);
    });

    this.socketService.fromEvent('consumerResumed').subscribe((data:any)=>{
      console.log('consumerResumed');
      const { consumer_id, consumer_kind} = data;
      this.mS.resumeConsumer(consumer_id,consumer_kind);
    });
    
    this.socketService.fromEvent('peerClosed').subscribe(({peer_id}:any)=>{
      console.log('peerClosed',peer_id);
      this.mS.handlePeerClosed(peer_id);
    });

    this.socketService.fromEvent(this.mS.room_id + 'Room').subscribe((user:any)=>{
      const socketId = this.socketService.socketId
      console.log(user,':user joined into room');
      if (user.id != socketId) {
        // this.joinedRoomUsers.push(user);
      }
    })

    this.mS.triggerAspectRation.subscribe((res:boolean)=>{

      if (res) {
        console.log('triggerAspectRation',res,this.videoContainer);
        setTimeout(() => {
          if (this.videoContainer) this.handleAspectRatio();
        }, 0);
      }
    })

    this.mS.initTransports();

    this.resizeSubscription$ = fromEvent(window, 'resize').pipe(debounceTime(50))
    .subscribe(event => {
      // Handle window resize event here
      if (!this.mS.sharing_enable) {
        console.log('Window resized:', event);
        this.handleAspectRatio();
      }
    });

  }

  ngAfterViewInit(): void {

    this.handleAspectRatio();
  }

  setEmojiColor(color:string,emojiIndex:number){
    this.emojiColor = color;
    this.emojiIndex = emojiIndex;
  }

  openSideNav(){
    this.sideNavOpen = !this.sideNavOpen; 
    setTimeout(() => {
      this.handleAspectRatio();
    }, 0);
  }

  toggleEmoji(){
    this.isEmojiVisible = !this.isEmojiVisible; 
    setTimeout(() => {
      this.handleAspectRatio();
    }, 100);
  }

  reactions: any[] = [];

  sendReaction(emoji: any,index:number) {
    const src = Array.isArray(emoji.animated_emoji) ? emoji.animated_emoji[this.emojiIndex] : emoji.animated_emoji;

    const emo = { ...emoji,src:src,left: this.getRandomLeftPosition()};
    this.reactions.push(emo);
    setTimeout(() => {
      this.reactions.shift();
    }, 2900);
  }

  getRandomLeftPosition(): string {
    const leftPosition = Math.random() * 20; // Generates a number between 0 and 20
    return `${leftPosition}%`;
  }

  isHandle:boolean = false;
  toggleHand(e:any){
    this.isHandle = !this.isHandle;
    this.mS.triggerHandRaise.next(this.isHandle);
  }

  show:boolean = false;
  async toggleMic(e:any){
    e.preventDefault();
    if (!this.mS.isAudioAllowed){ this.show = true; return ;}

    const audioProducer = this.mS.getProducerByType('audioType');
    if (!audioProducer){ 
      
      const track = this.mS.localAudio?.getAudioTracks()[0];
      await this.mS.produce('audioType', null, false, false, track);
      this.mS.isMicOn = !this.mS.isMicOn;
      this.mS.handleConsumer('audioType',this.mS.localAudio,this.mS.userName,this.socketService.socketId);
      console.log('audio produced');
          
    }else{
      if (!this.mS.isMicOn) {
        setTimeout(() => {
          this.mS.unMuteMic()
        }, 100);
      }else{
        this.mS.muteMic()
      }
    }
   
  }

  async initAudio() {

    try {
      if (this.mS.localAudio) {
        await this.stopTracks(this.mS.localAudio);
      }
      const deviceId = this.mS.selectedMic.deviceId;
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          deviceId: deviceId,
        },
          // audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    
      this.mS.localAudio = stream;
      console.log(this.mS.localAudio,'remoteAudio');
    } catch (error:any) {
      console.log(error.status,'remoteAudio uoyoyoyo');
      console.log(typeof error,'remoteAudio type');
    }
  }

  async toggleVideo(e:any){
    e.preventDefault();
    if (this.mS.isVideoAllowed) {
      this.mS.isVideoOn = !this.mS.isVideoOn;
      const producerId = this.mS.getProducerIdByType('videoType');

      if (this.mS.isVideoOn && !producerId) {
          await this.initVideo();

          const track = this.mS.localVideo?.getVideoTracks()[0];

          await this.mS.produce('videoType', null, false, false, track);

          console.log('meeting room');

          this.mS.handleConsumer('videoType',this.mS.localVideo,this.mS.userName,this.socketService.socketId);
      } else {

        this.mS.closeProducer(producerId)
      }
    }else{
      // this.permissionDeniedModal= true;
    }
  }

  async changeWebCamera(){

    if (this.mS.isVideoAllowed && this.mS.isVideoOn) {
       await this.initVideo();

       this.mS.changeWebcam();
    }else{

    }
  }

  async initVideo() {

    try {
      if (this.mS.localVideo) {
        await this.stopTracks(this.mS.localVideo);
      }
      const deviceId = this.mS.selectedCamera.deviceId;
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
    
      this.mS.localVideo = stream;
      console.log(this.mS.localVideo,'remoteVideo');
    } catch (error:any) {
      console.log(error.status,'uoyoyoyo');
      console.log(typeof error,'type');
    }
  }

  async toggleScreen(e:any){
    e.preventDefault();
    this.mS.isScreenOn = !this.mS.isScreenOn;
    const producerId = this.mS.getProducerIdByType('screenType');
    
    if (this.mS.isScreenOn && !producerId) {
      await this.initScreen();

      const track = this.mS.localScreen?.getVideoTracks()[0];

      if (this.mS.localScreen && track) {
        await this.mS.produce('screenType', null, false, false, track);

        console.log('meeting room screenType');

        this.mS.handleConsumer('screenType',this.mS.localScreen,this.mS.userName,this.socketService.socketId);
      }
    } else {

      this.mS.closeProducer(producerId)
    }
  }

  async initScreen() {

    try {
      if (this.mS.localScreen) {
        await this.stopTracks(this.mS.localScreen);
      }
      const videoConstraints = {
        audio : false,
        video :
        {
          displaySurface : 'monitor',
          logicalSurface : true,
          cursor         : true,
          width          : { max: 1920 },
          height         : { max: 1080 },
          frameRate      : { max: 30 }
        }
      };
      const stream = await navigator.mediaDevices.getDisplayMedia(videoConstraints);
    
      this.mS.localScreen = stream;
      console.log(this.mS.localScreen,'remoteScreen');
    } catch (error:any) {
      this.mS.isScreenOn = false;
      this.mS.localScreen = null;
      console.log(error.code,error.name,error.message,'uoyoyoyo');
      console.log(typeof error,'type');
    }
  }

  async stopTracks(stream:any) {
    stream.getTracks().forEach((track:any) => {
        track.stop();
    });
  }

  handleAspectRatio() {
    if (this.videoGrid.length > 1) {
        this.adaptAspectRatio(this.videoGrid.length);
    } else {
        resizeVideoMedia(this.videoContainer,this.videoGrid);
    }
  }

  adaptAspectRatio(participantsCount:number) {
    /* 
        ['0:0', '4:3', '16:9', '1:1', '1:2'];
    */
    let desktop,
        mobile = 1;
    // desktop aspect ratio
    switch (participantsCount) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 7:
        case 9:
            desktop = 2; // (16:9)
            break;
        case 5:
        case 6:
        case 10:
        case 11:
            desktop = 1; // (4:3)
            break;
        // case 2:
        case 8:
            desktop = 3; // (1:1)
            break;
        default:
            desktop = 0; // (0:0)
    }
    // mobile aspect ratio
    switch (participantsCount) {
        case 3:
        case 9:
        case 10:
            mobile = 2; // (16:9)
            break;
        case 2:
        case 7:
        case 8:
        case 11:
            mobile = 1; // (4:3)
            break;
        case 1:
        case 4:
        case 5:
        case 6:
            mobile = 3; // (1:1)
            break;
        default:
            mobile = 3; // (1:1)
    }
    if (participantsCount > 11) {
        desktop = 1; // (4:3)
        mobile = 3; // (1:1)
    }

    setAspectRatio(desktop);
    resizeVideoMedia(this.videoContainer,this.videoGrid);
  }

  leaveRoom(){

    this.socketService.emitSocketEvent(SocketEvents.EXIT_ROOM,{}).subscribe({
      next:async (message: any) => {
        console.log(message);
        await this.mS.clean();
        this.router.navigate([''])
      },
      error: (error: any) => console.log(error),
      complete: ()=> { }
    })
  }

  ngOnDestroy(): void {
    this.resizeSubscription$.unsubscribe();
  }






















  dummy_data:any[] = [
    {
        "id": "940b032b-e7df-4323-994a-a49876409f5d",
        "peer_name": "Nichole.Wintheiser1",
        "avatar": "https://avatars.githubusercontent.com/u/58811466",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "4e3c381c-e72d-407a-8e00-78c2e548800d",
        "peer_name": "Ally.Jakubowski5",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/186.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "e37ceaf1-9532-4b4c-a806-47f7b301808a",
        "peer_name": "Joanne.Barrows",
        "avatar": "https://avatars.githubusercontent.com/u/50040549",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "b519715c-bdb1-4f2a-8bec-26a43bdaaec2",
        "peer_name": "Alford70",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1187.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "ef94821e-5c3a-4236-8387-1e0c8d218213",
        "peer_name": "Ova.Little48",
        "avatar": "https://avatars.githubusercontent.com/u/45348419",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "8017adc7-15e8-4828-b6ac-207988527ac5",
        "peer_name": "Tressie_Bartell",
        "avatar": "https://avatars.githubusercontent.com/u/48299448",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "f3ea0a11-d7b4-47fc-b6b5-dbf01762420e",
        "peer_name": "Alene.Pouros52",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/997.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "4d9ebd2b-cefe-4b1d-9e60-34f137e97542",
        "peer_name": "Arianna62",
        "avatar": "https://avatars.githubusercontent.com/u/68416506",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "f84561f3-ba5b-4353-9523-251d7b3b9089",
        "peer_name": "Arden_DAmore",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1104.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "e50769d4-2c49-4d0a-85bc-466f99bbc191",
        "peer_name": "Harry44",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/91.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "477b73b9-9d33-4618-ab85-3f6604db42bd",
        "peer_name": "Nia_Stokes",
        "avatar": "https://avatars.githubusercontent.com/u/39166124",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "e99ad65f-4ad0-4bc9-b6b5-334041320553",
        "peer_name": "Francesca25",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/467.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "e6e27ec0-e5b8-430e-aefb-985b6161586d",
        "peer_name": "Libbie.Hegmann37",
        "avatar": "https://avatars.githubusercontent.com/u/77700676",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "21c39c51-43d2-426f-8531-c103a9691462",
        "peer_name": "Ashton.Barrows",
        "avatar": "https://avatars.githubusercontent.com/u/57753872",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "8da6fedd-5bfd-4fff-b089-f98409bef3c8",
        "peer_name": "Ariel87",
        "avatar": "https://avatars.githubusercontent.com/u/10283029",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "6c42fe3c-7cb3-4551-b87b-4207e82044c5",
        "peer_name": "Kelsie39",
        "avatar": "https://avatars.githubusercontent.com/u/38908618",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "589e361c-3aeb-4eef-91bb-a044786d4b3e",
        "peer_name": "Clovis_Feeney",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1153.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "c2c9ab27-c96d-4d1d-8b8d-c8f7045396b2",
        "peer_name": "Tanner_Morar",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/859.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "5ec5688f-900f-43ec-a8fb-a6b87f9de061",
        "peer_name": "Nico1",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/250.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "d71195d6-1827-4fa5-bd4a-b0a9da35dd95",
        "peer_name": "Vidal.Turner28",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/759.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "f66f92eb-ef6a-44a5-a17c-7100d5c54607",
        "peer_name": "Jonathan.Howe20",
        "avatar": "https://avatars.githubusercontent.com/u/32919419",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "efc89503-b1e2-4503-b58f-f5057c044d37",
        "peer_name": "Norma.Walter84",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/45.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "c348bfd4-0d83-46b2-b10d-292f7a322c46",
        "peer_name": "Claudie23",
        "avatar": "https://avatars.githubusercontent.com/u/73662193",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "d40d1b46-cc48-4431-aa6a-98f431406e2d",
        "peer_name": "Aglae_Ferry",
        "avatar": "https://avatars.githubusercontent.com/u/40572602",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "c34c1555-a375-4b8b-9192-ab697779a96f",
        "peer_name": "Humberto99",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/687.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "4006f6a0-6806-4a4a-8ece-ebeb6c95255e",
        "peer_name": "Muhammad.Steuber",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/346.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "2724421c-60fe-48f6-9bdc-b0d3c67d8494",
        "peer_name": "Korey_Ryan",
        "avatar": "https://avatars.githubusercontent.com/u/56398892",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "6ae0782c-3704-45ca-9e5d-a3fb77b2c625",
        "peer_name": "Brooklyn43",
        "avatar": "https://avatars.githubusercontent.com/u/53213603",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "79663f1d-10e1-44fa-aca9-a129c4a8a3ee",
        "peer_name": "Alva.Johnson",
        "avatar": "https://avatars.githubusercontent.com/u/23065698",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "0e9d7f17-1bec-44da-9ff5-370c5d984c58",
        "peer_name": "Henriette.Jacobi40",
        "avatar": "https://avatars.githubusercontent.com/u/22014858",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "2e925328-d13e-4b1e-97d8-5d6540a999d9",
        "peer_name": "Paolo_Pagac",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/163.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "1caa4511-8a44-4155-9399-96212f3fdd05",
        "peer_name": "Jett.Trantow15",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/722.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "d78867b6-fd28-4181-833a-967e332cf619",
        "peer_name": "Laurie26",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/117.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "52355398-97f6-4ed2-94a2-29c905f930c5",
        "peer_name": "Haley_Deckow",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/61.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "77b8ec43-fd11-4b28-8f67-7d9f56ced209",
        "peer_name": "Cecelia.Wuckert",
        "avatar": "https://avatars.githubusercontent.com/u/22749070",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "9637b077-5fe8-427c-b0e0-3c160a51811f",
        "peer_name": "Joy35",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1064.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "b20c133f-fa3f-440d-9d70-88e06af442f8",
        "peer_name": "Bennie75",
        "avatar": "https://avatars.githubusercontent.com/u/16007471",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "5c001bd2-f355-4ed9-9044-58400d6699ed",
        "peer_name": "Justyn9",
        "avatar": "https://avatars.githubusercontent.com/u/55612278",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "37524dc7-daac-4b39-9df1-a52817b51ec0",
        "peer_name": "Emely34",
        "avatar": "https://avatars.githubusercontent.com/u/8659801",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "d4a96fc7-c471-484f-9d56-e1d2343656bb",
        "peer_name": "Larissa_Doyle",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/173.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "3501f6ef-a38c-4a86-afdd-2485c5e200c3",
        "peer_name": "Roma_Kozey",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/990.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "6a3aa73f-4b69-4565-94b4-ecf47a27fd51",
        "peer_name": "Donna17",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/784.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "1a8c76de-1489-4979-bbcb-a2e647f0d0d4",
        "peer_name": "Felicity.Hettinger49",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/592.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "eceecfc7-582f-4c1f-90e8-731662cbdab7",
        "peer_name": "Nona.Turcotte",
        "avatar": "https://avatars.githubusercontent.com/u/62540936",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "7612058e-b835-4785-bb84-e2618f986b40",
        "peer_name": "Jennie.Jakubowski",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/593.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "a3ef3499-1f83-4c7a-8d63-5b588cb7e6c3",
        "peer_name": "Verlie.Quigley",
        "avatar": "https://avatars.githubusercontent.com/u/4100983",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "66cdf7eb-e798-49fb-80c3-2f3d740522ee",
        "peer_name": "Mallie.Witting-Torphy76",
        "avatar": "https://avatars.githubusercontent.com/u/70898735",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "3df3c3a1-8af4-44bd-9ae0-debcf948e59b",
        "peer_name": "Teagan_Schiller37",
        "avatar": "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1105.jpg",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "fee2b0f5-9c7a-40df-8809-d996bb538226",
        "peer_name": "Reyes_Carter",
        "avatar": "https://avatars.githubusercontent.com/u/63316500",
        "video": "",
        "audio": "",
        "screen": ""
    },
    {
        "id": "939e502e-4e7b-4661-9d82-6408119d1d00",
        "peer_name": "Lester.Pfeffer64",
        "avatar": "https://avatars.githubusercontent.com/u/68857447",
        "video": "",
        "audio": "",
        "screen": ""
    }
  ]

  users:any[] = this.dummy_data.slice(0,4);
}
