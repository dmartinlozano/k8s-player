import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '../_helpers/config.service';
import { MatDialog } from '@angular/material/dialog';
import { SoftwareComponent } from './software/software.component';
import { ElectronService } from '../_helpers/electron.service';
import { Software } from './software/software.interface';
import availableSoftwareJson from './available_software.json';
declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @ViewChild('mainContent', {static: false}) mainContent: ElementRef;
  private ingressIp: string;
  private installedToolsNames: string[];
  private availableSoftware: Software[];

  constructor(private router: Router, private configService:ConfigService, private electronService: ElectronService, public dialog: MatDialog) { }

  async ngOnInit() {

    //get installed tools
    this.ingressIp = await this.configService.getConfig("ingressIp");
    let it = await this.electronService.getInstalledTools();
    this.installedToolsNames = it.Releases.map(x => x.Name).filter(x => x !== "k8s-project-ingress");

    //print installed tools in left menu:
    this.availableSoftware = availableSoftwareJson.map(x => {
      if (this.installedToolsNames.indexOf(x.id) !== -1){
        return {...x, installed: true};
      }
      return {...x};
    });
  }

  logout() {
    this.router.navigateByUrl('');
  }

  goto(tool:string){
    switch (tool) {
      case 'keycloak':
        this.mainContent.nativeElement.setAttribute('src', 'http://'+this.ingressIp+'/auth/admin');
        break;
    }
  }

  openSoftwareDialog(): void {
    this.dialog.open(SoftwareComponent, {width: '600px', data: {} });
  }

}
