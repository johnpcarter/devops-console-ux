import { Component, ChangeDetectorRef, OnInit, ComponentFactoryResolver, Input, Type,
                                       ViewChild }      from '@angular/core'
import { Router, ActivatedRoute }                       from '@angular/router'

import { MatSelect }                                    from '@angular/material/select'

import { Settings }                                     from '../../settings'

import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'
import { K8sDeployment }                                from '../../models/k8s-deployment'
import { K8sService }                                   from '../../services/k8s.service'

import { RuntimeActionsDirective, ActionsComponent }    from './runtime-actions.directive'

import { RuntimeScaleComponent }                        from './runtime-scale.component'
import { RuntimeUpdateComponent }                       from './runtime-update.component'

@Component({
  templateUrl: '../../templates/k8s/runtime-details.html',
  styleUrls: ['../../templates/k8s/runtime-details.css']
})

export class RuntimeDetailsComponent implements OnInit {

  @Input()
  public actionComponent: Type<any> = RuntimeScaleComponent

  @Input()
  public namespace: string
  public selectedDeployment: K8sDeploymentDefinition

  public title: string
  public deployments: K8sDeploymentDefinition[]

  public panelOpenState: boolean

  @ViewChild(MatSelect) selectedDeploymentControl: MatSelect

  @ViewChild(RuntimeActionsDirective) actions: RuntimeActionsDirective

	constructor(private _router: Router, private _route: ActivatedRoute, private _settings: Settings, private _k8sService: K8sService, private componentFactoryResolver: ComponentFactoryResolver) {

    this._settings.values().subscribe((settings) => {

        this.namespace = settings.k8sNamespace
        this._k8sService.deployments(settings.k8sNamespace, true).subscribe((d) => {
          this.deployments = d
        })
    })

    if (K8sDeployment.currentDeployment) {
      this.selectedDeployment = K8sDeployment.currentDeployment
    }

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

  public deploymentSelectionChanged(event: any) {

    this.selectedDeployment = event.value
    this.showActions()
  }

  public updatePodCount(event: any) {

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
