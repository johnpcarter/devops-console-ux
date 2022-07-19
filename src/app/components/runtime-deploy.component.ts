import { Component, OnInit, ViewChild} from '@angular/core'

import { ActivatedRoute, Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map} from 'rxjs/operators'
import { FormBuilder, FormControl, FormGroup} from '@angular/forms'

import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { SelectionModel } from '@angular/cdk/collections'
import { DockerImage } from '../models/docker-image'
import { APIDefinition} from '../models/wm-package-info'
import { ContainerSet, RunSet} from '../models/project'
import { Container, ContainerType} from '../models/container'
import { BuildCommand, Builder, DeploymentSet } from '../models/build'
import { Property, PropertyValueType } from '../models/properties'
import {Arg, Environment} from '../models/environment'

import { Settings } from '../settings'

import { ResourceService } from '../services/resources.service'
import { DockerService} from '../services/docker.service'
import { ConfigurationService} from '../services/configuration.service'

import { EditContainerComponent} from './staging.component'
import { ContainerTemplates} from '../support/container.templates'
import { BuildExeComponent} from './build-exe.component'
import {SimpleNameComponent} from './elements/simple-name.component'

@Component({
  selector: 'runtime-deploy',
  templateUrl: '../templates/runtime-deploy.html',
  styleUrls: ['../templates/runtime-deploy.css']
})

export class RuntimeDeployComponent implements OnInit {

  public setupOkay: boolean = false
  public isLinearStepper: boolean = true

  public deployTypeFormGroup: FormGroup
  public containerFormGroup: FormGroup
  public finaliseFormGroup: FormGroup

  public runSets: string[] = []
  public currentRunSet: RunSet
  public currentRunSetInitialised: boolean

  public builds: string[]

  public baseImages: DockerImage[] = []
  public customImages: DockerImage[] = []
  public allImages: DockerImage[] = []

  public buildListCtrl: FormControl
  public showKubernetesCtrl: FormControl
  public runSetCtrl: FormControl
  public includeTestsCtrl: FormControl
  public uploadAPICtrl: FormControl
  public pullCtrl: FormControl
  public runTypeCtrl: FormControl

  public downloadCtrl: FormControl

  public apiDisplayedColumns: string[] = ['select', 'name', 'description']
  public selectedAPIs: SelectionModel<APIDefinition> = new SelectionModel<APIDefinition>(true, [])
  public apis: APIDefinition[] = []
  public selectedImages: string[]
  public running: boolean = false
  public starting: boolean = false
  public isTemplate: boolean = false

  public packages: string[] = []

  public propertyFiles: string[] = []

  private addedApisControls: boolean = false
  private _ignoreValuesChange: boolean = false

  private _dockerHost: string

  private _id: string = null

  @ViewChild('downloadLink')
  private _downloadLink

  public constructor(private _router: Router, private _inboundRouter: ActivatedRoute, private _snackBar: MatSnackBar, private _settings: Settings, private _dockerService: DockerService, private _dialog: MatDialog,
                     private _formBuilder: FormBuilder, private _resources: ResourceService, private _configService: ConfigurationService, private _containerTemplates: ContainerTemplates) {

    let sub = this._inboundRouter.params.subscribe(params => {

      this._id = params['id']

    })

    this.runSets = []
    this._configService.runSets().subscribe((p) => {
      this.runSets = p

      if (this._id) {
        this.setTemplate(this._id)
      }
    })

    this.builds = []
    this._configService.builds().subscribe((builds) => {

      builds.forEach((b) => {
        this.builds.push(b)
      })
    })

    this._settings.values().subscribe((v) => {
      this._dockerHost = v.dockerHost

      this.baseImages = []
      this._dockerService.sagImages(false).subscribe((d) => {

        this.baseImages = d

       // this.baseImages.unshift(new DockerImage('EXTERNAL'))

        this._dockerService.customImages(false).subscribe((images) => {

          this.customImages = images
          this.setupOkay = true
        })

        this._dockerService.baseImages(false).subscribe((r) => {
          this.allImages = r
        })
      })

      this.propertyFiles = []

      this._resources.resourcesForType('properties').subscribe((p) => {

        this.propertyFiles = []
        p.forEach((f) => {
          this.propertyFiles.push(f.name)
        })
      })

      this._settings.setCurrentPage('run', this._id)
    })

    this.currentRunSet = new RunSet()
    this.currentRunSet.name = ''

    this.buildListCtrl = new FormControl()
    this.showKubernetesCtrl = new FormControl()
    this.runSetCtrl = new FormControl()

    this.runTypeCtrl = new FormControl('docker')
    this.includeTestsCtrl = new FormControl()
    this.uploadAPICtrl = new FormControl()
    this.pullCtrl = new FormControl()
    this.downloadCtrl = new FormControl(true)

    this.deployTypeFormGroup = this._formBuilder.group({
      buildListCtrl: this.buildListCtrl,
      showKubernetesCtrl: this.showKubernetesCtrl,
      runSetCtrl: this.runSetCtrl
    })

    this.containerFormGroup = this._formBuilder.group({})

    this.finaliseFormGroup = this._formBuilder.group({
      includeTestsCtrl: this.includeTestsCtrl,
      uploadAPICtrl: this.uploadAPICtrl,
      pullCtrl: this.pullCtrl,
      downloadCtrl: this.downloadCtrl,
      runTypeCtrl: this.runTypeCtrl
    })
  }

  public ngOnInit() {

    this.deployTypeFormGroup.valueChanges.subscribe((d) => {

      if (this._ignoreValuesChange) {
        return
      }

      if (this.buildListCtrl.dirty) {
        this.setBuildsForRunSet(this.buildListCtrl.value)
        this.buildListCtrl.markAsPristine()
      } else if (this.showKubernetesCtrl.dirty) {
        this.currentRunSet.useKubernetes = this.showKubernetesCtrl.value
        this.runTypeCtrl.setValue(this.currentRunSet.useKubernetes ? 'k8s' : 'docker')
        ContainerTemplates.setDefaultsForK8s(this.currentRunSet)
        this._save()
        this.showKubernetesCtrl.markAsPristine()

        this.refreshContainerPortsList()

      } else if (this.runSetCtrl.dirty && this.runSetCtrl.value.length > 0 && this.runSetCtrl.value != this.currentRunSet.name) {
        this.setTemplate(this.runSetCtrl.value)
        this.runSetCtrl.markAsPristine()
      }
    })
  }

  public buildOptionStyle(value: string): any {

    if (this.buildListCtrl.value && this.buildListCtrl.value.length > 0) {
      return {"color": "gray"}
    } else {
      return {}
    }
  }

  public labelForBuild() {

    if (this.currentRunSet.builds && this.currentRunSet.builds.length > 0 && this.currentRunSet.builds[0].name) {
      return 'Run: ' + this.currentRunSet.builds[0].name
    } else {
      return 'Select micro services'
    }
  }

  public haveBuildTemplates() {

    return this.builds && this.builds.length > 0
  }

  public goBuildPage() {

    this._router.navigate(['/image'])
  }

  public tabChanged(event: any) {

    if (this.isLinearStepper && event.previouslySelectedIndex == 2) {
      this.currentRunSetInitialised = true
    }
  }

  public containerConfigDidChange(ref: any) {

    let container: Container = ref.container
    let imageChanged: boolean = ref.imageChanged
    let previousValue: string = ref.previousValue

    if (container && (container.type == ContainerType.msr || container.buildRef != null)) {

      if (previousValue != null) {
        this.currentRunSet.removeBuild(previousValue)
      }

      if (imageChanged && container.buildRef != null) {
        this._setBuildForRunSet(container.buildRef, container.name)

        let svc: ContainerSet = this.currentRunSet.deploymentForContainer(container)

        if (svc) {
          this.setAPIEndPointForContainer(svc, container)
        }

        this.setAvailableAPIs()
      }
    } else if (previousValue != null) {
      // container was deleted, remove associated build

      if (this.currentRunSet.removeBuild(previousValue)) {

        let found = -1
        let l: string[] = this.buildListCtrl.value.copy

        for(let i = 0; i < l.length; i++) {
          if (l[i] === previousValue) {
            found = i
            break
          }
        }

        if (found != -1)
          l.splice(found, 1)
          this.buildListCtrl.setValue(l, {emitEvent: false})
      }
    }

    this._save()
  }

  public containerDidChange(container: Container) {

    this.currentRunSet.deployments.forEach((d) => {

      let found: number = -1

      for(let i = 0; i < d.containers.length; i++) {
        if (container == d.containers[i]) {
          found = i
          break
        }
      }

      if (found != -1) {
        d.containers[found] = container.copy()
      }
    })
  }

  public isExistingTemplate(): boolean {

    return this.currentRunSet && this.indexOfTemplate(this.currentRunSet.name) != -1
  }

  public addTemplate(event) {

    this.currentRunSet.name = this.runSetCtrl.value

    this._configService.uploadRunSet(this.currentRunSet).subscribe((success) => {

      this.isTemplate = true
      this.runSets.push(this.currentRunSet.name)
    })
  }

  public copyTemplate(event) {

    let dialogRef = this._dialog.open(SimpleNameComponent, {
      width: "600px",
      height: "150px",
      data: { title: "Name of new template" },
    })

    dialogRef.afterClosed().subscribe(result => {

      if (result) {

        this.runSetCtrl.setValue(result, {emitEvent: false, onlySelf: true})
        this.currentRunSet.name = result

        this._configService.uploadRunSet(this.currentRunSet).subscribe((success) => {

          this.isTemplate = true
          this.runSets.push(this.currentRunSet.name)
        })
      }
    })
  }

  public deleteTemplate(event) {

    var name = this.runSetCtrl.value

    this._configService.deleteRunSet(name).subscribe((success) => {

      this.runSets.splice(this.indexOfTemplate(name), 1)
      this.runSetCtrl.setValue('', {onlySelf: true, emitEvent: false})
      this.currentRunSet = new RunSet()
      this.isTemplate = false
    })
  }

  public deployments(): ContainerSet[] {

    if (this.currentRunSet && this.currentRunSet.deployments) {
      return this.currentRunSet.deployments
    } else {
      return []
    }
  }

  public haveSelectedAPIGateway(): boolean {

    let found: boolean = false

    for (let i = 0; i < this.currentRunSet.deployments.length; i++) {
      if (this.containerInServiceForType(this.currentRunSet.deployments[i], ContainerType.apigw) != null) {
        found = true
        break
      }
    }

    return found
  }

  public haveSelectedAPIPortal(): boolean {

    let found: boolean = false

    for (let i = 0; i < this.currentRunSet.deployments.length; i++) {
      if (this.containerInServiceForType(this.currentRunSet.deployments[i], ContainerType.apipr) != null) {
        found = true
        break
      }
    }

    return found
  }

  public haveMissingMicroGateway(): boolean {

    let missing: boolean = false

    for (let i = 0; i < this.currentRunSet.deployments.length; i++) {
      if (this.containerInServiceForType(this.currentRunSet.deployments[i], ContainerType.msr) != null) {
        missing = this.containerInServiceForType(this.currentRunSet.deployments[i], ContainerType.apimg) == null

        if (missing) {
          break;
        }
      }
    }

    return missing
  }

  public targetTag(build: Builder) {
    return build.targetImage.tag()
  }

  public labelForGoButton(): string {

    if (this.downloadCtrl.value) {
      return this.runTypeCtrl.value == 'docker' ? 'Run' : 'Deploy to K8s'
    } else {
      return this.runTypeCtrl.value == 'docker' ? 'Download' : 'Download K8s Definition'
    }
  }

  public go() {

    if (this.downloadCtrl.value) {
      this.run()
    } else {
      this.download()
    }
  }

  public run() {

    this.starting = true

    // build on server

    let dialogRef = this._dialog.open(BuildExeComponent, {
      width: '80%',
      height: '80%',
      data: {
        run: this.currentRunSet,
        runK8s: this.runTypeCtrl.value == 'k8s',
        includeTests: this.includeTestsCtrl.value,
        uploadAPIs: this.uploadAPICtrl.value,
        environment: this._settings.currentEnvironment == 'Default' ? null : this._settings.currentEnvironment
      },
    })

    dialogRef.afterClosed().subscribe(result => {
      this._save()
      this.starting = false

      if (result) {
        this._settings.currentRuntime = this.currentRunSet.name

        let ref: RuntimeDeployComponent = this
        setTimeout(() => {

          ref.starting = false

          if (result) {
            ref.running = true
            ref._router.navigate(['/deploy'])
          }
        }, 250)
      }
    })
  }

  public download() {

    this.starting = true

    this._dockerService.run(this.currentRunSet, this.runTypeCtrl.value == 'k8s', this.includeTestsCtrl.value || false, true, this.uploadAPICtrl.value, this._settings.currentEnvironment == 'Default' ? null : this._settings.currentEnvironment, this.pullCtrl.value).subscribe((file) => {

      if (file.type === null) {
        this._snackBar.open('Deployment generation failed', 'Dismiss', {duration: 5000})
      } else {
        this.starting = false

        let url = window.URL.createObjectURL(file)
        const link = this._downloadLink.nativeElement
        link.href = url

        if (file.type == 'application/zip') {
          link.download = 'deploy-' + this.currentRunSet.name + '.zip'
        } else { //if (file.type == "application/yaml") {
          if (this.runTypeCtrl.value === 'k8s') {
            link.download = 'k8s-create.' + this.currentRunSet.name + '.yaml'
          } else {
            link.download = 'docker-compose.' + this.currentRunSet.name + '.yaml'
          }
        }

        link.click()

        window.URL.revokeObjectURL(url)
      }
    })
  }

  public stop() {

    this.starting = true

    this._dockerService.stop(this.currentRunSet).subscribe((status) => {

      this.starting = false

      if (status) {
        this.running = false
      } else {
        window.alert('Oops, I\'m afraid I cannot allow you to do that Dave')
      }
    })

  }

  private _save() {

    if (!this.isTemplate) {
      return
    }

    console.log('saving run template')

    this._configService.uploadRunSet(this.currentRunSet).subscribe((success) => {

      var found: boolean = false

      if (this.runSets) {
        for (var i = 0; i < this.runSets.length; i++) {
          if (this.runSets[i] == this.currentRunSet.name) {
            found = true
            break
          }
        }
      }

      if (!found) {
        this.runSets.push(this.currentRunSet.name)
      }
    })
  }

  private setBuildsForRunSet(names: string[]) {

    this.currentRunSet.builds = []
    this.apis = []
    this.packages = []
    this.selectedImages = null

    names.forEach((n) => {
      this._setBuildForRunSet(n)
    })

    let removeList: number[] = []
    let i: number = 0
    this.currentRunSet.deployments.forEach((d) => {
      if (names.indexOf(d.name) == -1) {
          // remove if it contains a sub-container of type MSR.
          d.containers.forEach((c) => {
            if (c.name.toLowerCase() == d.name.toLowerCase() && c.type == 'msr') {
              removeList.push(i)
            }
          })

          i+= 1
      }
    })

    removeList.forEach((i) => {
      this.currentRunSet.deployments.splice(i, 1)
    })

    this._save()
  }

  private _setBuildForRunSet(name: string, containerName?: string) {

    this._configService.build(name).subscribe((b) => {

      if (!this.currentRunSet.hasBuild(b.name)) {
        this.currentRunSet.builds.push(b)
      }

      let found: DockerImage = this.imageFor(b.targetImage.name())

      if (found) {
        b.targetImage.setVersion(found.version())
      }

      this.setAvailableAPIs()
      this.setContainerForBuild(b, containerName)

      this._save()
    })
  }

  public clearTemplate() {

    this.isLinearStepper = true
    this.isTemplate = false
    this.selectedImages = null

    this.currentRunSet = new RunSet()
    this.currentRunSet.name = ""

    this.runSetCtrl.setValue(null, {emitEvent: false})
    this.buildListCtrl.setValue("", {emitEvent: false})
    this.showKubernetesCtrl.setValue("", {emitEvent: false})
    this.includeTestsCtrl.setValue("", {emitEvent: false})
    this.uploadAPICtrl.setValue("", {emitEvent: false})
    this.runTypeCtrl.setValue("docker", {emitEvent: false})

    this.downloadCtrl.setValue(true, {emitEvent: false})

    this.packages = []
    this.apis = []
  }

  public downloadConfiguration(): void {

    this._configService.downloadRunSet(this.currentRunSet.name)
  }

  private setTemplate(name: string): boolean {

    if (this.indexOfTemplate(name) != -1) {

      this.currentRunSet = new RunSet()

      this._configService.runSet(name).subscribe((runSet) => {

        runSet.name = name
        this.isLinearStepper = false
        this.currentRunSetInitialised = true
        this.isTemplate = true
        this.currentRunSet = runSet
        this.runSetCtrl.setValue(name, {emitEvent: false})
        this.updateForms()
        this.refresh()
      })

      return true

    } else {
      this.isTemplate = false
      this.currentRunSet.name = this.runSetCtrl.value
      return false
    }
  }

  private refresh() {

    let refreshedBuilds: Builder[] = []

    if (!this.currentRunSet.builds && this.currentRunSet.builds.length > 0)
      return

    this.currentRunSet.builds.forEach((b) => {
      this._configService.build(b.name).subscribe((build) => {

        refreshedBuilds.push(build)

        let refreshedDeployments: DeploymentSet[] = []
        build.deployments.forEach((d) => {

          this._configService.deploymentSet(d.name).subscribe((deploymentset) => {

            refreshedDeployments.push(deploymentset)
            build.deployments = refreshedDeployments
            this.replaceBuildsList(refreshedBuilds)
          })
        })
      })
    })
  }

  private replaceBuildsList(builds: Builder[]) {

    if (builds.length > 0) {

      this.currentRunSet.builds = builds
      this.updateForms()
      this._save()
    } else {

      // not ready yet

      let ref: RuntimeDeployComponent = this
      setTimeout(() => {
        ref.replaceBuildsList(builds)
      }, 500)
    }
  }

  private updateForms() {

    // update main build and runtime container version to latest

    this._ignoreValuesChange = true

    let names: string[] = []

    if (this.currentRunSet.builds && this.currentRunSet.builds.length > 0) {
      this.currentRunSet.builds.forEach((b) => {

        names.push(b.name.replace(/\-/g, " "))

        if (b.targetImage) {
          let latest: DockerImage = b.targetImage.id ? this.imageFor(b.targetImage.id) : null

          if (latest) {
            b.targetImage.setVersion(latest.version())
          }
        }
      })
    }

    this.buildListCtrl.setValue(names)

    this.runTypeCtrl.setValue(this.currentRunSet.useKubernetes ? 'k8s' : 'docker')

    if (this.currentRunSet.useKubernetes === 'true') {
      this.showKubernetesCtrl.setValue(true)
    }

    this.refreshContainerPortsList()

    this.setAvailableAPIs()

    if (this.currentRunSet) {

      this.selectedAPIs.clear()

      this.currentRunSet.deployments.forEach((s) => {

        s.apis.forEach((api) => {
          this.selectedAPIs.select(this.apiSelection(api.name))
        })
      })
    }

    this._ignoreValuesChange = false
  }

  private setAvailableAPIs(): APIDefinition[] {

    this.apis = []
    this.packages = []

    if (this.currentRunSet && this.currentRunSet.builds && this.currentRunSet.builds.length > 0) {

      this.selectedImages = []

      this.currentRunSet.builds.forEach((build) => {

        this.selectedImages.push(build.targetImage.uniqueName())

        if (build.deployments) {

          build.deployments.forEach((d) => {

            d.source[0].repositories.forEach((r) => {
              r.include.forEach((p) => {
                this.packages.push(p)
              })
            })

            d.apis.forEach((a) => {
              a.deployment = build.name
              this.apis.push(a)
            })
          })
        }
      })
    } else {
      this.selectedImages = null
    }

    return this.apis
  }

  private apiSelection(id: string): APIDefinition {

    var api: APIDefinition = null

    for (var i = 0; i < this.apis.length; i++) {
      if (this.apis[i].name == id) {
        api = this.apis[i]
        break
      }
    }

    return api
  }

  private indexOfTemplate(name): number {

    if (!name || !this.runSets) {
      return -1
    }

    var found: number = -1

    for (var i = 0; i < this.runSets.length; i++) {

      if (this.runSets[i] == name) {
        found = i
        break
      }
    }

    return found
  }

  private setContainerForBuild(b: Builder, containerName?: string): void {

    let container: Container = this.currentRunSet.containerInDeploymentFor(containerName || b.hyphenatedName())

    if (!container) {

      this.currentRunSet.namespace = 'webmethods'

      let service: ContainerSet = new ContainerSet(this.currentRunSet.namespace)
      service.name = b.name
      service.apis = this.selectedAPIs.selected

      let container: Container = new Container()
      container.name = b.hyphenatedName()
      container.type = ContainerType.msr
      container.buildRef = b.name

      this._containerTemplates.configureContainerFor(container, b.targetImage, b.deploymentType || 'msr', this._settings.currentEnvironment).subscribe((success) => {

        container.name = b.hyphenatedName()
        container.description = b.name
        this.setAPIEndPointForContainer(service, container)

        this.updateEnvWithRequiredProperties(container, b)

        service.containers.push(container)
        this.currentRunSet.deployments.push(service)
      })
    } else {
      this.updateEnvWithRequiredProperties(container, b)
    }
  }

  private updateEnvWithRequiredProperties(container: Container, b: Builder) {

    this.propertiesForBuild(b).subscribe((properties) => {

      if (container.environments) {

        container.environments.forEach((env) => {
          this._updateEnvProperties(container, b, env.env, properties)
        })
      } else {
        let args: Arg[] = []
        this._updateEnvProperties(container, b, args, properties)
        container.environments = []
        let env: Environment = new Environment()
        env.env = args
        container.environments.push(env)
      }

      this.containerDidChange(container)
    })
  }

  private _updateEnvProperties(container: Container, b: Builder, args: Arg[], properties: Property[]) {

    properties.forEach((p) => {
      if (!this.hasEnvironmentVariable(args, p.value)) {
        args.push(new Arg(p.value, "", p.description, true))
      }
    })
  }

  private hasEnvironmentVariable(args: Arg[], id: string): boolean {

    let found: boolean = false

    for (let i=0; i< args.length; i++) {

      if (args[i].source == id) {
        found = true
        break
      }
    }

    return found
  }

  private propertiesForBuild(builder: Builder): Observable<Property[]> {

    let propCommand: BuildCommand = null

    for (let i=0; i < builder.buildCommands.length; i++) {
      if (builder.buildCommands[i].fileType == 'properties') {
        propCommand = builder.buildCommands[i]
        break
      }
    }

    let props: Property[] = []

    if (propCommand != null) {
      return this._resources.getResourceContent("properties", propCommand.source).pipe(map((data) => {

        data.properties.forEach((p) => {

          let property = Property.make(p)
            if (property.type == PropertyValueType.environment) {
              props.push(property)
            }
        })

        return props
      }))
    } else {
      return of([])
    }
  }

  private setAPIEndPointForContainer(svc: ContainerSet, c: Container) {

    svc.apis.forEach((a) => {
      a.endPoint = c.name + ':' + c.environmentSettings(this._settings.currentEnvironment).ports[0].internal
    })
  }

  private addAPIGatewayContainer(gatewayImage?: DockerImage) {

    let apiService: ContainerSet = this.serviceFor('API Management')

    if (apiService == null) {
      apiService = new ContainerSet(this.currentRunSet.namespace)
      apiService.name = 'API Management'

      this.currentRunSet.deployments.unshift(apiService)
    }

    let apiServiceContainer: Container = this.containerInServiceForType(apiService, ContainerType.apigw)

    if (apiServiceContainer == null) {

      apiServiceContainer = new Container()
      apiServiceContainer.type = ContainerType.apigw

      this._containerTemplates.configureContainerFor(apiServiceContainer, gatewayImage, 'apigw', this._settings.currentEnvironment).subscribe((success) => {

        if (gatewayImage != null) {
          apiServiceContainer.image = gatewayImage.tag()

          if (apiServiceContainer.name == null) {
            apiServiceContainer.name = gatewayImage.name()
          }
        }

        apiServiceContainer.description = 'API Gateway'
      })

      apiService.containers.unshift(apiServiceContainer) //. push to top, must be started before api implementation
    }

    this.currentRunSet.builds.forEach((b) => {

      let service: ContainerSet = this.serviceFor(b.name)

      if (service != null) {
        let msrContainer: Container = this.containerInServiceForType(service, ContainerType.msr)
        if (msrContainer != null) {
          this.setMicroServicePropertiesForAPIGatway(msrContainer, apiServiceContainer)
        }
      }
    })
  }

  private setMicroServicePropertiesForAPIGatway(msrContainer: Container, apiServiceContainer: Container) {

    msrContainer.addEnvironmentVariable(new Arg('api_gateway_url', 'http://' + apiServiceContainer.name + ':' + apiServiceContainer.environmentSettings(this._settings.currentEnvironment).ports[0].internal, 'API Gateway URL'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_user', 'Administrator', 'API Gateway User'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_password', 'manage', 'API Gateway Password'), this._settings.currentEnvironment)

    msrContainer.addEnvironmentVariable(new Arg('api_gateway_allow_update', 'false', 'Defines whether latest API definition should replace any already uploaded API'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_default_maturity', 'beta', 'Sets the maturity label of the uploaded API'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_default_grouping', '', 'Assigns the API to specified group'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_default_version', '', 'Default version to be applied to any uploaded APIs'), this._settings.currentEnvironment)
    msrContainer.addEnvironmentVariable(new Arg('api_gateway_default_app', '', 'Default application to be assigned to any uploaded APIs (Will be created if doesn\'t exist)'), this._settings.currentEnvironment)
  }

  private addMicrogatewayContainer( type: string, microGatewayImage?: DockerImage) {

    this.currentRunSet.deployments.forEach((d) => {

      let container: Container

      if ((container = d.containerForType('msr')) != null) {
        this._setMicrogatewayContainer(microGatewayImage, d, type, container)
      }
    })
  }

  private _setMicrogatewayContainer(microGatewayImage: DockerImage, deploymentLayer: ContainerSet, type: string, microServiceContainer: Container) {

    let microContainer: Container = this.containerInServiceForType(deploymentLayer, ContainerType.apimg)
    let selectedAPIS: string = this.containerAPIs()

    if (microContainer == null) {
      microContainer = new Container()
      microContainer.description = 'Micro Gateway'
      microServiceContainer.type = ContainerType.apimg
    }

    microContainer.name = microServiceContainer.name + '-gateway'

    if (type == 'env') {

      this._containerTemplates.configureContainerFor(microContainer, microGatewayImage, 'apimg', this._settings.currentEnvironment).subscribe((success) => {

        microContainer.environmentSettings(this._settings.currentEnvironment).env.push(new Arg('mcgw_downloads_apis', selectedAPIS, 'comma separated list of API\'s to be managed by micro gateway'))

        let arg: Arg = microContainer.environmentVariable('api_server_url', this._settings.currentEnvironment)

        if (arg) {
          arg.target.replace('wm-msr', microServiceContainer.name)
        }

        console.log('arg ' + arg.target)

      })
    } else {
      this._containerTemplates.configureContainerFor(microContainer, microGatewayImage, 'apimg-standalone', this._settings.currentEnvironment).subscribe((success) => {
        // do now't
      })
    }

    deploymentLayer.containers.push(microContainer)

    let i = ContainerTemplates.indexOfAttribute(microContainer, 'api_url', this._settings.currentEnvironment)

    if (i != -1) {
      let container: Container = this.containerInServiceForType(deploymentLayer, ContainerType.msr)
      microContainer.environmentSettings(this._settings.currentEnvironment).env[i].target = 'http://' + container.name + ':' + container.environmentSettings(this._settings.currentEnvironment).ports[0].internal
    }

    if (microGatewayImage != null) {
      microContainer.image = microGatewayImage.tag()
    }
  }

  private addPortalContainer(image?: DockerImage) {

    let apiService: ContainerSet = this.serviceFor('API Management')

    if (apiService == null) {
      apiService = new ContainerSet(this.currentRunSet.namespace)
      apiService.name = 'API Management'

      this.currentRunSet.deployments.push(apiService)
    }

    let apiServiceContainer: Container = this.containerInServiceForType(apiService, ContainerType.apipr)

    if (apiServiceContainer == null) {

      apiServiceContainer = new Container()
      apiServiceContainer.type = ContainerType.apipr

      this._containerTemplates.configureContainerFor(apiServiceContainer, image, 'apipr', this._settings.currentEnvironment).subscribe((success) => {
        apiService.containers.push(apiServiceContainer)
      })
    }

    apiServiceContainer.image = image.tag()
    apiServiceContainer.active = '' + (image.name() != 'EXTERNAL')
  }

  private containerAPIs(): string {

    let apis: string = ''

    this.currentRunSet.deployments.forEach((s) => {
      s.apis.forEach((a) => {
        if (apis.length > 0) {
          apis = apis + ',' + a.name
        } else {
          apis = a.name
        }
      })
    })

    return apis
  }

  private serviceFor(id: string): ContainerSet {

    if (this.currentRunSet == null) {
      return
    }

    let found: ContainerSet = null

    for (var i = 0; i < this.currentRunSet.deployments.length; i++) {

      if (this.currentRunSet.deployments[i].name == id) {
        found = this.currentRunSet.deployments[i]
        break
      }
    }

    return found
  }

  private containerInServiceForType(service: ContainerSet, type: ContainerType): Container {

    let found: Container = null

    for (let i = 0; i < service.containers.length; i++) {

      if (service.containers[i].type == type) {
        found = service.containers[i]
        break
      }
    }

    return found
  }

  private containerIndexInServiceFor(service: ContainerSet, type: ContainerType): number {

    let found: number = -1

    for (var i = 0; i < service.containers.length; i++) {

      if (service.containers[i].type == type) {
        found = i
        break
      }
    }

    return found
  }

  private imageFor(id: string, tag?: string): DockerImage {

    let found: DockerImage = null

    for (var i = 0; i < this.customImages.length; i++) {

      if (this.customImages[i].name() == id ||
        (tag && tag.endsWith(this.customImages[i].tag()))) {
        found = this.customImages[i]
        break
      }
    }

    if (!found) {

      for (var i = 0; i < this.baseImages.length; i++) {

        if (this.baseImages[i].name() == id ||
          (tag && tag.endsWith(this.baseImages[i].tag()))) {
          found = this.baseImages[i]
          break
        }
      }
    }

    return found
  }

  public colorForContainer(container: Container) {

    if (container.active == 'true') {
      return 'primary'
    } else if (container.hostname) {
      return 'accent'
    } else {
      return 'gray'
    }
  }

  public editContainer(container: Container, event: any) {

    let x = event.pageX
    let y = event.pageY

    let dialogRef = this._dialog.open(EditContainerComponent, {
      data: {container: container, formBuilder: this._formBuilder},
      width: '360px',
      height: '360px',
    })

    console.log("left: '${x}px', top: '${y}px'")

    dialogRef.updatePosition({left: x + "px", top: y + "px"})

    dialogRef.afterClosed().subscribe(container => {
      console.log(`Dialog result: ${container}`)

      this._save()
    })
  }

  private refreshContainerPortsList() {

    this.currentRunSet.deployments.forEach((s) => {
      s.containers.forEach((c) => {
        c.environmentSettings(this._settings.currentEnvironment).ports = Object.assign([], c.environmentSettings(this._settings.currentEnvironment).ports)
      })
    })
  }
}
