import { TestStatus } 							from '../models/docker-image'

export class APIDefinition {

	public package: string
	public name: string
	public swaggerEndPoint: string
	public endPoint: string
	public deployment: string
	
	public static make(data: any) {

		let api = new APIDefinition()
		api.package = data.package
		api.name = data.name
		api.swaggerEndPoint = data.swaggerEndPoint
		api.endPoint = data.endPoint

		return api
	}

	public static makeArray(array: any): APIDefinition[] {

    let apis: APIDefinition[] = []

    array.foreach((p) => {
      apis.push(APIDefinition. make(p))
    })

    return apis
  }
}

export class WmPackageInfo {

	public name: string
	public version: number
	public build: number
	public description: string
	public requires: WmPackageInfo[]
	public startup: string
	public shutdown: string
	public testStatus: TestStatus
	public services: string[]
	public apis: APIDefinition[]

	constructor(name: string) {
		this.name = name
	}

	public static make(data: any): WmPackageInfo {

		let pck: WmPackageInfo = new WmPackageInfo(data.name)

		pck.apis = []
		pck.version = data.version
		pck.build = data.version
		pck.description = data.description
		pck.startup = data.startup
		pck.shutdown = data.shutdown

		if (data.testStatus == "success")
			pck.testStatus = TestStatus.passed
		else if (data.testStatus == "failed")
			pck.testStatus = TestStatus.failed
		else if (data.testStatus == "running")
			pck.testStatus = TestStatus.running
		else if (data.testStatus == "todo")
			pck.testStatus = TestStatus.todo
		else
			pck.testStatus = TestStatus.none

		pck.services = data.services
		
		if (data.apis) {
			data.apis.forEach((a) => {

				let api: APIDefinition = new APIDefinition()
				api.package = pck.name
				api.name = a.name
				api.swaggerEndPoint = a.swaggerEndPoint
				api.endPoint = a.endPoint
				pck.apis.push(api)
			})
		}

		pck.requires = []

		if (data.requires) {

			if (data.requires instanceof String)  {

				let array: string[] = data.required.split(",")

				array.forEach((r) => {
					pck.requires.push(new WmPackageInfo(r))

				})
			} else {

				data.requires.forEach((r) => {
					pck.requires.push(WmPackageInfo.make(r))

				})

			}
		}

		return pck
	}
}