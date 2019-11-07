import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';

@Injectable({
    providedIn: 'root'
})
export class ElectronService {
  
    private _ipc: IpcRenderer | undefined;

    constructor() {
        if (window.require) {
            this._ipc = window.require('electron').ipcRenderer;
        }
    }

    async installKeycloak(credentials): Promise<any>{
        return await this._ipc.invoke("keycloak-install", credentials);
    }

    async getInstalledTools(): Promise<any>{
        let auxS = await this._ipc.invoke("get-installed-tools");
        return JSON.parse(auxS);
    }

}