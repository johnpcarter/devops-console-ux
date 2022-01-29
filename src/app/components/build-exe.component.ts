 import { Component, ViewChild, Inject, OnInit,
	 ElementRef }   		    							from '@angular/core'

import { MAT_DIALOG_DATA } 									from '@angular/material/dialog'

 import { DockerService }								    from '../services/docker.service'
 import { Installer } 										from '../models/Installer'
 import { Builder } 										from '../models/build'
 import { RunSet } 											from '../models/project'

@Component({
  selector: 'build-exe',
  template: `
  	<div style="display: flex; flex-direction: column; justify-content: center; align-content: stretch; width: 100%; height: 100%">
	  	<div style="flex-grow: 0"><h2 mat-dialog-title style="color: gray">{{title()}}</h2></div>
		<div id="build.exec.console.log" #logDiv style="flex-grow:2; background-color: black; color: yellow; padding: 20px; overflow-y: scroll" [scrollTop]="scrollPos">
			<p *ngFor="let str of log" class="console-log">{{str}}</p>
			<div *ngIf="isBusy" id="build.exec.console.spinner" class="spinner console-spinner"></div>
		</div>
		<mat-card-actions style="flex-grow: 0">
			<button id="build.exec.console.clearButton" mat-raised-button color="accent" style="margin-top: 5px" (click)="clear()"><fa-icon class="icon" [icon]="['fas', 'eraser']"></fa-icon> Clear</button>
			<button id="build.exec.console.doneButton" mat-raised-button color="primary" style="float: right; margin-top: 5px" [mat-dialog-close]="completionCode" [disabled]="isBusy" (click)="close($event)">Done</button>
		</mat-card-actions>
	</div>
`
})

export class BuildExeComponent implements OnInit {

  	public buttonClass: string = "mat-raised-button mat-accent"
  	public style: any = {"color": "white"}

  	public containerId: string
  	public containerName: string
  	public installer: Installer
  	public build: Builder
  	public run: RunSet

  	public includeTests: boolean
  	public uploadAPIs: boolean
  	public runK8s: boolean

  	public environment: string
  	public version: string
  	public comments: string
  	public log: string[] = []

  	public user: string
  	public password: string
  	public passwordEncrypted: string
  	public archiveWmImage: boolean

  	public isBusy: boolean = true
  	public completionCode: string

	public scrollPos: number = 0

  	@ViewChild('logDiv')
  	public logDiv: ElementRef

	public constructor(@Inject(MAT_DIALOG_DATA) public data: any, private _dockerService: DockerService) {

		if (data.containerId) {
			this.containerId = data.containerId
			this.containerName = data.containerName
			this.isBusy = false
		}
		else if (data.installer) {
			this.installer = data.installer
			this.user = data.user
			this.password = data.password
			this.passwordEncrypted = data.encryptedPassword
			this.archiveWmImage = data.archiveWmImage
		} else if (data.build) {
			this.build = data.build
		} else {
			this.run = data.run
			this.includeTests = data.includeTests
			this.uploadAPIs = data.uploadAPIs
			this.runK8s = data.runK8s
		}

		this.environment = data.environment
		this.version = data.version
		this.comments = data.comments
	}

	public ngOnInit() {

    if (this.containerId) {

      console.log("listening for container log events")

      this._dockerService.containerLog(this.containerId).subscribe((result => {
        this.processMessage(result)
      }))

    } else if (this.installer) {

      this._dockerService.install(this.installer, this.comments, this.user, this.password, this.passwordEncrypted, this.archiveWmImage).subscribe(result => {

        if (result && result.success) {
          this.isBusy = false
          this.completionCode = result.otherId
          this.processMessage("Installation completed successfully with image: " + result.imageId)
        } else if (!result || result.success == null) {
          this.processMessage(result)
        } else {
          this.isBusy = false
          this.processMessage("Installation failed")
        }
      }, error => {
        this.isBusy = false
        this.processMessage("Install failed with error: " + JSON.stringify(error))
      })
    } else if (this.build) {

      this._dockerService.build(this.build, this.version, this.comments).subscribe(result => {

        if (result && result.success) {
          this.isBusy = false
          this.completionCode = result.imageId
          this.processMessage("Build completed successfully with image: " + result.imageId)
        } else if (!result || result.success == null) {
          this.processMessage(result)
        } else {
          this.isBusy = false
          this.processMessage("Build failed: " + JSON.stringify(result))
        }
      }, error => {
        this.isBusy = false
        this.processMessage("Build failed with error: " + JSON.stringify(error))
      })
    } else {

      if (this.environment != null) {
        this.processMessage("Running in environment: " + this.environment)

      }
      this._dockerService.run(this.run, this.runK8s, this.includeTests, false, this.uploadAPIs, this.environment).subscribe((result) => {

        this.isBusy = false

        this.processMessage(result)
      }, error => {
        this.isBusy = false
        this.processMessage("Run failed with error: " + error)
      })
    }
  }

	public close(event: any) {

		this._dockerService.closeLog()
	}

	public title(): string {

		if (this.containerId)
			return "Log for " + this.containerName + " (" + this.containerId + ")"
		if (this.installer)
			return "Installing product into image " + this.installer.targetImage.tag()
		else if (this.build)
			return "Building image " + this.build.targetImage.tag()
		else
			return "Running Deployment Set " + this.run.name
	}

	public clear(): void {
		  this.log = []
	}

	private processMessage(message) {

		if (message == null) {
			return
      	}

      	if (message.status) {
        	this.log.push(this.timeNow() + " > " + message.message)
        	this.isBusy = false

      	} else if (message && message.length > 0 && message != ".") {
			  this.log.push(this.timeNow() + " > " + message)
		} else if (message == null) {
			  this.isBusy = false
      	}

		if (this.log.length > 600) {
			this.log.splice(0,100)
		}

		this.scrollPos = this.logDiv.nativeElement.scrollHeight + 20
	}

	private timeNow(): string {

		return new Date().toLocaleTimeString()
	}
}
