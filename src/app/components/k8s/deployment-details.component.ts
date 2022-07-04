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

  public serviceId(): string {
  	return this.deployment.serviceId
  }

  public serviceType(): string {
    return this.deployment.serviceType
  }

  public version(): number {
    return this.deployment.version
  }

  public createdDate(): Date {
    return this.deployment.creationDate
  }
}
