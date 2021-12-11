
import { DockerContainer, ContainerStatus }							from './docker-container'

import * as moment from 'moment'

export enum PodStatus {
	Pending = "Pending",
	Starting = "Starting",
	Running = "Running",
	Stopping = "Stopping",
	Terminated = "Terminated",
	Removed = "Removed"
}

export class K8sPod {

	public static currentPod: K8sPod

	public id: string
	public name: string
	public description: string
	public creationDate: Date

	public containers: DockerContainer[] = []

	public status: PodStatus = PodStatus.Pending

	public static make(data: any): K8sPod {

		let d: K8sPod = new K8sPod()

		d.id = data.metadata.uid
		d.name = data.metadata.name
		d.description = data.metadata.labels.app

		d.creationDate = moment(data.metadata.creationTimestamp).toDate()
		let rawStatus: string = data.status.phase

		d.status = PodStatus[rawStatus]

		if (data.status.conditions) {

			// Pod is running, but is it available check for Readiness probe condition

			data.status.conditions.forEach((c) => {

				if (c.type == "Ready") {

					if (d.status == "Running") {

						if (c.status != "True")
							d.status = PodStatus.Starting
						else
							d.status = PodStatus.Running
					} else if (d.status != "Pending") {

						if (c.status != "True")
							d.status = PodStatus.Stopping
						else
							d.status = PodStatus.Terminated
					}
				}
			})
		}

		if (data.status.containerStatuses) {

			data.status.containerStatuses.forEach((c) => {

				let dc: DockerContainer = new DockerContainer()
				dc.names = [c.name]
				dc.ready = c.ready
				dc.imageRef = c.image

				if (c.state) {

					if (c.state.running)
						dc.status = ContainerStatus.Running
					else if (c.state.terminating)
						dc.status = ContainerStatus.Terminating
					else if (c.state.terminated)
						dc.status = ContainerStatus.Terminated
					else if (c.state.starting)
						dc.status = ContainerStatus.Starting
					else
						dc.status = ContainerStatus.New

				} else if (d.status == PodStatus.Pending) {

					dc.status = ContainerStatus.New
				}

				d.containers.push(dc)

				if (dc.status == ContainerStatus.Terminated)
					d.status = PodStatus.Stopping
			});
		}

		return d
	}
}
