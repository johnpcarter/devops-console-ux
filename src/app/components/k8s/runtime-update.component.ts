import { Component, Input, OnInit, ViewChild } 	        from '@angular/core'

import { MatButton }                                    from '@angular/material/button'
import { MatDialog }                                    from '@angular/material/dialog'
import { MatSnackBar }                                  from '@angular/material/snack-bar'

import { DockerImage }                   	            from '../../models/docker-image'

import {K8sContainerRef, K8sDeploymentDefinition} from '../../models/k8s-deployment-definition'
import { K8sService }                                   from '../../services/k8s.service'
import { DockerService }                                from '../../services/docker.service'

import { ActionsComponent }                             from './runtime-actions.directive'
import { Action }										from '../elements/docker-images-list.component'
import { DockerImageVersionsComponent }					from '../elements/docker-image-versions.component'
import {Settings} from '../../settings';

@Component({
  templateUrl: '../../templates/k8s/runtime-update.html',
  styleUrls: ['../../templates/k8s/runtime-update.css']
})

export class RuntimeUpdateComponent implements OnInit, ActionsComponent {

    @Input()
  	public selectedDeployment: K8sDeploymentDefinition

    public selectedEnvironment: string

    public haveActions: boolean = false

  	public references: any[]
    public selectedImage: DockerImage
    public currentVersion: number

  	private _dialogRef: any
  	private _image: DockerImage

  	private _containersToUpdate: K8sContainerRef[] = []

  	@ViewChild('updateButton', {read: MatButton}) updateButton: MatButton

  	public constructor(private _dockerService: DockerService, private _k8sService: K8sService, private _settings: Settings, private _matDialog: MatDialog, private _snackBar: MatSnackBar) {

        this._settings.values().subscribe((settings) => {
            this.selectedEnvironment = this._settings.currentEnvironment
        })
  	}

  	public ngOnInit() {

  		this.references = []

      this.selectedDeployment.containers.forEach((c) => {
        this.references.push({name: c.uniqueName(), version: c.version()})
      })
  	}

  	public implementAction(action: Action) {

  		this._image = action.image

  		this._dockerService.versions(action.image.uniqueName()).subscribe((images) => {

        let ref: RuntimeUpdateComponent = this
        this._dialogRef = this._matDialog.open(DockerImageVersionsComponent, {
          height: '80%',
          width: '80%',
          data: { dataSource: images, currentVersion: action.image.version(), selectHandler: (image) => {

              if (image != null)
                ref.updateVersion(image)
              else
               ref._dialogRef.close()

            }}
        })
      })
  	}

  	private updateVersion(image: DockerImage) {

      let haveChange: boolean = false

      this._image.testStatus = image.testStatus

      //let nextVersion: string = this._image.latestVersion().version()
      let nextVersion = image.version()
      let currentVersion = nextVersion

      this.selectedDeployment.containers.forEach((c) => {

         if (c.name() == image.name()) {

           if (c.version() != image.version()) {
             this.updateContainersRefs(c.altName, image.tag())
           } else {
             this.removeContainerRef(c.altName)
           }

           currentVersion = c.version()
           //c.setVersion(nextVersion)
           //c.testStatus = image.testStatus
         }

         haveChange = haveChange || nextVersion != currentVersion
       })

      this._dialogRef.close()

      if (haveChange)
        this.flagHaveActions(true)
    }

  	public commitUpdate() {

  		this.updateButton.disabled = true

  		this._k8sService.updateVersion(this.selectedDeployment, this._containersToUpdate, this.selectedEnvironment).subscribe(result=> {

            //this.updateButton.disabled = false

            if (!result) {
                this._snackBar.open("Update failed", "Bugger", {
                    duration: 2000,
                })
              } else {

                this._snackBar.open("Update Successful", "Dismiss", {
                    duration: 2000,
                })

                this._containersToUpdate = []
                this.haveActions = false
                this.selectedImage = null
                this.currentVersion = this.selectedDeployment.version
                this.confirmUpdate()
              }
  		})
  	}

    public flagHaveActions(haveChanges: boolean) {

      this.haveActions = haveChanges

      if (this.updateButton)
        this.updateButton.disabled = false
    }

    private updateContainersRefs(name: string, tag: string) {

  	  let matched: string = null

  	  this._containersToUpdate.forEach((c) => {
  	    if (c.name == name) {
          matched = c.image
          c.image = tag
        }
      })

  	  if (matched == null) {
  	    this._containersToUpdate.push(new K8sContainerRef(name, matched, tag))
      }
    }

  private removeContainerRef(name: string) {

    let remove = -1
    let count = 0
    this._containersToUpdate.forEach((c) => {
      if (c.name = name) {
        remove = count
      }

      count += 1
    })

    if (remove != -1) {
      this._containersToUpdate.splice(remove, 1)
    }
  }

  	private confirmUpdate() {

      let refs: any[] = []

      for (var i=0; i < this.references.length; i++) {

        let ref: any = this.references[i]
        ref.version = this.selectedDeployment.containers[i].latestVersion()

        refs.push(ref)
      }

      this.references = refs
    }
}
