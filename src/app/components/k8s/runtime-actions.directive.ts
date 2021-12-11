import { Directive, ViewContainerRef } 					from '@angular/core'

import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'

@Directive({
  selector: '[runtime-actions]',
})

export class RuntimeActionsDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

export interface ActionsComponent {
  selectedDeployment: K8sDeploymentDefinition
}