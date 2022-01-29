import { Component, Input } from '@angular/core'
import { K8sDeploymentDefinition } from '../../models/k8s-deployment-definition'

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
