import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'

import { MatTable } from '@angular/material/table'
import { MatSelectChange } from '@angular/material/select'

import { DockerImage } from '../models/docker-image'
import { DockerBuild } from '../models/docker-build'

import { ContainerTemplates } from '../support/container.templates'
import { Container, ContainerType} from '../models/container'
import { Environment, Arg, Port, Volume } from '../models/environment'
import { BuildCommand } from '../models/build'

import { DockerService } from '../services/docker.service'

import { Settings } from '../settings'
import {ResourceService} from '../services/resources.service';

@Component({
  selector: 'container',
  templateUrl: '../templates/container.html',
  styleUrls: ['../templates/container.css']
})

export class ContainerComponent implements OnInit, OnChanges {

  public static seq: number = 0

  @Input()
  public container: Container

  @Input()
  public images: DockerImage[]

  @Input()
  public showK8sFields: boolean

  @Input()
  public builds: string[]

  @Output()
  public containerUpdated: EventEmitter<any> = new EventEmitter()

  @Output()
  public deleteContainer: EventEmitter<Container> = new EventEmitter()

  public nextSeq: number = 0
  public environments: string[] = ['Default']
  public selectedEnvironment: string = 'Default'

  public defaultEnvironmentSettings: Environment
  public selectedEnvironmentSettings: Environment

  public formGroup: FormGroup

  public containerNameCtrl: FormControl
  public containerImageCtrl: FormControl
  public containerDescriptionCtrl: FormControl
  public containerTypeCtrl: FormControl
  public containerUserCtrl: FormControl
  public containerPasswordCtrl: FormControl

  public _displayedPortColumnsEdit: string[] = ['externalEdit', 'internalEdit', 'typeEdit', 'descriptionEdit', 'remove']
  public _displayedPortColumnsReadOnly: string[] = ['external', 'internal', 'type', 'description']
  public _displayedPortColumnsK8sEdit: string[] = ['ks8TypeEdit', 'internalEdit', 'externalEdit', 'typeEdit', 'descriptionEdit', 'remove']
  public _displayedPortColumnsK8sReadOnly: string[] = ['ks8Type', 'external', 'internal', 'type', 'description']

  public _displayedArgColumnsEdit: string[] = ['srcEdit', 'tgtEdit', 'descriptionEdit', 'remove']
  public _displayedArgColumnsReadOnly: string[] = ['src', 'tgt', 'description']

  public _displayedVolumeColumnsEdit: string[] = ['srcEdit', 'tgtEdit', 'descriptionEdit', 'remove']
  public _displayedVolumeReadOnly: string[] = ['src', 'tgt', 'description']
  public _displayedVolumeColumnsK8sEdit: string[] = ['srcEdit', 'tgtEdit', 'k8sStorageTypeEdit', 'k8sAccessModeEdit', 'k8sCapacityEdit', 'descriptionEdit', 'remove']
  public _displayedVolumeK8sReadOnly: string[] = ['src', 'tgt', 'k8sStorageType', 'k8sAccessMode', 'k8sCapacity', 'description']

  public serviceTypes: string[] = ['ClusterIP', 'NodePort', 'Ingress']

  public displayedPortColumns: string[]
  public displayedArgColumns: string[]
  public displayedVolumeColumns: string[]

  public containerTemplatesTypes: string[] = ContainerTemplates.productCodes
  public portTypes: string[] = ['http', 'https', 'other']
  public accessModeTypes: string[] = ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnly']

  public editMode: boolean = false

  private _panelStatus: Map<string, boolean>
  private _ignoreChanges: boolean = false
  private _hasChanged: boolean = false

  @ViewChild('ports', {read: MatTable}) portsTable: MatTable<Port>
  @ViewChild('volumes', {read: MatTable}) volumesTable: MatTable<Arg>
  @ViewChild('env', {read: MatTable}) envTable: MatTable<Arg>

  public constructor(private _formBuilder: FormBuilder, private _dockerService: DockerService, private _resourcesSevices: ResourceService, private _containerTemplates: ContainerTemplates, private _settings: Settings) {

    this.nextSeq = ContainerComponent.seq++

    this._settings.environments().subscribe((e) => {
      this.environments = e
    })

    this.formGroup = this._formBuilder.group({})
  }

  public ngOnInit() {

    this.defaultEnvironmentSettings = this.container.environmentSettings()
    this.selectedEnvironmentSettings = this.container.environmentSettings(this.selectedEnvironment)

    this._panelStatus = new Map()

    if (this.showK8sFields) {
      this.displayedPortColumns = this._displayedPortColumnsK8sReadOnly

    } else {
      this.displayedPortColumns = this._displayedPortColumnsReadOnly
    }

    if (this.showK8sFields) {
      this.displayedVolumeColumns = this._displayedVolumeK8sReadOnly

    } else {
      this.displayedVolumeColumns = this._displayedVolumeReadOnly
    }

    this.displayedArgColumns = this._displayedArgColumnsReadOnly

    this.containerDescriptionCtrl = new FormControl(this.container.description)
    this.formGroup.addControl('containerDescriptionCtrl', this.containerDescriptionCtrl)

    this.containerNameCtrl = new FormControl(this.container.name)
    this.formGroup.addControl('containerNameCtrl', this.containerNameCtrl)

    this.containerImageCtrl = new FormControl(this.container.image)
    this.formGroup.addControl('containerImageCtrl', this.containerImageCtrl)

    this.containerTypeCtrl = new FormControl(this.container.type == 'other' ? this.container.typeLabel : this.container.type)
    this.formGroup.addControl('containerTypeCtrl', this.containerTypeCtrl)

    this.containerUserCtrl = new FormControl(this.container.adminUser)
    this.formGroup.addControl('containerUserCtrl', this.containerUserCtrl)

    this.containerPasswordCtrl = new FormControl(this.container.adminPassword)
    this.formGroup.addControl('containerPasswordCtrl', this.containerPasswordCtrl)

    this.formGroup.valueChanges.subscribe((f) => {

      if (this._ignoreChanges) {
        return
      }

      if (this.containerNameCtrl.dirty) {
        this.container.name = this.containerNameCtrl.value
        this.containerNameCtrl.markAsPristine()
        this.flagChanges()
      } else if (this.containerDescriptionCtrl.dirty) {
        this.container.description = this.containerDescriptionCtrl.value
        this.containerDescriptionCtrl.markAsPristine()
        this.flagChanges()
      } else if (this.containerImageCtrl.dirty) {
        this.container.image = this.containerImageCtrl.value
        this.containerImageCtrl.markAsPristine()
        this.flagChanges()
      } else if (this.containerTypeCtrl.dirty) {
        this.containerTypeCtrl.markAsPristine()
        this.container.typeLabel = this.containerTypeCtrl.value
        this.container.setType(this.containerTypeCtrl.value)
        this.flagChanges()
      } else if (this.containerUserCtrl.dirty) {
        this.container.adminUser = this.containerUserCtrl.value
        this.containerUserCtrl.markAsPristine()
        this.flagChanges()
      } else if (this.containerPasswordCtrl.dirty) {
        this.container.adminPassword = this.containerPasswordCtrl.value
        this.containerPasswordCtrl.markAsPristine()
        this.flagChanges()
      }
    })
  }

  public ngOnChanges(changes: SimpleChanges) {

    if (this.portsTable) {
      this.portsTable.renderRows()
      this.volumesTable.renderRows()
      this.envTable.renderRows()
    }
  }

  public containerId(suffix: String): String {

    if (this.container.name != null) {
      return 'run.deploy.container.' + this.container.name.toLowerCase().replace(/\s/g, '-') + '.' + suffix
    } else {
      return 'run.deploy.container.anon.' + suffix
    }
  }

  public styleForEditButton(): any {

    let style: any = {}

    style['pointer-events'] = 'all'

    if (this.editMode) {
      style['background-color'] = 'red'
    } else {
      style['background-color'] = 'blue'
    }

    return style
  }

  public productLabel(code: string): string {
    return ContainerTemplates.productCodeLabel(code)
  }

  public panelOpened(panel: any, isOpen: boolean) {

    this._panelStatus.set(panel, isOpen)
  }

  public isPanelOpen(panel: any): boolean {

    return this._panelStatus.get(panel) || false
  }

  public flagChanges(imageChanged?: boolean, oldValue?: string) {

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      // need to extract changes for target environment and inject into container before saving

      this.container.updateEnvironmentSettings(this.selectedEnvironmentSettings)
    }
    this._hasChanged = true
    this.containerUpdated.emit({container: this.container, imageChanged: imageChanged, previousValue: oldValue})
  }

  public flagEditContainer(event: any) {

    this.editMode = !this.editMode

    if (this.editMode) {
      this.displayedPortColumns = this.showK8sFields ? this._displayedPortColumnsK8sEdit : this._displayedPortColumnsEdit
      this.displayedVolumeColumns = this.showK8sFields ? this._displayedVolumeColumnsK8sEdit : this._displayedVolumeColumnsEdit
      this.displayedArgColumns = this._displayedArgColumnsEdit

    } else {
      this.displayedPortColumns = this.showK8sFields ? this._displayedPortColumnsK8sReadOnly : this._displayedPortColumnsReadOnly
      this.displayedVolumeColumns = this.showK8sFields ? this._displayedVolumeK8sReadOnly : this._displayedVolumeReadOnly
      this.displayedArgColumns = this._displayedArgColumnsReadOnly
    }

    event.stopPropagation()
  }

  public isCustom(): boolean {

    if (this.container.image) {
      let img: DockerImage = this.imageFor(this.container.imageName(), this.container.preferredImageVersion())

      if (img) {
        return img.isCustom
      } else {
        return false
      }
    } else {
      return false
    }
  }

  public changeSelectedEnvironment(event: any) {

    this.selectedEnvironment = event.value
    this.selectedEnvironmentSettings = this.mergeDefaultValuesIntoEnvironment(this.container.environmentSettings(this.selectedEnvironment))

    this._updateEnvironmentValueControls()
  }

  public mergeDefaultValuesIntoEnvironment(settings: Environment): Environment {

    if (this.selectedEnvironment.toLowerCase() == 'default') {
      return settings; // nothing to do
    } else if (settings == null || settings.name.toLowerCase() == 'default') {

      // duplicate default without values

      let e = this.defaultEnvironmentSettings.copy()
      e.name = this.selectedEnvironment

      return e
    } else {
      // merge

      let e = this.defaultEnvironmentSettings.copy()
      e.name = settings.name
      settings.mergeSettings(e)

      return e
    }
  }

  public imageName() {

    if (this.container != null) {
      return this.container.imageName()
    } else {
      return null
    }
  }

  public serviceType(element: Port): String {

    if (element.serviceType) {
      return element.serviceType
    } else {
      return 'Private'
    }
  }

  public preferredVersion(): string {

    if (this.container != null) {
      return this.container.preferredImageVersion()
    } else {
      return null
    }
  }

  public currentImage(): DockerImage {

    if (this.container.image) {

      let img: DockerImage = this.imageFor(this.imageName(), this.preferredVersion())

      if (this.container.build) {
        if (img) {
          img.dockerFile = this.container.build.dockerfile
        } else {
          img = new DockerImage(this.container.image)
          img.dockerFile = this.container.build.dockerfile
        }
      } else if (!img) {
        img = new DockerImage(this.container.image)
      }

      return img

    } else {

      return null
    }
  }

  public imageSelected(image: DockerImage) {

    let old: string = this.container.buildRef || this.container.name

    if (image) {
      this.container.image = image.tag()
      this.container.buildRef = image.buildTemplate

      if (image.dockerFile) {
        this.container.build = new DockerBuild()
        this.container.build.dockerfile = image.dockerFile
      } else if (this.container.build) {
        this.container.build.dockerfile = null
        this.container.build.buildCommands = null
      }
    } else {
      this.container.image = null
      this.container.build = null
    }

    this.flagChanges(true, old)
  }

  public refreshBuildCommands() {

    this._resourcesSevices.getDockerfile(this.container.build.dockerfile).subscribe((r) => {

      if (r) {
        this.container.build.buildCommands = r.buildCommands
        this.flagChanges()
      }
    })
  }

  public buildCommandsUpdated(commands: BuildCommand[]) {
    if (this.container.build.buildCommands != commands) {
      this.container.build.buildCommands = commands
    }

    this.flagChanges()
  }

  public styleForApplyTemplateButton(): any {

    let style = {}

    style['font-size'] = '10px'
    style['line-height'] = '21px'
    style['color'] = 'gray'

    if (this._hasChanged || this.containerTypeCtrl.value != this.container.type) {
      style['color'] = 'red'
    }

    return style
  }

  public defaultAdminUser() {

    if (this.container.type == ContainerType.apipr) {
      return 'system'
    } else if (this.container.type == ContainerType.msr || this.container.type == ContainerType.apigw) {
      return 'Administrator'
    } else {
      return 'admin'
    }
  }

  public defaultAdminPassword() {

    if (this.container.type == ContainerType.apipr) {
      return 'manager'
    } else if (this.container.type == ContainerType.msr || this.container.type == ContainerType.apigw) {
      return 'manage'
    } else {
      return 'admin'
    }
  }

  public applyTemplate(event: any) {

    this._containerTemplates.applyTemplate(this.container, this.imageFor(this.container.image) ? this.imageFor(this.container.image).primaryPort : null, this.container.type, this.selectedEnvironment).subscribe((result) => {
      this._ignoreChanges = true

      this._updateEnvironmentValueControls()

      this._ignoreChanges = true
      this.containerNameCtrl.setValue(this.container.name)
      this.containerDescriptionCtrl.setValue(this.container.description)
      this._ignoreChanges = false

      this.flagChanges()
    })

    event.stopPropagation()

    this._hasChanged = false
  }

  public styleForArg(element: Arg) {

    let style = {}

    if (element.mandatory) {
      style['font-weight'] = "bold"
      style['color'] = 'red'
    }

    return style
  }

  public styleForAttribute(element: any, field: string): any {

    let style = {}

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings && (element[field] == null || element[field] == '')) {
      style['font-weight'] = "lighter"
      style['color'] = 'gray'
    }

    return style
  }

  public fieldForPort(port: Port, field: string): string {

    if (port[field] != null && port[field] != "") {
      return port[field]
    } else if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      return this.defaultEnvironmentSettings.port(port.internal)[field]
    }
  }

  public fieldForVolume(vol: Volume, field: string): string {

    if (vol[field] != null && vol[field] != "") {
      return vol[field]
    } else if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      return this.defaultEnvironmentSettings.volume(vol.source)[field]
    }
  }

  public fieldForEnv(env: Arg, field: string): string {

    if (env[field] != null && env[field] != "") {
      return env[field]
    } else if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      return this.defaultEnvironmentSettings.environmentVariable(env.source)[field]
    } else {
      return ""
    }
  }

  public _updateEnvironmentValueControls() {

    this._ignoreChanges = true

    this.selectedEnvironmentSettings.ports.forEach((p) => {
      this.controlForPanelElement('ports', 'internal', p, p.internal)
      this.controlForPanelElement('ports', 'external', p, p.external)
      this.controlForPanelElement('ports', 'publicPort', p, p.publicPort)
      this.controlForPanelElement('ports', 'serviceType', p, p.serviceType)
      this.controlForPanelElement('ports', 'type', p, p.type)
      this.controlForPanelElement('ports', 'description', p, p.description)

    })

    this.selectedEnvironmentSettings.volumes.forEach((v) => {
      this.controlForPanelElement('volumes', 'source', v, v.source)
      this.controlForPanelElement('volumes', 'target', v, v.target)
      this.controlForPanelElement('volumes', 'k8sStorageType', v, v.k8sStorageType)
      this.controlForPanelElement('volumes', 'k8sAccessMode', v, v.k8sAccessMode)
      this.controlForPanelElement('volumes', 'k8sCapacity', v, v.k8sCapacity)
      this.controlForPanelElement('volumes', 'description', v, v.description)
    })

    this.selectedEnvironmentSettings.env.forEach((e) => {
      this.controlForPanelElement('env', 'source', e, e.source)
      this.controlForPanelElement('env', 'target', e, e.target)
      this.controlForPanelElement('env', 'description', e, e.description)
    })

    this._ignoreChanges = false

    this.portsTable.renderRows()
    this.volumesTable.renderRows()
    this.envTable.renderRows()
  }

  public portServiceType(port: Port): string {

    if (this.defaultEnvironmentSettings != this.selectedEnvironmentSettings && (port.serviceType == null || port.serviceType == '')) {
      port = this.defaultEnvironmentSettings.port(port.internal)
    }

    if (!port.serviceType) {
      return 'Private'
    } else if (port.serviceType == 'NodePort') {
      return 'Static'
    } else if (port.serviceType == 'Ingress') {
      return 'Public'
    } else if (port.serviceType == 'ClusterIP') {
      return 'Internal'
    } else {
      return 'Private'
    }
  }

  public publicPort(element: Port): string {
    if (element.publicPort != null && element.publicPort.length > 3) {
      return element.publicPort.substring(2)
    } else {
      return element.publicPort
    }
  }

  public serviceTypeSelected(event: MatSelectChange, port: Port) {

    if (this.selectedEnvironmentSettings == this.defaultEnvironmentSettings) {
      port.serviceType = event.value
    } else {
      if (port.serviceType == this.defaultEnvironmentSettings.port(port.internal).serviceType) {
        port.serviceType = ""; // blank it, because it is same as default
      } else {
        port.serviceType = event.value
      }
    }

    this.flagChanges()
  }

  public addPort(event: any) {

    let port: any = new Port('', '', '', '')
    port.position = this.selectedEnvironmentSettings.ports.length

    this.selectedEnvironmentSettings.ports.push(port)

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      this.container.environments.forEach((e) => {
        if (e.name.toLowerCase() != 'default') {
          e.ports.push(port)
        }
      })
    }

    this.portsTable.renderRows()

    event.stopPropagation()
  }

  public publicPortValidators() {
    return Validators.maxLength(3)
  }

  public removePort(element: Port) {

    var found = -1

    // can't delete port if it is a default unless we are removing from defaults!

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings && this.defaultEnvironmentSettings.port(element.internal)) {

      // however will blank overrides

      element.external = null
      element.publicPort = null
      element.description = null
      element.serviceType = null
      element.type = null

      this.portsTable.renderRows()
      this.flagChanges()
    } else {

      for (var i = 0; i < this.selectedEnvironmentSettings.ports.length; i++) {

        if (this.selectedEnvironmentSettings.ports[i] == element) {
          found = i
        }
      }

      if (found != -1) {
        this.selectedEnvironmentSettings.ports.splice(found, 1)

        this.portsTable.renderRows()
        this.flagChanges()
      }
    }
  }

  public addVolume(event: any) {

    let volume: any = new Volume('', '', '')
    volume.position = this.selectedEnvironmentSettings.volumes.length

    this.selectedEnvironmentSettings.volumes.push(volume)

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      this.container.environments.forEach((e) => {
        if (e.name.toLowerCase() != 'default') {
          e.volumes.push(volume)
        }
      })
    }

    this.volumesTable.renderRows()

    event.stopPropagation()
  }

  public removeVolume(element: Volume) {

    var found = -1

    // can't delete volume if it is a default unless we are removing from defaults!

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings && this.defaultEnvironmentSettings.volume(element.source)) {

      // however we can blank any overrides

      element.target = null
      element.k8sCapacity = null
      element.k8sAccessMode = null
      element.k8sStorageType = null
      element.description = null

      this.volumesTable.renderRows()
      this.flagChanges()
    } else {
      for (var i = 0; i < this.selectedEnvironmentSettings.volumes.length; i++) {

        if (this.selectedEnvironmentSettings.volumes[i] == element) {
          found = i
        }
      }

      if (found != -1) {
        this.selectedEnvironmentSettings.volumes.splice(found, 1)

        this.volumesTable.renderRows()
        this.flagChanges()
      }
    }
  }

  public addEnv(event: any) {

    let arg: any = new Arg('', '', '')
    arg.position = this.selectedEnvironmentSettings.env.length

    this.selectedEnvironmentSettings.env.push(arg)

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings) {
      this.container.environments.forEach((e) => {
        if (e.name.toLowerCase() != 'default') {
          e.env.push(arg)
        }
      })
    }

    this.envTable.renderRows()

    event.stopPropagation()
  }

  public removeEnv(element: Arg) {

    var found = -1

    // can't delete volume if it is a default unless we are removing from defaults!

    if (this.selectedEnvironmentSettings != this.defaultEnvironmentSettings && this.defaultEnvironmentSettings.environmentVariable(element.source)) {

      // will blank overrides

      element.target = null
      element.description = null

      this.envTable.renderRows()
      this.flagChanges()

    } else {
      for (var i = 0; i < this.selectedEnvironmentSettings.env.length; i++) {

        if (this.selectedEnvironmentSettings.env[i] == element) {
          found = i
        }
      }

      if (found != -1) {
        this.selectedEnvironmentSettings.env.splice(found, 1)

        this.envTable.renderRows()
        this.flagChanges()
      }
    }
  }

  public controlForPanelElement(panel: string, key: string, element: any, value: string, validators: Validators = null) {

    let ctrl: FormControl = null

    if (!element.position) {
      element.position = this.indexOfElement(panel, element)
    }

    let name: string = panel + ':' + key + ':' + element.position

    if (this.formGroup.controls[name]) {
      ctrl = <FormControl>this.formGroup.controls[name]

      if (this._ignoreChanges) {
        ctrl.setValue(value)
      }
    } else {
      ctrl = new FormControl(value, validators)
      this.formGroup.addControl(name, ctrl)
    }

    return ctrl
  }

  public updateElementWithControlValue(panel: string, type: string, element: any, prefix: string = null) {

    if (this._ignoreChanges) {
      return
    }

    let value = this.controlForPanelElement(panel, type, element, null).value

    if (prefix != null) {
      value = prefix + value
    }

    if (this.defaultEnvironmentSettings == this.selectedEnvironmentSettings) {
      element[type] = value
      this.flagChanges()
    } else {
      if (element instanceof Port) {
        if (this.defaultEnvironmentSettings.port(element.internal)[type] != value) {
          element[type] = value
          this.flagChanges()
        }
      } else if (element instanceof Volume) {
        if (this.defaultEnvironmentSettings.volume(element.source)[type] != value) {
          element[type] = value
          this.flagChanges()
        }
      } else if (element instanceof Arg) {
        if (this.defaultEnvironmentSettings.environmentVariable(element.source)[type] != value) {
          element[type] = value
          this.flagChanges()
        }
      }
    }
  }

  public flagDeleteContainer() {

    this.deleteContainer.emit(this.container)
  }

  private indexOfElement(panel: string, element: any): number {

    let env: Environment = this.selectedEnvironmentSettings

    let list: any[] = env[panel]
    var found: number = 0

    for (var i = 0; i < list.length; i++) {

      if (list[i] == element) {
        found = i
        break
      }
    }

    return found
  }

  private imageFor(tag: string, version?: string) {

    var found: DockerImage = null

    for (var i = 0; i < this.images.length; i++) {
      found = this.images[i].match(tag, version)
      if (found)
        break
    }

    if (found && version == 'latest') {
      found = found.copy()
      found.setVersion('latest')
    }

    return found
  }

  private _isDragging: boolean

  public classForDraggableElement(): string {

    if (this._isDragging) {
      return 'dragging'
    } else {
      return ''
    }
  }

  public onDragStart(event) {

    console.log('Container drag started container')

    this._isDragging = true
  }

  public onDragEnd(event) {

    console.log("container drag done container")

    this._isDragging = false
  }

  public onDragOver(event: DragEvent) {

    //console.log("drag over")
  }

  public onDragLeave(event: DragEvent) {

    //console.log("drag leave container")
  }

  public drop(event) {

    console.log("drop container")

  }
}
