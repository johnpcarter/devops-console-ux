import {Component, OnDestroy, OnInit} from '@angular/core'
import {DomSanitizer} from '@angular/platform-browser'
import {Router} from '@angular/router'

import {MatDialog} from '@angular/material/dialog'

import {Container, Deployment, RunSet} from '../models/project'
import {ConfigurationService} from '../services/configuration.service'
import {DockerService} from '../services/docker.service'
import {TestTraceService} from '../services/test-trace.service'

import {Settings} from '../settings'
import {FormControl} from '@angular/forms'
import {BuildExeComponent} from './build-exe.component'
import {TestStatus} from '../models/docker-image'

@Component({
  selector: 'runtime-containers',
  templateUrl: '../templates/runtime-containers.html',
  styleUrls: ['../templates/runtime-containers.css']
})

export class RuntimeContainersComponent implements OnInit, OnDestroy {

  public viewType: string = 'list'

  public templates: string[] = []
  public selectedDeploymentName: string
  public selectedRuntime: RunSet
  public containers: Container[] = []
  public selectedContainers: Container[]
  public cachedContainerStatus: Map<String, TestStatus>

  public spinner: boolean = false

  public includeTestsCtrl: FormControl
  private _test: boolean
  private _uploadAPIS: boolean
  private _stop: boolean
  private _msr: string
  private _host: string

  public constructor(private _router: Router, private _settings: Settings, private _configService: ConfigurationService, private _dialog: MatDialog,
                     private _dockerService: DockerService, private _testMgr: TestTraceService, private _sanitizer: DomSanitizer) {

    this.cachedContainerStatus = new Map()
    this.templates = []
    this.templates.push('All Containers')

    this._settings.values().subscribe((s) => {

      if (s.dockerHost)
        this._host = s.dockerHost.substring(0, s.dockerHost.indexOf(":"))
      else
        this._host = "localhost"

      if (this._host == 'host.docker.internal')
        this._host = 'localhost'

      this._settings.setCurrentPage('deploy')
    })

    if (this._settings.currentRuntime) {
      this.selectedDeploymentName = this._settings.currentRuntime
    } else {
      this.selectedDeploymentName = this.templates[0]
    }

    this._configService.runSets().subscribe((runs) => {
      runs.forEach((r) => {
        this.templates.push(r)
      })
    })

    this.includeTestsCtrl = new FormControl()
  }

  public ngOnInit() {

    let ref: RuntimeContainersComponent = this
    this._settings.values().subscribe((v) => {

      ref._refresh(true)
    })
  }

  public ngOnDestroy() {

  }

  public deploymentSelectionChanged(onInit?: boolean) {

    this.spinner = true

    this._settings.currentRuntime = this.selectedDeploymentName

    if (this.selectedDeploymentName && this.selectedDeploymentName != this.templates[0]) {

      this._configService.runSet(this.selectedDeploymentName).subscribe((run) => {

        this.selectedRuntime = run
        this.selectedContainers = []

        this.selectedRuntime.deployments.forEach((s) => {

          s.containers.forEach((c) => {
            var copy = c.copy()
            this.selectedContainers.push(copy)
            copy.getTestStatus(this.selectedRuntime.name, this._testMgr)
          })

          this.filterContainers(onInit)
        })
      })
    } else {
      this.selectedRuntime = null
      this.selectedContainers = null
      this.filterContainers(onInit)
    }
  }

  public filterContainers(onInit?: boolean) {

    // this is where we combine info from running containers with our deployment, so we know what is or isn't running!

    this._dockerService.containers().subscribe((containers) => {

      if (this.selectedContainers) {

        var cc: Container[] = []

        console.log('****** selected containers count is ' + this.selectedContainers.length + 'of ' + containers.length)

        this.selectedContainers.forEach((c) => {

          c.testStatus = this.cachedContainerStatus.get(c.id)
          this.mergeContainerRuntimeInfo(c, containers)

          cc.push(c)
        })

        this.containers = cc
      } else {
        // no filter

        this.containers = containers
      }

      if (onInit) {
        this.onInitialLoadCompleted(containers.length)
      }

      this.spinner = false
    })
  }

  private onInitialLoadCompleted(containerCount: number) {

    if (containerCount == 0) {

      // no running containers
      // so navigate to more appropriate page

      this._configService.runSets().subscribe((runs) => {

        if (runs.length == 0) {
          // no runs, but do we have any applicable images to run
          // if so go to run page, otherwise build page

          this._dockerService.customImages(false).subscribe((images) => {

            if (images.length === 0) {
              this._router.navigate(['image'])
            } else {
              this._router.navigate(['run'])
            }
          })
        }
      })
    }
  }

  private _refresh(onInit: boolean) {

    if (onInit) {
      this.spinner = true
    }

    if (this.selectedDeploymentName && this.selectedDeploymentName != 'All Containers')
      this.deploymentSelectionChanged(onInit)
    else
      this.filterContainers(onInit)

    if (!this._stop) {
      const ref: RuntimeContainersComponent = this
      setTimeout(() => {
        ref._refresh(false)
      }, 10000)
    }
  }

  private mergeContainerRuntimeInfo(container: Container, runningContainers: Container[]) {

    var found: Container = null

    for (let i = 0; i < runningContainers.length; i++) {

      if (runningContainers[i].name.indexOf(container.name) !== -1) {
        found = runningContainers[i]
        break
      }
    }

    if (found) {

      container.id = found.id
      container.state = found.state
      container.status = found.status
      container.description = found.description
      container.created = found.created
      container.runningVersion = found.runningVersion

      if (container.type == "msr" && container.status.indexOf("(healthy") != -1) {
        // ping for test status

        this._msr = "http://" + this._host + ":" + container.environmentSettings(this._settings.currentEnvironment).ports[0].external
      }
    } else {
      // h'mmm

      container.id = "??????"
      container.state = "missing"
    }
  }

  public setIncludeTests(event: any) {

    this._test = event.checked
  }

  public uploadAPIs(event: any) {

    this._uploadAPIS = event.checked
  }

  public startContainers() {

    this.spinner = true

    let dialogRef = this._dialog.open(BuildExeComponent, {
      width: '80%',
      height: '80%',
      data: {run: this.selectedRuntime, includeTests: this._test, uploadAPIs: this._uploadAPIS},
    })

    dialogRef.afterClosed().subscribe(result => {

      let ref: RuntimeContainersComponent = this

      setTimeout(() => {
        ref.spinner = false
        ref.deploymentSelectionChanged()
      }, 500)
    })
  }

  public stopContainers() {

    this.spinner = true

    this._dockerService.stop(this.selectedRuntime).subscribe((result) => {

      this.spinner = false

      let ref: RuntimeContainersComponent = this
      setTimeout(() => {
        ref.selectedDeploymentName = null
        ref.filterContainers()
      }, 1500)
    })
  }

  public stopContainer(container: Container) {

    this.spinner = true

    this._dockerService.stopContainer(container.id).subscribe((result) => {

      let ref: RuntimeContainersComponent = this
      setTimeout(() =>  {
        ref._refresh(false)
        ref.spinner = false
      }, 1000)
    })
  }

  public haveRunningContainers() {

    if (!this.containers) {
      return false
    }

    let running: boolean = false

    for (var i = 0; i < this.containers.length; i++) {

      if (!this.containers[i].id.startsWith('??')) {
        running = true
        break
      }
    }

    return running
  }

  public haveMissingContainer() {

    if (!this.containers) {
      return true
    }

    let missing: boolean = false

    for (var i = 0; i < this.containers.length; i++) {

      if (this.containers[i].id.startsWith('??')) {
        missing = true
        break
      }
    }

    return missing
  }

  public haveSelectedAPIGateway(): boolean {

    let found: boolean = false

    for (let i = 0; i < this.containers.length; i++) {

      if (this.containers[i].type == 'apigw') {
        found = true
        break
      }
    }

    return false
  }
}
