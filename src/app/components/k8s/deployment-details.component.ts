import { Component, ChangeDetectorRef, Input }          from '@angular/core'
import { Router }                                       from '@angular/router'

import { Settings }                                     from '../../settings'

import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'
import { K8sDeployment }                                from '../../models/k8s-deployment'

@Component({
  selector: 'jc-deployment-details',
  templateUrl: '../../templates/k8s/deployment-details.html'
})

export class DeploymentDetailsComponent {

  @Input()
  public isRuntime: boolean

  @Input()
  public deployment: K8sDeploymentDefinition

  public status(): string {
  	return "ok"
  }
}