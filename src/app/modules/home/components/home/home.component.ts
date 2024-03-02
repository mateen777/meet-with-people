//Angular imports
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// primeNg imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CarouselModule } from 'primeng/carousel';
import { DialogModule } from 'primeng/dialog';

// Service imports
import { CallService } from 'src/app/core/services/call.service';
import { generateUUID4,isValidUUID } from "src/app/core/utils/helper";

const angulaModules:any[] = [
  CommonModule, FormsModule, RouterModule, ReactiveFormsModule
];

const primeNgModules:any[] = [
  DialogModule, CarouselModule, CardModule, ButtonModule, InputTextModule, OverlayPanelModule
]; 
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [...angulaModules, ...primeNgModules],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  form!:FormGroup;
  today: number = Date.now();
  email: any;
  gen_roomid: any;
  value: any;
  name: any;
  
  copyIconShow:boolean = true;
  copyCheckbox:boolean = false;

  //openvidu
  visible:boolean = false;
	loading: boolean = false;
  //end openvidu

  // services
  callService = inject(CallService);
  router = inject(Router);
  private fb:FormBuilder = inject(FormBuilder);
   

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
  this.form = this.fb.group({
    userName: ['', Validators.required],
    roomId: ['', [Validators.required, this.ValidateRoomId]]
  });
}

ValidateRoomId(control: AbstractControl) {
  if (!isValidUUID(control.value)) {
    return { invalidId: true };
  }
  return null;
}

getRoomId(){
  this.visible = true;
  this.gen_roomid = generateUUID4();
}

GoToJoinRoom() {
  const { userName,roomId } = this.form.getRawValue();
  this.router.navigate(['join',roomId],{
    queryParams:{userName}
  });
}

async copyRoomId(){
  try {
    await navigator.clipboard.writeText(this.gen_roomid);
    this.copyIconShow = false;
    setTimeout(() => {
      this.copyCheckbox = true;
    }, 10);
    setTimeout(() => {
      this.copyIconShow = true;
      this.copyCheckbox = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}
}
