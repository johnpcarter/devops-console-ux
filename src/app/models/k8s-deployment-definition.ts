import { DockerImage }							from './docker-image'

import * as moment from 'moment'

export class K8sContainerRef {

  public constructor(public name: string, public previousImage: string, public image: string) {
  }
}

export class K8sDeploymentDefinition {

	public static currentDeployment: K8sDeploymentDefinition

	public id: string
	public name: string
	public deploymentId: string
	public serviceId: string
	public description: string
	public namespace: string
	public reference: string
	public creationDate: Date
	public restartPolicy: string

	public version: number = 1
	public replicas: number = 1

	public containers: DockerImage[]

	public constructor() {

		this.containers = []

		let m1: DockerImage = new DockerImage()
		m1.id = "985485fgotfkgfksdpd43ga"
		m1.setName("Test Hello World Service")
		m1.type = "Microservice"
		m1.description = "classic microservice demo"

		let m2: DockerImage = new DockerImage()
		m2.id = "69659gpfo450o5fgo40"
		m2.setName("Hello World API Enforcer")
		m2.description = "fee fi fo fum"

		//this.containers.push(m1)
		//this.containers.push(m2)
	}

	public static make(data: any): K8sDeploymentDefinition {

	  return new K8sDeploymentDefinition()._make(data)
	}

	protected _make(data: any) {

		this.id = data.metadata.uid
		this.name = data.metadata.name
		this.description = data.metadata.labels.app
		this.serviceId = data.metadata.labels.serviceId
		this.deploymentId = data.metadata.labels.deploymentId
		this.namespace = data.metadata.namespace
		this.reference = data.metadata.selfLink
		this.creationDate = moment(data.metadata.creationTimestamp).toDate()

		this.restartPolicy = data.spec.template.spec.restartPolicy
		this.replicas = +data.spec.replicas

		let rawContainers: any[] = data.spec.template.spec.containers

		this.containers = []

		rawContainers.forEach((c) => {

			let image: DockerImage = new DockerImage(c.image)
			image.altName = c.name

			this.containers.push(image)
		})

		return this
	}
}
