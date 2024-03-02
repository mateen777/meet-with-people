import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class NavigatorService {

  getVideoDevices(): Observable<MediaDeviceInfo[]> {
    const allVideoDevices = this.getDevices('videoinput');
    return allVideoDevices;
    
  }

  getAudioDevices(): Observable<MediaDeviceInfo[]> {
    const allAudioDevices = this.getDevices('audioinput');
    return allAudioDevices;
  }

  getSpeakers(): Observable<MediaDeviceInfo[]> {
    const allSpeakerDevices = this.getDevices('audiooutput');
    return allSpeakerDevices;
  }

  private getDevices(kind: MediaDeviceKind): Observable<MediaDeviceInfo[]> {
    return from(navigator.mediaDevices.enumerateDevices()).pipe(
      map((devices:any) => {
        return devices.filter((device:any) => 
              device.kind === kind && 
              device.deviceId !== 'default' &&
              !device.label.toLowerCase().includes('communications'));
      })
    );
  }

  // private filterDevices(devices: MediaDeviceInfo[]): MediaDeviceInfo[] {
  //   // Filter out default and communications audio devices
  //   return devices.filter(
  //     (device) =>
  //       device.deviceId !== 'default' &&
  //       !device.label.toLowerCase().includes('communications')
  //   );
  // }
}