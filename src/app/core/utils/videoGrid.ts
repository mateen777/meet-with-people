
// RESPONSIVE PARTICIPANTS VIEW

import { ElementRef, QueryList } from "@angular/core";

let customRatio:boolean = true;

// aspect                0      1      2      3       4
let ratios:string[] = ['0:0', '4:3', '16:9', '1:1', '1:2'];
let aspect:number = 2;

let ratio:number = getAspectRatio();

function getAspectRatio() {
    customRatio = aspect == 0 ? true : false;
    let ratio:string[] = ratios[aspect].split(':');
    return Number(ratio[1]) / Number(ratio[0]);
}

function setAspectRatio(i:number) {
    aspect = i;
    ratio = getAspectRatio();
    // resizeVideoMedia();
}

function Area(Increment:number, Count:number, Width:number, Height:number, Margin = 10) {
    ratio = customRatio ? 0.75 : ratio;
    let i = 0;
    let w = 0;
    let h = Increment * ratio + Margin * 2;
    while (i < Count) {
        if (w + Increment > Width) {
            w = 0;
            h = h + Increment * ratio + Margin * 2;
        }
        w = w + Increment + Margin * 2;
        i++;
    }
    if (h > Height) return false;
    else return Increment;
}

function resizeVideoMedia(videoContainer:ElementRef,videos:QueryList<ElementRef>) {
    let Margin = 4;
    
    let Width = videoContainer?.nativeElement.offsetWidth - Margin * 2;
    let Height = videoContainer?.nativeElement.offsetHeight - Margin * 2;
    let max = 0;
    let optional = videos.length <= 2 ? 1 : 0;
    // let isOneVideoElement = videos.length - optional == 1 ? true : false;
    let isOneVideoElement = videos.length == 1;

    // full screen mode
    let bigWidth = Width * 4;
    if (isOneVideoElement) {
        Width = Width - bigWidth;
    }

    // loop (i recommend you optimize this)
    let i = 1;
    while (i < 5000) {
        let w = Area(i, videos.length, Width, Height, Margin);
        if (w === false) {
            max = i - 1;
            break;
        }
        i++;
    }

    max = max - Margin * 2;
    setWidth(videos, max, bigWidth, Margin, Height, isOneVideoElement);
    // document.documentElement.style.setProperty('--vmi-wh', max / 3 + 'px');
}

function setWidth(videos:QueryList<ElementRef>, width:number, bigWidth:number, margin:number, maxHeight:number, isOneVideoElement:boolean) {
    ratio = customRatio ? 0.68 : ratio;

    videos.forEach((video: ElementRef, index: number) => {
        const nativeElement = video.nativeElement;

        nativeElement.style.width = width + 'px';
        nativeElement.style.margin = margin + 'px';
        nativeElement.style.height = width * ratio + 'px';

        if (isOneVideoElement) {
            nativeElement.style.width = bigWidth + 'px';
            nativeElement.style.height = bigWidth * ratio + 'px';
            let camHeigh = nativeElement.style.height.substring(0, nativeElement.style.height.length - 2);
            if (camHeigh >= maxHeight) nativeElement.style.height = maxHeight - 2 + 'px';
        }
    });
}

// BREAKPOINTS

const MOBILE_BREAKPOINT = 500;
const TABLET_BREAKPOINT = 580;
const DESKTOP_BREAKPOINT = 730;
const CUSTOM_BREAKPOINT = 680;


export  { resizeVideoMedia, setAspectRatio };