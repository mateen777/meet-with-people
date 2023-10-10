import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SocketService } from 'src/app/core/services/socket.service';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CarouselModule, CardModule, ButtonModule, InputTextModule, OverlayPanelModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  today: number = Date.now();
  email: any;
  roomid: any;
  value: any;
  // services
  socketService = inject(SocketService);
  router = inject(Router);

  products: any[] = [
    {
      id: 1,
      name: 'Chat messaging',
      description: 'Chat messaging has revolutionized the way people communicate in the digital age, offering a quick, efficient, and versatile means of connecting with others.',
      image: '../../../../../assets/images/1.png',
    }, {
      id: 2,
      name: 'Video Conference',
      description: 'Video conferencing is a live video-based meeting between two or more people in different locations using video-enabled devices',
      image: '../../../../../assets/images/2.png',
    },
    {
      id: 3,
      name: 'Video Conference',
      description: 'Video conferencing is a live video-based meeting between two or more people in different locations using video-enabled devices',
      image: '../../../../../assets/images/3.png',
    }
  ];

  responsiveOptions: any[] | undefined = [
    {
      breakpoint: '1199px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  ngOnInit() {
    // this.socketService.confirmationFromRoomJoin().subscribe((message: any) => {
    //   // this.messageList.push(message);
    //   console.log(message);
    //   if (message) {
    //     this.router.navigate(['/join/page'])
    //   }
    // });

  }

  joinRoom() {
    // this.socketService.joinRoom({ email: this.email, roomid: this.roomid });

    this.router.navigate(['join'])
  }
}
