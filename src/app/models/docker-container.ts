

export enum ContainerStatus {
	New = "New",
	Starting = "Starting",
	Running = "Running",
	Terminating = "Terminated",
	Terminated = "Terminated",
	Removed = "Removed"
}

export class DockerContainer {
	
	public static currentImage: ContainerStatus
	
	public id: string
	public names: string[]
	public status: ContainerStatus
	public ready: boolean

	public imageRef: string

	public constructor() {

	}

	public static make(data: any): DockerContainer {

		let image: DockerContainer = new DockerContainer()

		image.id = data.id
		image.names = data.names

		return image
	}
}