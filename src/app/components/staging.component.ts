import {
  Component, EventEmitter,
  OnInit, OnChanges, Input, Inject,
  Output
} from '@angular/core'

import {
  FormBuilder, FormGroup, FormControl,
  Validators
} from '@angular/forms'

import {
  MatDialog, MatDialogRef, DialogPosition,
  MAT_DIALOG_DATA
} from '@angular/material/dialog'

import {Stage, ContainerSet, Action} from '../models/project'
import {APIDefinition} from '../models/wm-package-info'
import {Settings} from '../settings'
import {Container} from '../models/container'

@Component({
  selector: 'staging',
  templateUrl: '../templates/stage.html'
})

export class StagingComponent implements OnInit, OnChanges {

  @Input()
  public stage: Stage

  @Input()
  public form: FormGroup

  @Output()
  public stageUpdated: EventEmitter<Stage> = new EventEmitter()

  public apiMaturityList: string[] = ['Beta', 'Test', 'Production', 'Deprecated']

  public environments: string[] = ['Default']

  public stageNameCtrl: FormControl
  public envCtrl: FormControl
  public buildServiceCtrl: FormControl
  public runTypeCtrl: FormControl

  private _ignoreValueChanges: boolean

  public constructor(private _formBuilder: FormBuilder, private _dialog: MatDialog, private _settings: Settings) {

    this._settings.environments().subscribe((e) => {
      this.environments = e
    })
  }

  public ngOnInit() {

    console.log('stage is ' + this.stage.name)

    this._setupForm()
  }

  public ngOnChanges() {

    this.updateForm()
  }

  public isK8sRuntime(): boolean {
    return this.runTypeCtrl.value !== 'docker'
  }

  public haveAPIs(): boolean {

    var found: boolean = false

    for (var i = 0; i < this.stage.deployments.length; i++) {

      if (this.stage.deployments[i].apis.length > 0) {
        found = true
        break
      }
    }

    return found
  }

  public actionChanged(action: Action) {

    if (this.stage.onStart.runTests) {
      if (!this.stage.onSuccess) {
        this.stage.onSuccess = new Action()
      }

      if (!this.stage.onFail) {
        this.stage.onFail = new Action()
      }

      this.stage.onSuccess.active = 'true'
      this.stage.onFail.active = 'true'
    } else {
      if (this.stage.onSuccess.isActive()) {
        this.stage.onSuccess = new Action()
        this.stage.onSuccess.active = 'false'
      }

      if (this.stage.onFail.isActive()) {
        this.stage.onFail = new Action()
        this.stage.onFail.active = 'false'
      }
    }

    return this._save()
  }

  public activationChanged(obj: any) {

    let ref: StagingComponent = this
    setTimeout(() => {
      obj.active = !obj.active
      ref._save()
    })
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
      data: {selectedEnvironment: this.stage.containerHost, container: container, formBuilder: this._formBuilder},
      width: '360px',
      height: '300px',
    })

    console.log('left: \'${x}px\', top: \'${y}px\'')

    dialogRef.updatePosition({left: x + 'px', top: y + 'px'})

    dialogRef.afterClosed().subscribe(container => {
      console.log(`Dialog result: ${container}`)

      this._save()
    })
  }

  public removeAPI(service: ContainerSet, api: APIDefinition) {

    service.removeAPI(api)
    this._save()
  }

  public removeContainer(service: ContainerSet, container: Container) {

    service.removeContainer(container)
    this._save()
  }

  private updateForm() {

    if (this.stageNameCtrl) {

      this._ignoreValueChanges = true

      this.stageNameCtrl.setValue(this.stage ? this.stage.name : '')
      this.envCtrl.setValue(this.stage ? (this.stage.containerHost != null ? 'Default' : '') : '')
      this.runTypeCtrl.setValue(this.stage ? (this.stage.useKubernetes == 'true' ? 'k8s' : 'docker') : 'docker')
      this.buildServiceCtrl.setValue(this.stage ? this.stage.buildOnStart == 'true' ? true : false : false)

      this._ignoreValueChanges = false
    }
  }

  private _setupForm() {

    this.stageNameCtrl = new FormControl()
    this.envCtrl = new FormControl()
    this.runTypeCtrl = new FormControl('docker')
    this.buildServiceCtrl = new FormControl()

    this.form.addControl('stageNameCtrl', this.stageNameCtrl)
    this.form.addControl('envCtrl', this.envCtrl)
    this.form.addControl('runTypeCtrl', this.runTypeCtrl)
    this.form.addControl('buildServiceCtrl', this.buildServiceCtrl)

    this.updateForm()

    this.form.valueChanges.subscribe((d) => {

      if (this._ignoreValueChanges) {
        return
      }

      if (this.stageNameCtrl.dirty) {
        this.stage.name = this.stageNameCtrl.value
        this.stageNameCtrl.markAsPristine()
      }

      if (this.envCtrl.dirty) {
        this.stage.containerHost = this.envCtrl.value
        this.envCtrl.markAsPristine()
      }

      if (this.runTypeCtrl.dirty) {
        this.stage.useKubernetes = '' + (this.runTypeCtrl.value == 'k8s')
        this.runTypeCtrl.markAsPristine()
      }

      if (this.buildServiceCtrl.dirty) {
        this.stage.buildOnStart = '' + this.buildServiceCtrl.value
        this.buildServiceCtrl.markAsPristine()
      }

      this._save()
    })
  }

  private _save() {

    if (this.stage.onStart.runTests == 'false') {

      this.stage.onSuccess = new Action()
      this.stage.onFail = new Action()
    }

    this.stageUpdated.emit(this.stage)
  }
}

@Component({
  selector: 'edit-container',
  templateUrl: '../templates/container-host.html'
})
export class EditContainerComponent {

  public selectedEnvironment: string
  public container: Container

  public formBuilder: FormBuilder
  public formGroup: FormGroup
  public activeCtrl: FormControl
  public hostCtrl: FormControl
  public portCtrl: FormControl
  public imageCtrl: FormControl

  public hint: string

  public hostLabel: string
  public portLabel: string
  public publicHost: string
  public publicPort: string
  public privateHost: string
  public privatePort: string

  private _ignore: boolean = false

  constructor(public dialogRef: MatDialogRef<EditContainerComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.selectedEnvironment = data.selectedEnvironment
    this.container = data.container
    this.formBuilder = data.formBuilder

    this.activeCtrl = new FormControl(this.container.active == 'true' ? true : false)

    if (this.activeCtrl.value) {

      this.hostCtrl = new FormControl(this.container.name)
      this.portCtrl = new FormControl(this.container.environmentSettings(this.selectedEnvironment).ports[0].internal)
    } else {

      this.hostCtrl = new FormControl(this.container.hostname)
      this.portCtrl = new FormControl(this.container.environmentSettings(this.selectedEnvironment).ports[0].external)
    }

    this.imageCtrl = new FormControl(this.container.image)
    this.imageCtrl.disable()

    this.formGroup = this.formBuilder.group({
      activeCtrl: this.activeCtrl,
      hostCtrl: this.hostCtrl,
      portCtrl: this.portCtrl,
      imageCtrl: this.imageCtrl
    })

    this.formGroup.valueChanges.subscribe((d) => {

      if (this._ignore) {
        return
      }

      if (((this.activeCtrl.value && this.container.active == 'false')
        || !this.activeCtrl.value && this.container.active == 'true')) {

        if (this.activeCtrl.value) {
          this.container.active = 'true'
          this.container.hostname = this.privateHost
        } else {
          this.container.active = 'false'
          this.container.hostname = this.publicHost
        }

        this._ignore = true
        this.enableControls()
        this._ignore = false
      } else {

        this.container.active = this.activeCtrl.value ? 'true' : 'false'

        if (!this.activeCtrl.value) {
          if (this.hostCtrl.value && this.hostCtrl.value.length > 0) {
            this.container.hostname = this.hostCtrl.value
          } else {
            this.container.hostname = null
          }

          if (this.activeCtrl.value) {
            this.container.environmentSettings(this.selectedEnvironment).ports[0].internal = '' + this.portCtrl.value
          } else {
            this.container.environmentSettings(this.selectedEnvironment).ports[0].external = '' + this.portCtrl.value
          }
        } else {

          this.container.hostname = null
        }
      }
    })

    if (this.container.hostname && this.container.hostname.length > 0) {
      this.publicHost = this.container.hostname
    }

    this.publicPort = this.container.environmentSettings(this.selectedEnvironment).ports[0].external

    this.privateHost = this.container.name
    this.privatePort = this.container.environmentSettings(this.selectedEnvironment).ports[0].internal

    this.enableControls()
  }

  closeDialog() {

    this.dialogRef.close(this.container)
  }

  private enableControls() {

    if (this.activeCtrl.value) {
      this.hostCtrl.disable()
      this.portCtrl.disable()

      this.hostLabel = 'Docker network Host'
      this.portLabel = 'Internal Port'

      this.hostCtrl.setValue(this.privateHost)
      this.portCtrl.setValue(this.privatePort)

      this.hint = 'Container will be included in stage, intra container communication will be via private network and use container names as hosts'

    } else {
      this.hostCtrl.enable()
      this.portCtrl.enable()

      this.hostLabel = 'External Host'
      this.portLabel = 'Public Port'

      this.hostCtrl.setValue(this.publicHost)
      this.portCtrl.setValue(this.publicPort)

      if (this.hostCtrl.value) {
        this.hint = "Not included in stage and if features are required will communicate with external application via host and port"
      } else {
        this.hint = "Not included in stage and features will not be available for any actions"
      }
    }

  }
}
