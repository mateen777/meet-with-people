import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
// import { Store } from '@ngrx/store';
// import { authActions } from 'src/app/core/store/actions/register.action';
import { RegisterRequest } from 'src/app/core/interfaces/register';
import { AuthState } from 'src/app/core/interfaces/authState';
// import { selectIsSubmitting, selectValidationErrors } from 'src/app/core/store/reducers/register.reducer';
import { AuthService } from 'src/app/core/services/auth.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  title = 'angular-16';
  registerForm:FormGroup;

  
  data$ = combineLatest({
    // isSubmitting : this.store.select(selectIsSubmitting),
    // backendsErrors : this.store.select(selectValidationErrors)
  })

  //injecting services using inject method
  private authService = inject(AuthService);

  constructor(private fb:FormBuilder,
    // private store:Store
    ){
    this.registerForm = this.fb.group({
      username:['',Validators.required],
      email:['',[Validators.required,Validators.email,Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      password:['',Validators.required],
    })
  }

  onSubmit(event:any){
    if (this.registerForm.valid) {
      const request:RegisterRequest = {
        user:this.registerForm.getRawValue()
      }
      console.log(this.registerForm.getRawValue(),'submit');
      // this.store.dispatch(authActions.register({request}))
      // this.authService.registerUser(request).subscribe(
      //   (res:any) => console.log('res',res)
      // )
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
