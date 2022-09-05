import { Component, ChangeDetectorRef, OnInit, ComponentFactoryResolver, Input, Type,
                                       ViewChild }      from '@angular/core'
import { Router, ActivatedRoute }                       from '@angular/router'

import { MatSelect }                                    from '@angular/material/select'
import { MatDialog }                                    from '@angular/material/dialog'

import {Settings, Values} from '../../settings';

import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'
import { K8sDeployment }                                from '../../models/k8s-deployment'
import { K8sService }                                   from '../../services/k8s.service'

import { RuntimeActionsDirective, ActionsComponent }    from './runtime-actions.directive'

import { RuntimeScaleComponent }                        from './runtime-scale.component'
import { RuntimeUpdateComponent }                       from './runtime-update.component'
import {SimpleNameComponent}                            from '../elements/simple-name.component'

@Component({
  templateUrl: '../../templates/k8s/runtime-details.html',
  styleUrls: ['../../templates/k8s/runtime-details.css']
})

export class RuntimeDetailsComponent implements OnInit {

  @Input()
  public actionComponent: Type<any> = RuntimeScaleComponent

  @Input()
  public namespace: string

  public namespaces: string[]

  public selectedDeployment: K8sDeploymentDefinition

  public title: string
  public deployments: K8sDeploymentDefinition[]

  public panelOpenState: boolean

  @ViewChild(MatSelect) selectedDeploymentControl: MatSelect

  @ViewChild(RuntimeActionsDirective) actions: RuntimeActionsDirective

	constructor(private _router: Router, private _route: ActivatedRoute, private _settings: Settings, private _k8sService: K8sService, private _dialog: MatDialog, private componentFactoryResolver: ComponentFactoryResolver) {

    this._settings.values().subscribe((settings) => {

      if (this.namespace == null) {
        this.namespace = settings.k8sNamespace
      }

      this.getNamespaces(settings)
      this.getDeploymentsForSelectedNamespace(settings)

      if (K8sDeployment.currentDeployment) {
        this.selectedDeployment = K8sDeployment.currentDeployment
      }
    })

    if (this._route.snapshot.url.toString().indexOf("scale") != -1) {
      this.actionComponent = RuntimeScaleComponent
      this.title = "Scale Performance"
    } else if (this._route.snapshot.url.toString().indexOf("update") != -1) {
       this.title = "Update Container Version(s)"
       this.actionComponent = RuntimeUpdateComponent
    }
  }

  public ngOnInit() {

    if (this.selectedDeployment) {
      //this.selectedDeploymentControl.value = this.selectedDeployment

       this.showActions()
    }
  }

  public getNamespaces(v: Values) {

    this._k8sService.namespaces(this._settings.currentEnvironment).subscribe((names) => {

      if (names == null) {

        // report failure
        this.requestTokenUpdate()
      } else {

        this.namespaces = names

        if (!this.namespace)
          this.namespace = this.namespaces[0]
      }
    })
  }

  public getDeploymentsForSelectedNamespace(settings: Values) {

    this._k8sService.deployments(settings.k8sNamespace, this._settings.currentEnvironment, true).subscribe((d) => {
      this.deployments = d

      if (!this.selectedDeployment) {

        let f: number = 0

        for(let i = 0; i < this.deployments.length; i++) {
          if (this.deployments[i].name == settings.k8sDeploymentName) {
            f = i
            break
          }
        }

        this.selectedDeployment = this.deployments[f]

      }
    })
  }

  public namespaceSelectionChanged() {
    this._settings.setCurrentNamespace(this.namespace)
    this.selectedDeployment = null
    this._settings.values().subscribe((v) => {
      this.getDeploymentsForSelectedNamespace(v)
    })
  }

  public requestTokenUpdate() {
    const dialogRef = this._dialog.open(SimpleNameComponent, {width: "80%",
      data: {title: 'Enter a valid Bearer Token to access your kubernetes environment', type: 'password', hint: 'e.g. kubectl -n kubernetes-dashboard create token admin-user', description: 'token'}
    })

    dialogRef.afterClosed().subscribe(name => {

      if (name) {
        this._settings.values().subscribe((v) => {

          v.k8sToken = name
          this._settings.saveChanges(v)

          this.getNamespaces(v)
        })
      }
    })
  }

  public deploymentSelectionChanged(event: any) {

    if (event.value != null) {
      this._settings.setCurrentDeploymentName(event.value.name)
    }

    this.selectedDeployment = event.value
    this.showActions()
  }

  public updatePodCount(event: any) {

    console.log("======= pod count is " + event)

    if (event.ready == -1) {
      // negative value means we got an error trying to query for pods

      this.requestTokenUpdate()
    }
  }

  public back() {

    this._router.navigate(["/runtime"])
  }

  private showActions() {

    let ref: RuntimeDetailsComponent = this
      setTimeout(() => {
        ref.setActionsComponent()
    })
  }

  private setActionsComponent() {

    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.actionComponent)

    if (this.actions) {
      let viewContainerRef = this.actions.viewContainerRef
      viewContainerRef.clear()

      let componentRef = viewContainerRef.createComponent(componentFactory);
      (<ActionsComponent>componentRef.instance).selectedDeployment = this.selectedDeployment
    }
  }
}
