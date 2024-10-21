import { Injectable, OnInit, inject } from '@angular/core';
import {
  Device,
  RtpCapabilities,
  TransportOptions,
  Transport,
} from 'mediasoup-client/lib/types';
import * as mediasoupClient from 'mediasoup-client';
import { SocketService } from './socket.service';
import { BehaviorSubject, Subscription, lastValueFrom } from 'rxjs';
import { SocketEvents } from '../constants/apiRestRequest';

const mediaType = {
  audio: 'audioType',
  audioTab: 'audioTab',
  video: 'videoType',
  camera: 'cameraType',
  screen: 'screenType',
  speaker: 'speakerType',
};

@Injectable({
  providedIn: 'root',
})
export class MediasoupService implements OnInit {
  triggerStartToProduce = new BehaviorSubject<{ send: boolean; rec: boolean }>({
    send: false,
    rec: false,
  });
  triggerAspectRation = new BehaviorSubject<boolean>(false);
  triggerHandRaise = new BehaviorSubject<boolean>(false);
  //user related
  sharing_enable:boolean = false;
  sharing_peer:any;
  room_id: string = '';
  localVideo: any;
  localAudio: any;
  localScreen: any;
  userName: string = '';
  isMicOn: boolean = true;
  isLobby: boolean = false;
  isVideoOn: boolean = true;
  isScreenOn: boolean = false;
  isVideoAllowed: boolean = false;
  isAudioAllowed: boolean = false;
  joinRoomWithScreen: boolean = false;
  peers: any[] = [];
  videoDevices: MediaDeviceInfo[] = [];
  audioDevices: MediaDeviceInfo[] = [];
  speakers: MediaDeviceInfo[] = [];

  selectedCamera: any;
  selectedMic: any;
  selectedSpeaker: any;

  //mediasoup retaled
  device!: Device;
  RouterRtpCapabilitiesData!: RtpCapabilities;
  producerTransportData!: TransportOptions;
  consumerTransportData!: TransportOptions;
  producerTransport!: Transport;
  consumerTransport!: Transport;
  consumers = new Map();
  producers = new Map();

  // Encodings
  forceVP8 = false; // Force VP8 codec for webcam and screen sharing
  forceVP9 = false; // Force VP9 codec for webcam and screen sharing
  forceH264 = false; // Force H264 codec for webcam and screen sharing
  enableWebcamLayers = true; // Enable simulcast or SVC for webcam
  enableSharingLayers = true; // Enable simulcast or SVC for screen sharing
  numSimulcastStreamsWebcam = 3; // Number of streams for simulcast in webcam
  numSimulcastStreamsSharing = 1; // Number of streams for simulcast in screen sharing
  webcamScalabilityMode = 'L3T3'; // Scalability Mode for webcam | 'L1T3' for VP8/H264 (in each simulcast encoding), 'L3T3_KEY' for VP9
  sharingScalabilityMode = 'L1T3'; // Scalability Mode for screen sharing | 'L1T3' for VP8/H264 (in each simulcast encoding), 'L3T3' for VP9

  // just to test
  consumersList: any[] = [];

  //service
  socketService = inject(SocketService);

  ngOnInit(): void {

    
  }

  async loadDevice() {
    try {
      this.device = new mediasoupClient.Device();
      await this.device.load({
        routerRtpCapabilities: this.RouterRtpCapabilitiesData,
      });
      console.log(this.device.rtpCapabilities);
    } catch (error: any) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported');
      } else {
        console.error('Browser not supported: ', error);
      }
    }

    return this.device;
  }

  async initTransports() {
    //emit event to backend first to create webrtcTransport at backend side first.
    this.socketService.emitSocketEvent(SocketEvents.CREATE_WEBRTC_TRANSPORT, {
        forceTcp: false,
        rtpCapabilities: this.device.rtpCapabilities,
      })
      .subscribe({
        next: async ({ params }: any) => {
          this.producerTransportData = params;
          this.createSendTransport();
        },
        error: (error: any) => console.log(error),
      });

    this.socketService.emitSocketEvent(SocketEvents.CREATE_WEBRTC_TRANSPORT, {
        forceTcp: false,
      })
      .subscribe({
        next: ({ params }: any) => {
          this.consumerTransportData = params;
          this.createRecvTransport();
        },
        error: (error: any) => console.log(error),
      });

    this.triggerStartToProduce.subscribe(
      async (res: { send: boolean; rec: boolean }) => {
        if (res.send && res.rec) {
          console.log(res);
          await this.startLocalMedia();

          // this.socketService.emitSocketEvent(SocketEvents.GET_PEERS,'').subscribe((res:any)=>{
          //   if (res.status == "OK") {
          //     console.log(res,'getpeers evevnt')
          //     const peersMap = new Map(JSON.parse(res.peers));
          //     const peers = Array.from(peersMap.values());
          //     this.peers = peers.map((val:any)=>{return { id:val.id,peer_name:val.peer_name }})
          //     console.log(this.peers,'oldwajd')
          //   }
          // })

          this.socketService.emitSocketEvent(SocketEvents.GET_PRODUCERS, '').subscribe(
            (res) => console.log(res)
          );
        
        }
      }
    );

  }

  // PRODUCER TRANSPORT
  createSendTransport() {
    this.producerTransport = this.device.createSendTransport(
      this.producerTransportData
    );

    this.producerTransport.on('connect', async ({ dtlsParameters }: any, callback: () => void, errback: (err: any) => void) => {
        
      this.socketService.emitSocketEvent(SocketEvents.CONNECT_TRANSPORT, {
            dtlsParameters,
            transport_id: this.producerTransportData.id,
          })
          .subscribe({
            next: (res: any) => {
              console.log(
                'connected succefully in connect listen sendtransport'
              );
              callback();
            },
            error: (err: any) => {
              errback(err);
              console.log(err);
            },
          });
      }
    );

    this.producerTransport.on('produce',async ({ kind, appData, rtpParameters }: any,callback: any,errback: any) => {
        console.log('Going to produce', { kind, appData, rtpParameters });

        this.socketService.emitSocketEvent(SocketEvents.PRODUCE, {
            producerTransportId: this.producerTransport.id,
            kind,
            appData,
            rtpParameters,
          })
          .subscribe({
            next: ({ producer_id }: any) => {
              if (producer_id.error) {
                errback(producer_id.error);
              } else {
                callback({ id: producer_id });
              }
            },
            error: (err: any) => {
              errback(err);
              console.log(err);
            },
          });
      }
    );

    this.producerTransport.on('connectionstatechange', (state: any) => {
      console.log(state, 'state');
      switch (state) {
        case 'connecting':
          console.log('Producer Transport connecting...');
          break;
        case 'connected':
          console.log('Producer Transport connected', {
            id: this.producerTransport.id,
          });
          break;
        case 'failed':
          console.log('Producer Transport failed', {
            id: this.producerTransport.id,
          });
          this.producerTransport.close();
          // this.exit(true);
          // this.refreshBrowser();
          break;
        default:
          break;
      }
    });

    this.producerTransport.on('icegatheringstatechange', (state: any) => {
      console.log('Producer icegatheringstatechange', state);
    });

    console.log('successfully created send transport');
    this.triggerStartToProduce.next({ send: true, rec: false });
  }

  // ####################################################
  // CONSUMER TRANSPORT
  // ####################################################

  createRecvTransport() {
    this.consumerTransport = this.device.createRecvTransport(
      this.consumerTransportData
    );

    this.consumerTransport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
        
      this.socketService.emitSocketEvent(SocketEvents.CONNECT_TRANSPORT, {
            dtlsParameters,
            transport_id: this.consumerTransport.id,
          })
          .subscribe({
            next: (res: any) => {
              callback();
            },
            error: (err: any) => {
              errback(err);
              console.log(err);
            },
          });
      }
    );

    this.consumerTransport.on('connectionstatechange', (state: any) => {
      switch (state) {
        case 'connecting':
          console.log('Consumer Transport connecting...');
          break;
        case 'connected':
          console.log('Consumer Transport connected', {
            id: this.consumerTransport.id,
          });
          break;
        case 'failed':
          console.warn('Consumer Transport failed', {
            id: this.consumerTransport.id,
          });
          this.consumerTransport.close();
          // this.exit(true);
          // this.refreshBrowser();
          break;
        default:
          break;
      }
    });

    this.consumerTransport.on('icegatheringstatechange', (state: any) => {
      console.log('Consumer icegatheringstatechange', state);
    });
    console.log('successfully created revc transport');
    this.triggerStartToProduce.next({ send: true, rec: true });
  }

  async startLocalMedia() {
    console.log('Start local media');
    if (this.isAudioAllowed && this.isMicOn) {
      console.log('Start audio media');
      const track = this.localAudio?.getAudioTracks()[0];
      await this.produce(mediaType.audio, null, false, false, track);
    } else {
      console.log('Audio is off');
      // this.updatePeerInfo(this.peer_name, this.peer_id, 'audio', false);
    }
    if (this.isVideoAllowed && this.isVideoOn) {
      console.log('Start video media');
      const track = this.localVideo?.getVideoTracks()[0];
      await this.produce(mediaType.video, null, false, false, track);
    } else {
      console.log('Video is off');

      // this.updatePeerInfo(this.peer_name, this.peer_id, 'video', false);
    }

    if (this.joinRoomWithScreen) {
      console.log('Start Screen media');
      await this.produce(mediaType.screen, null, false, true, this.localScreen);
    }
  }

  // ####################################################
  // PRODUCER
  // ####################################################

  async produce(
    type: any,
    deviceId = null,
    swapCamera = false,
    init = false,
    track: any
  ) {
    let mediaConstraints = {};
    let audio = false;
    let screen = false;

    if (!this.device.canProduce('video') && type == mediaType.video) {
      console.log(this.device, 'device');
      return console.error('Cannot produce video');
    }

    if (!this.device.canProduce('audio') && type == mediaType.audio) {
      console.log(this.device, 'device');
      return console.error('Cannot produce audio');
    }
  
    try {
      const params: any = {
        track,
        appData: {
          mediaType: type,
        },
      };

      if (mediaType.audio == type) {
        console.log('AUDIO ENABLE OPUS');
        params.codecOptions = {
          opusStereo: true,
          opusDtx: true,
          opusFec: true,
          opusNack: true,
        };
      }

      if (mediaType.audio != type && mediaType.screen != type) {
        const { encodings, codec } = this.getWebCamEncoding();
        console.log('GET WEBCAM ENCODING', {
          encodings: encodings,
          codecs: codec,
        });
        params.encodings = encodings;
        // params.codecs = codec;
        params.codecOptions = {
          videoGoogleStartBitrate: 1000,
        };
      }

      if (mediaType.audio != type && mediaType.screen == type) {
        const { encodings, codec } = this.getScreenEncoding();
        console.log('GET SCREEN ENCODING', {
            encodings: encodings,
            codecs: codec,
        });
        params.encodings = encodings;
        params.codecs = codec;
        params.codecOptions = {
            videoGoogleStartBitrate: 1000,
        };
    }

      const producer = await this.producerTransport.produce(params);

      if (!producer) {
        throw new Error('Producer not found!');
      }

      console.log('PRODUCER', producer);

      this.producers.set(producer.id, { type: type, producer: producer });

      // if screen sharing produce the tab audio + microphone
      // if (screen && stream.getAudioTracks()[0]) {
      //     this.produceScreenAudio(stream);
      // }

      producer.on('trackended', () => {
        console.log('Producer track ended', { id: producer.id });
        this.closeProducer(producer.id);
      });

      producer.on('transportclose', () => {
        console.log('Producer transport close', { id: producer.id });
        this.closeProducer(producer.id);
      });

      producer.on('@close', () => {
        console.log('@CLose event:- Closing producer', { id: producer.id });
        
      });

    } catch (err: any) {
      console.error('Produce error:', err);

    }
  }

  
  // CONSUMER

  async consume(producer_id: any, peer_name: any, peer_id: any, type: any,peerData?:any) {
    try {
      const { consumer, stream, kind }: any = await this.getConsumeStream(
        producer_id,
        peer_id,
        type
      );

      console.log('CONSUMER MEDIA TYPE ----> ' + type);
      console.log('CONSUMER', consumer);

      console.log(consumer.id,'consumer.id');

      const data = await lastValueFrom(
        this.socketService.emitSocketEvent(SocketEvents.RESUME_CONSUMER, {
          consumer_id : consumer.id
        })
      );
      console.log(data+' resumed consumer');

      this.consumers.set(consumer.id, consumer);

      consumer.on('trackended', () => {
        console.log('Consumer track end', { id: consumer.id });
        this.removeConsumer(consumer.id, consumer.kind);
      });

      consumer.on('transportclose', () => {
        console.log('Consumer transport close', { id: consumer.id });
        this.removeConsumer(consumer.id, consumer.kind);
      });

      console.log(peerData,'peerData')
      
      this.handleConsumer(type, type == 'audioType' ? peerData.peer_audio ? stream : null : stream, peer_name, peer_id);
    } catch (error) {
      console.error('Error in consume', error);
    }
  }

  async getConsumeStream(producerId: any, peer_id: any, type: any) {
    const { rtpCapabilities } = this.device;
    let res;
    // convert observable to promise
    const data = await lastValueFrom(
      this.socketService.emitSocketEvent(SocketEvents.CONSUME, {
        rtpCapabilities,
        consumerTransportId: this.consumerTransport.id,
        producerId,
      })
    );
    console.log('DATA', data);
    const { id, kind, rtpParameters } = data;
    const codecOptions = {};
    const streamId =
      peer_id + (type == 'hvhv' ? '-screen-sharing' : '-mic-webcam');
    const consumer = await this.consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      // codecOptions,
      streamId,
      appData  : { peer_id , type }
    });
    
    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    res = {
      consumer,
      stream,
      kind,
    };

    return res;
  }

  handleConsumer(type: string, stream: any, peer_name: any, peer_id: any) {
    console.log('PEER-INFO', peer_id);
    const index = this.peers.findIndex((obj) => obj.id === peer_id);
    
    // let track:{video:any,screen:any,audio:any} = {video:undefined,screen:undefined,audio:undefined};
    let track: any = {};
    switch (type) {
      case mediaType.video: track.video = stream;
        if (index !== -1) this.peers[index].video = stream;
        break;

      case mediaType.screen: track.screen = stream;
        if (index !== -1){
          this.sharing_peer = {
            ...this.peers[index],
            ...track,
            video:null,
            audio:null
          }
          this.sharing_enable = true;
        }
      
        break;

      case mediaType.audio: track.audio = stream;
      if (index !== -1) this.peers[index].audio = stream;
        break;

      default:
        break;
    }

    
    if (type != 'screenType') {
      // If object with the given ID is found
        if (index !== -1) {
          // Modify the object at the found index with new data
          // this.peers[index] = { ...this.peers[index], ...track };
        } else {
          // this.consumersList.push({
          //   id: peer_id,
          //   peer_name: peer_name,
          //   ...track,
          // });
        }
    } else {
      if (index > -1) {
        // this.peers.unshift({
        //   ...this.peers[index],
        //   ...track,
        // });
        // this.sharing_peer = {
        //   ...this.peers[index],
        //   ...track,
        //   video:null,
        //   audio:null
        // }
        // this.sharing_enable = true;
      }
    }
    this.triggerAspectRation.next(true);
    console.log(
      this.peers,
      'peers',
      'myid',
      this.socketService.socketId
    );
  }

  removeConsumer(consumer_id: any, consumer_kind: any) {
    
    const consumer = this.consumers.get(consumer_id);
    if (!consumer) return;

    const { appData } = consumer;
    console.log('Remove consumer', {
      consumer_id: consumer_id,
      consumer_kind: consumer_kind,
    },appData);
    let peer = this.peers.find((val) => val.id === appData.peer_id);

      console.log(peer,'peer')
      if ((consumer.kind == 'audio' || appData.type == 'audioType') && peer) {
        this.stopTracks(peer.audio);
        peer.audio = null;

      }
      if ((consumer.kind == 'video' || appData.type == 'videoType') && peer) {
        this.stopTracks(peer.video);
        peer.video = null;
      }

      if (appData.type == 'screenType') {
        // this.stopTracks(peer.screen);
        // peer.screen = null;
        // this.peers.splice(0,1);
        
        this.stopTracks(this.sharing_peer.screen);
        this.sharing_enable = false;
        this.sharing_peer = null;
        console.log(this.sharing_peer, 'sharing_peer');
        this.triggerAspectRation.next(true);
      }
      console.log(this.peers, 'peers');

    consumer.close();
    this.consumers.delete(consumer_id);
  }

  pauseConsumer(consumer_id: any, consumer_kind: any) {
    
    const consumer = this.consumers.get(consumer_id);
    if (!consumer) return;

    const { appData } = consumer;
    console.log('Pause consumer', {
      consumer_id: consumer_id,
      consumer_kind: consumer_kind,
    },appData);
    let peer = this.peers.find((val) => val.id === appData.peer_id);

    console.log(peer,'peer')
    consumer.pause();

    if ((consumer.kind == 'audio' || appData.type == 'audioType') && peer) {
      this.stopTracks(peer.audio);
      peer.audio = null;
    }
    if ((consumer.kind == 'video' || appData.type == 'videoType') && peer) {
      this.stopTracks(peer.video);
      peer.video = null;
    }

    if (appData.type == 'screenType') {
      // this.stopTracks(peer.screen);
      // peer.screen = null;
      // this.peers.splice(0,1);
      
      this.stopTracks(this.sharing_peer.screen);
      this.sharing_enable = false;
      this.sharing_peer = null;
      this.triggerAspectRation.next(true);
    }
      console.log(this.peers, 'peers');

  }

  resumeConsumer(consumer_id: any, consumer_kind: any) {
    
    const consumer = this.consumers.get(consumer_id);
    if (!consumer) return;

    const { appData } = consumer;
    console.log('Resume consumer', {
      consumer_id: consumer_id,
      consumer_kind: consumer_kind,
    },appData);
    let peer = this.peers.find((val) => val.id === appData.peer_id);

    console.log(peer,'peer')
    consumer.resume();
    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    console.log(consumer.track,'track',stream)

    if ((consumer.kind == 'audio' || appData.type == 'audioType') && peer) {
      peer.audio = stream;
    }
    if ((consumer.kind == 'video' || appData.type == 'videoType') && peer) {
      peer.video = stream;
    }

    // if (appData.type == 'screenType') {
    //   peer.screen = stream;
    //   this.triggerAspectRation.next(true);
    // }
      console.log(this.peers, 'peers');

  }

  handleNewProducers = async (data: any) => {
    console.log('handleNewProducers', data);
    if (data?.length > 0) {
      console.log('SocketOn New producers', data);

      for (let { producer_id, peer_name, peer_id, type,peer_audio,peer_video } of data) {
        if (peer_id != this.socketService.socketId) {
          await this.consume(producer_id, peer_name, peer_id, type,{peer_audio,peer_video});
        } else {
          switch (type) {
            case mediaType.audio:
              this.handleConsumer(type, this.localAudio, peer_name, peer_id);
              break;
            case mediaType.video:
              this.handleConsumer(type, this.localVideo, peer_name, peer_id);
              break;
            case mediaType.screen:
              this.handleConsumer(type, this.localScreen, peer_name, peer_id);
              break;
            default:
              break;
          }

          // this.consumersList.push({
          //   id:peer_id,
          //   peer_name:peer_name,
          //   audio:this.localAudio,
          //   video:this.localVideo,
          //   screen:this.localScreen,
          // })
        }
      }
    }
  };

  handleConsumerClosed = ({ consumer_id, consumer_kind}: any) => {
    console.log('SocketOn Closing consumer', { consumer_id, consumer_kind });
    this.removeConsumer(consumer_id, consumer_kind);
  };

  getWebCamEncoding() {
    let encodings;
    let codec;

    console.log('WEBCAM ENCODING', {
      forceVP8: this.forceVP8,
      forceVP9: this.forceVP9,
      forceH264: this.forceH264,
      numSimulcastStreamsWebcam: this.numSimulcastStreamsWebcam,
      enableWebcamLayers: this.enableWebcamLayers,
      webcamScalabilityMode: this.webcamScalabilityMode,
    });

    if (this.forceVP8) {
      codec = this.device.rtpCapabilities.codecs?.find(
        (c) => c.mimeType.toLowerCase() === 'video/vp8'
      );
      if (!codec)
        throw new Error('Desired VP8 codec+configuration is not supported');
    } else if (this.forceH264) {
      codec = this.device.rtpCapabilities.codecs?.find(
        (c) => c.mimeType.toLowerCase() === 'video/h264'
      );
      if (!codec)
        throw new Error('Desired H264 codec+configuration is not supported');
    } else if (this.forceVP9) {
      codec = this.device.rtpCapabilities.codecs?.find(
        (c) => c.mimeType.toLowerCase() === 'video/vp9'
      );
      if (!codec)
        throw new Error('Desired VP9 codec+configuration is not supported');
    }

    if (this.enableWebcamLayers) {
      console.log('WEBCAM SIMULCAST/SVC ENABLED');

      const firstVideoCodec = this.device.rtpCapabilities.codecs?.find(
        (c) => c.kind === 'video'
      );
      console.log('WEBCAM ENCODING: first codec available', {
        firstVideoCodec: firstVideoCodec,
      });

      // If VP9 is the only available video codec then use SVC.
      if (
        (this.forceVP9 && codec) ||
        firstVideoCodec?.mimeType.toLowerCase() === 'video/vp9'
      ) {
        console.log('WEBCAM ENCODING: VP9 with SVC');
        encodings = [
          {
            maxBitrate: 5000000,
            scalabilityMode: this.webcamScalabilityMode || 'L3T3_KEY',
          },
        ];
      } else {
        console.log('WEBCAM ENCODING: VP8 or H264 with simulcast');
        encodings = [
          {
            scaleResolutionDownBy: 1,
            maxBitrate: 5000000,
            scalabilityMode: this.webcamScalabilityMode || 'L1T3',
          },
        ];
        if (this.numSimulcastStreamsWebcam > 1) {
          encodings.unshift({
            scaleResolutionDownBy: 2,
            maxBitrate: 1000000,
            scalabilityMode: this.webcamScalabilityMode || 'L1T3',
          });
        }
        if (this.numSimulcastStreamsWebcam > 2) {
          encodings.unshift({
            scaleResolutionDownBy: 4,
            maxBitrate: 500000,
            scalabilityMode: this.webcamScalabilityMode || 'L1T3',
          });
        }
      }
    }
    return { encodings, codec };
  }

  getScreenEncoding() {
    let encodings;
    let codec;

    console.log('SCREEN ENCODING', {
        forceVP8: this.forceVP8,
        forceVP9: this.forceVP9,
        forceH264: this.forceH264,
        numSimulcastStreamsSharing: this.numSimulcastStreamsSharing,
        enableSharingLayers: this.enableSharingLayers,
        sharingScalabilityMode: this.sharingScalabilityMode,
    });

    if (this.forceVP8) {
        codec = this.device.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === 'video/vp8');
        if (!codec) throw new Error('Desired VP8 codec+configuration is not supported');
    } else if (this.forceH264) {
        codec = this.device.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === 'video/h264');
        if (!codec) throw new Error('Desired H264 codec+configuration is not supported');
    } else if (this.forceVP9) {
        codec = this.device.rtpCapabilities.codecs?.find((c) => c.mimeType.toLowerCase() === 'video/vp9');
        if (!codec) throw new Error('Desired VP9 codec+configuration is not supported');
    }

    if (this.enableSharingLayers) {
        console.log('SCREEN SIMULCAST/SVC ENABLED');

        const firstVideoCodec = this.device.rtpCapabilities.codecs?.find((c) => c.kind === 'video');
        console.log('SCREEN ENCODING: first codec available', { firstVideoCodec: firstVideoCodec });

        // If VP9 is the only available video codec then use SVC.
        if ((this.forceVP9 && codec) || firstVideoCodec?.mimeType.toLowerCase() === 'video/vp9') {
            console.log('SCREEN ENCODING: VP9 with SVC');
            encodings = [
                {
                    maxBitrate: 5000000,
                    scalabilityMode: this.sharingScalabilityMode || 'L3T3',
                    dtx: true,
                },
            ];
        } else {
            console.log('SCREEN ENCODING: VP8 or H264 with simulcast.');
            encodings = [
                {
                    scaleResolutionDownBy: 1,
                    maxBitrate: 5000000,
                    scalabilityMode: this.sharingScalabilityMode || 'L1T3',
                    dtx: true,
                },
            ];
            if (this.numSimulcastStreamsSharing > 1) {
                encodings.unshift({
                    scaleResolutionDownBy: 2,
                    maxBitrate: 1000000,
                    scalabilityMode: this.sharingScalabilityMode || 'L1T3',
                    dtx: true,
                });
            }
            if (this.numSimulcastStreamsSharing > 2) {
                encodings.unshift({
                    scaleResolutionDownBy: 4,
                    maxBitrate: 500000,
                    scalabilityMode: this.sharingScalabilityMode || 'L1T3',
                    dtx: true,
                });
            }
        }
    }
    return { encodings, codec };
}


  closeProducer(producerId: string) {
    if (!this.producers.has(producerId)) {
      return console.log('There is no producer');
    }

    const { type, producer }: any = this.producers.get(producerId);

    const data = {
      peer_name: this.userName,
      producer_id: producerId,
      type: type,
      status: false,
    };
    console.log('peer_id',this.socketService.getSocket.ioSocket.id)
    console.log('Close producer', data);

    producer.close();
    this.socketService.emitSocketEvent(SocketEvents.PRODUCER_CLOSED, data).subscribe((res:any)=> console.log(res));

    let peer = this.peers.find((val) => val.id === this.socketService.getSocket.ioSocket.id);

    if (type == 'audioType') {
      this.stopTracks(this.localAudio);
      this.localAudio = null;
      peer.audio = null;
    }
    if (type == 'videoType') {
      this.stopTracks(this.localVideo);
      this.localVideo = null;
      peer.video = null;
    }
    if (type == 'screenType') {
      // this.stopTracks(this.localScreen);
      // this.localScreen = null;
      // this.peers[0].screen = null;
      // this.peers.splice(0,1);
      
      this.stopTracks(this.localScreen);
      this.sharing_enable = false;
      this.localScreen = null;
      this.sharing_peer = null;
      this.triggerAspectRation.next(true);
      console.log(this.sharing_peer, 'sharing_peer');
    }
    
    this.producers.delete(producerId);
  }

  getProducerIdByType(type: string): any {
    for (const [id, data] of this.producers.entries()) {
      if (data.type === type) {
        return id;
      }
    }
    return null; // Return null if no matching type is found
  }

  getProducerByType(type: string): any {
    for (const [id, data] of this.producers.entries()) {
      if (data.type === type) {
        return data.producer;
      }
    }
    return null; // Return null if no matching type is found
  }

  async stopTracks(stream: any) {
    if(!stream) return;
    stream.getTracks().forEach((track: any) => {
      track.stop();
    });
  }

  async changeWebcam()
	{
		try{
			const track = this.localVideo?.getVideoTracks()[0];
      const producer = this.getProducerByType('videoType');

			await producer.replaceTrack({ track });
    }
		catch (error)
		{
			console.error('changeWebcam() | failed: %o', error);
		}
	}

  async muteMic()
	{
    const producer = this.getProducerByType('audioType');

		producer.pause();

		try
		{
      this.socketService.emitSocketEvent(SocketEvents.PAUSE_PRODUCER, { producer_id: producer.id }).subscribe({
        next: async (message: any) => {
          console.log(message)
          this.isMicOn = !this.isMicOn;
          this.handleConsumer('audioType',null,this.userName,this.socketService.socketId);
        },
        error: (error: any) => console.log(error),
      });
		}
		catch (error)
		{
			console.error('muteMic() | failed: %o', error);
		}
	}

  async unMuteMic()
	{
    const producer = this.getProducerByType('audioType');

    // const track = this.localAudio?.getAudioTracks()[0];
    // await producer.replaceTrack({ track });
		producer.resume();

		try
		{
      this.socketService.emitSocketEvent(SocketEvents.RESUME_PRODUCER, { producer_id: producer.id }).subscribe({
        next: async (message: any) => {
          console.log(message)
          this.isMicOn = !this.isMicOn;
          this.handleConsumer('audioType',this.localAudio,this.userName,this.socketService.socketId);
        },
        error: (error: any) => console.log(error),
      });
		}
		catch (error)
		{
			console.error('unmuteMic() | failed: %o', error);
		}
	}

  handlePeerClosed(peer_id:string){

    const index = this.peers.findIndex((peer:any) => peer.id == peer_id);
    console.log(index,'index')
    if (index > -1) {
      this.peers.splice(index,1);
      console.log(this.peers,'peers')
      console.log(this.consumers,'consumers');
      this.triggerAspectRation.next(true);
    }

  }

  // getRandomLightColor() {
  //   const letters = '0123456789ABCDEF';
  //   let color = '#';
  //   for (let i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return color;
  // }

  clean = () => {
    // this._isConnected = false;
    return new Promise(async (resolve,reject)=>{

      if (this.consumerTransport) this.consumerTransport.close();
    if (this.producerTransport) this.producerTransport.close();
    const socket = this.socketService.getSocket;
    socket.removeListener('disconnect');
    socket.removeListener('newProducers');
    socket.removeListener('consumerClosed');
    socket.removeListener('newPeer');

    this.room_id = '';
    if (this.localVideo) {
      this.stopTracks(this.localVideo);
      this.localVideo = null;
    }else{ this.localVideo = null}
    
    if (this.localAudio) {
      this.stopTracks(this.localAudio);
      this.localAudio = null;
    }else{ this.localAudio = null;}

    if (this.localScreen) {
      this.stopTracks(this.localAudio);
      this.localScreen = null;
    }else{ this.localScreen = null;}

    
    this.userName = '';
    this.isMicOn = false;
    this.isVideoOn = false;
    this.peers = [];
    this.consumersList = [];

    // this.device = null;
    // this.RouterRtpCapabilitiesData = null;
    // this.producerTransportData = null;
    // this.consumerTransportData = null;
    // this.producerTransport = null;
    // this.consumerTransport = null;

    console.log(this.peers);
    resolve(true);
    })
    
  };
}
