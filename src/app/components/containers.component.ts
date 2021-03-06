import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core'
import {FormBuilder, FormControl, FormGroup} from '@angular/forms'
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop'
import {MatDialog } from '@angular/material/dialog'
import {MatSelectChange} from '@angular/material/select'
import {DockerImage} from '../models/docker-image'

import {ContainerTemplates} from '../support/container.templates'

import {Container } from '../models/container'
import { RunSet, ContainerSet } from '../models/project'
import {SimpleNameComponent} from './elements/simple-name.component'

@Component({
  selector: 'app-containers',
  templateUrl: '../templates/containers.html',
  styleUrls: ['../templates/containers.css']
})

export class ContainersComponent implements OnInit {
  @Input()
  public runSet: RunSet

  @Input()
  public form: FormGroup

  @Input()
  public showK8sFields: boolean

  @Input()
  public images: DockerImage[]

  @Input()
  public builds: string[]

  @Output()
  public runSetUpdated: EventEmitter<any> = new EventEmitter()

  public formGroup: FormGroup
  public namespaceCtrl: FormControl
  public descriptionCtrl: FormControl
  public typeCtrl: FormControl

  private _containerCtrls: Map<string, FormControl>
  private _panelStatus: Map<string, boolean>

  public constructor(private _formBuilder: FormBuilder, private _dialog: MatDialog) {

    this.formGroup = this._formBuilder.group({})
  }

  public ngOnInit() {

    this._containerCtrls = new Map()
    this._panelStatus = new Map()

    this.namespaceCtrl = new FormControl(this.runSet.namespace || 'webmethods')
    this.descriptionCtrl = new FormControl(this.runSet.description)
    this.typeCtrl = new FormControl(this.runSet.type || 'Micro Deployment')

    this.formGroup.addControl('namespaceCtrl', this.namespaceCtrl)
    this.formGroup.addControl('descriptionCtrl', this.descriptionCtrl)
    this.formGroup.addControl('typeCtrl', this.typeCtrl)

    this.formGroup.valueChanges.subscribe((v) => {

      if (this.namespaceCtrl.dirty) {

        // propagate change
        this.runSet.deployments.forEach((d) => {
          if (d.namespace == this.runSet.namespace) {
            d.namespace = this.namespaceCtrl.value
          }
        })

        this.runSet.namespace = this.namespaceCtrl.value

        this.namespaceCtrl.markAsPristine()
      }

      if (this.descriptionCtrl.dirty) {

        this.runSet.description = this.descriptionCtrl.value
        this.descriptionCtrl.markAsPristine()
      }

      if (this.typeCtrl.dirty) {

        this.runSet.type = this.typeCtrl.value
        this.typeCtrl.markAsPristine()
      }

      this.runSetUpdated.emit(null)
    })
  }

  public serviceUpdated(service: ContainerSet) {

    this.runSetUpdated.emit(null)
  }

  public containerConfigUpdated(ref: any) {

    this.runSetUpdated.emit(ref)
  }

  public addNewContainer(service: ContainerSet) {

    service.containers.push(new Container())
  }

  public deleteContainer(container: Container) {

    for (let z = 0; z < this.runSet.deployments.length; z++) {

      let found = -1

      const service: ContainerSet = this.runSet.deployments[z]

      for (let i = 0; i < service.containers.length; i++) {

        if (service.containers[i] === container) {
          found = i
          break
        }
      }

      if (found !== -1) {
        service.containers.splice(found, 1)

        if (service.containers.length === 0) {
          this.deleteService(service)
          break
        }
      }
    }

    this.runSetUpdated.emit({previousValue: container.buildRef})
  }

  public addNewService() {

    const dialogRef = this._dialog.open(SimpleNameComponent, {
      data: {title: 'Please specify a name for your service'},
    })

    dialogRef.afterClosed().subscribe(name => {

      if (name) {
        const service: ContainerSet = new ContainerSet(this.runSet.namespace)
        service.name = name
        const container: Container = new Container()
        container.description = 'Container to be configured'
        service.containers.push(container)

        this.runSet.deployments.push(service)

        if (this.runSet.useKubernetes) {
          ContainerTemplates.setDefaultsForK8s(this.runSet)
        }
      }
    })
  }

  public deleteService(service: ContainerSet) {

    let found = -1

    for (let i = 0; i < this.runSet.deployments.length; i++) {

      if (this.runSet.deployments[i] === service) {
        found = i
        break
      }
    }

    if (found !== -1) {
      this.runSet.deployments.splice(found, 1)
    }
  }

  public containerListControl(service: ContainerSet): FormControl {

    let ctrl: FormControl = this._containerCtrls.get(service.name)

    if (!ctrl) {
      ctrl = new FormControl()
      this._containerCtrls.set(service.name, ctrl)

      this.form.addControl(service.name, ctrl)
    }

    return ctrl
  }

  public panelOpened(panel: string, service: ContainerSet, container: Container, isOpen: boolean) {

    this._panelStatus.set(panel + ':' + service.name + ':' + container.name, isOpen)
  }

  public isPanelOpen(panel: string, service: ContainerSet, container: Container): boolean {

    return this._panelStatus.get(panel + ':' + service.name + ':' + container.name) || false
  }

  public haveSelectedContainer(service: ContainerSet): boolean {

    const ctrl: FormControl = this._containerCtrls.get(service.name)

    return ctrl && ctrl.value
  }

  public selectionChanged(event: MatSelectChange, service: ContainerSet) {

    service.dependsOn = event.value
    this.runSetUpdated.emit()
  }

  public haveDeploymentBelow(service: ContainerSet): boolean {

    return this.runSet.deployments.indexOf(service) < this.runSet.deployments.length - 1
  }

  public dependsOn(service: ContainerSet): string[] {

    const index: number = this.runSet.deployments.indexOf(service)
    const out: string[] = []

    for (let i = index + 1; i < this.runSet.deployments.length; i++) {
      out.push(this.runSet.deployments[i].name)
    }

    return out
  }

  public dropDeployment(event: CdkDragDrop<string[]>) {

    moveItemInArray(this.runSet.deployments, event.previousIndex, event.currentIndex)

    const service: ContainerSet = this.runSet.deployments[event.currentIndex]
    const out: string[] = this.dependsOn(service)

    if (out.indexOf(service.dependsOn) === -1) {
      service.dependsOn = null
    }

    this.runSetUpdated.emit(null)
  }

  public dropContainer(event: CdkDragDrop<string[]>) {

    const data: any = event.item.data

    moveItemInArray(data.service.containers, event.previousIndex, event.currentIndex)

    this.runSetUpdated.emit(null)
  }
}
