import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';
import { FormGroup, FormBuilder, Validators} from '@angular/forms';
import { MustMatch } from '../_helpers/must-match.validator';
import { ToolsService } from '../services/tools.service';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-signup-root',
  templateUrl: './signup-root.component.html',
  styleUrls: ['./signup-root.component.scss']
})
export class SignupRootComponent implements OnInit {

  signForm: FormGroup;
  signFormSubmitted = false;
  showSpinner = false;

  constructor(private router: Router, 
              private toolsService: ToolsService, 
              private keycloakService: KeycloakService, 
              private loginService: LoginService,
              private formBuilder: FormBuilder) { }
  get f() { return this.signForm.controls; }

  ngOnInit() {
    try {
      this.signForm = this.formBuilder.group({
        username: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])|(?=.*[A-Z])$")]],
        verifyPassword: ['', [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])|(?=.*[A-Z])$")]],
      }, {
            validator: MustMatch('password', 'verifyPassword')
        });
    } catch (err) {
      console.error(err);
    }
  }

  async signup() {
    this.signFormSubmitted = true;
    if (this.signForm.invalid) {
      return;
    }
    try{
      this.showSpinner = true;
      this.keycloakService.install(this.signForm.value);
      await this.toolsService.waitUntilToolsIsAvailable('auth');
      this.showSpinner = true;
      this.keycloakService.fixEmailForAdmin(this.signForm.value);
      let res = await this.loginService.login(this.signForm.value);
      localStorage.setItem("keycloak_token_info", JSON.stringify(res));
      this.router.navigateByUrl('dashboard');
     } catch (err) {
      console.error(err);
    } 
  }

}
