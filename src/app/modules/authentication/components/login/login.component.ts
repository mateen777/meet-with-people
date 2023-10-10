import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  title = 'angular-16';
  loginForm:FormGroup;
  // private fb = inject(fb:FormBuilder);
  constructor(private fb:FormBuilder){
    this.loginForm = this.fb.group({
      email:['',[Validators.required,Validators.email,Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      password:['',Validators.required],
    })
  }

  onSubmit(event:any){
    if (this.loginForm.valid) {
      
      console.log(this.loginForm.getRawValue(),'submit');
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
