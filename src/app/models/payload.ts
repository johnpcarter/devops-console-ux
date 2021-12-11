
export enum PayloadOrigin {
	none,
	file,
	url,
	service,
	error
}
	
export enum PayloadContentType {
	empty,
	json,
	xml,
	string,
	object,
	idata
}

export class Payload {

	protected _origin: PayloadOrigin
	protected _contentType: PayloadContentType
	protected _service: string
	protected _endPoint: string

	private constructor() {

	}

	public static make(origin: string, contentType: string,  endPoint: string) : Payload {

		let p: Payload = new Payload()

		if (origin == "service")
			p._origin = PayloadOrigin.service
		else if (origin == "file")
			p._origin = PayloadOrigin.file
		else if (origin == "url")
			p._origin = PayloadOrigin.url
		else if (origin == "error")
			p._origin = PayloadOrigin.error
		else
			p._origin = PayloadOrigin.none

		if (contentType == 'json')
			p._contentType = PayloadContentType.json
		else if (contentType == 'idata')
			p._contentType = PayloadContentType.idata
		else if (contentType == 'xml')
			p._contentType = PayloadContentType.xml
		else if (contentType == 'string')
			p._contentType = PayloadContentType.string
		else if (contentType == 'idata')
			p._contentType = PayloadContentType.idata
		else if (contentType == 'object')
			p._contentType = PayloadContentType.object
		else
			p._contentType = PayloadContentType.empty
		
		if (p._origin == PayloadOrigin.service)
			p._service = endPoint
		else
			p._endPoint = endPoint

		return p
	}

	public static makeFromJson(json: any): Payload
 	{
 		return Payload.make(json.origin, json.contentType, json.service ? json.service : json.location)
 	}

	public origin(): PayloadOrigin {

		return this._origin
	}

	public contentType(): PayloadContentType {

		return this._contentType
	}

	public service(): string {

		return this._service
	}

	public uri(): string {

		return this._endPoint
	}
}