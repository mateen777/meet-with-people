import { Injectable, inject } from '@angular/core';
// import { RestService } from './rest.service';
import { TokenModel } from 'openvidu-angular';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { ApiMethod } from '../constants/apiRestRequest';

@Injectable({
	providedIn: 'root'
})
export class CallService {
	private privateAccess: boolean = true;
	private initialized: boolean = false;
    tokens!: TokenModel

    //services
    http = inject(HttpService);

	constructor() {}

	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}
		// const config = await this.restService.getConfig();
		// this.privateAccess = config.isPrivate;
		// this.initialized = true;
	}

	isPrivateAccess(): boolean {
		return this.privateAccess;
	}

    getSessionId(): Observable<any> {
		return this.http.requestCall('/sessions', ApiMethod.POST);
	}

    getTokens(sessionId:any,nickname:any):any {
		return this.http.requestCall(`/:${sessionId}/connections`, ApiMethod.POST,{sessionId,nickname});
	}


}