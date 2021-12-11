import { Component, OnInit }                          from '@angular/core'
import { Router }                                     from '@angular/router'

import { Settings }                                   from '../settings'

import { DockerImage }                   			        from '../models/docker-image'

import { DockerService }                              from '../services/docker.service'
import {ConfigurationService}                         from '../services/configuration.service'

@Component({
  selector: 'build',
  templateUrl: '../templates/build.html',
  styleUrls: ['../templates/build.css']
})

export class BuildComponent {

    public baseSource: DockerImage[]
    public customSource: DockerImage[]

    public panelOpenState: boolean = false
    public settingsLoaded: boolean = false

    public sagImageCounter: number = -1
    public customImageCounter: number = -1

    public deploymentSets: string[] = []

	  public constructor(private _router: Router, private _settings: Settings, private _configService: ConfigurationService, private _dockerService: DockerService) {

      console.log("constructor")

      this._settings.values().subscribe((v) => {

        this.settingsLoaded = true

        this._settings.setCurrentPage("build")

        this._configService.deploymentSets().subscribe((r) => {

          this.deploymentSets = r
        })
      })
    }

    public ngOnInit() {
    }

    public sagImageCount(count) {

        this.sagImageCounter = count
    }

    public customImageCount(count) {

        this.customImageCounter = count
    }

    public goInstall() {

        this._router.navigate(['build/install'])
    }

    public goBuild() {

        this._router.navigate(['build/image'])
    }

    public gotoSourceCode(sourceName: string) {
      this._router.navigate(['build/package', {id:sourceName}])
    }
  }
