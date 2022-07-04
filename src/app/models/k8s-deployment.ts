
import { Observable, of }               	from 'rxjs'
import { switchMap, map } 					from 'rxjs/operators'

import { K8sDeploymentDefinition } 			from "./k8s-deployment-definition"
import { K8sPod }			 				from './k8s-pod'

import { K8sService }						from '../services/k8s.service'

export enum DeploymentStatus {
	unknown = "unknown",
	running = "running",
	updating = "updating",
	suspended = "suspended",
	stopped = "stopped",
	unavailable = "unavailable",
	new = "new"

}

export class K8sDeployment extends K8sDeploymentDefinition {

	public static currentDeployment: K8sDeployment

	public status: DeploymentStatus = DeploymentStatus.unknown

	private _cache: K8sPod[] = []

	public readyReplicas: number = 0
	public availableReplicas: number = 0
	public unavailableReplicas: number = 0
	public replicasBeforeSuspend: number = 0

	public updatePodCount(replicas: number, readyReplicas: number, availableReplicas: number, unavailableReplicas: number) {

		this.updateStatus(replicas, readyReplicas, availableReplicas, unavailableReplicas)
	}

	public pods(service: K8sService, refresh?: boolean): Observable<K8sPod[]> {

		if (!refresh && this._cache.length > 0) {

			return of(this._cache)

		} else {

			return service.podsForAppLabel(this.namespace, this.description).pipe(map((pods) => {

				this._cache = pods

				return pods
			}))
		}
	}

	public static make(data: any): K8sDeployment {

		let d: K8sDeployment = new K8sDeployment()._make(data)

		// now determine status and pods.

		d.updateStatus(data.status.replicas, data.status.readyReplicas, data.status.availableReplicas, data.status.unavailableReplicas)

		return d
	}

	private updateStatus(replicas: number, readyReplicas: number, availableReplicas: number, unavailableReplicas?: number) {

		this.replicas = replicas || 0
		this.readyReplicas = readyReplicas || 0
		this.availableReplicas = availableReplicas || 0
		this.unavailableReplicas =  unavailableReplicas || 0

		if (this.availableReplicas <= this.readyReplicas) {
			this.availableReplicas = 0
		}

		if (this.replicas == 0) {
			this.status = DeploymentStatus.suspended
		} else if (this.availableReplicas > 0) {
			this.status = DeploymentStatus.updating
		} else if (this.readyReplicas > 0) {
			this.status = DeploymentStatus.running
		} else if (this.unavailableReplicas > 0) {
			this.status = DeploymentStatus.unavailable
		} else if (this.replicas > 1) {
			this.status = DeploymentStatus.stopped
		} else {
			this.status = DeploymentStatus.new
		}
	}
}
