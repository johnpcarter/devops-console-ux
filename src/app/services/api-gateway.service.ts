import { Injectable } 	           	 	from '@angular/core'
import { HttpClient, HttpHeaders, 
                      HttpParams }      from '@angular/common/http'
import { Observable, of }               from 'rxjs'
import { switchMap, map } 				from 'rxjs/operators'

import { Settings }                     from '../settings'

export enum APIType {
	REST = "REST",
	SOAP = "SOAP",
	SOCKET ="Web Socket"
}

export class APIPolicy {

	public static make(data: any): APIPolicy {

		let p: APIPolicy = new APIPolicy()

		return p
	}
}

export class API {

	public id: string
	public name: string
	public isActive: boolean
	public type: APIType
	public policies: APIPolicy[]
	public owner: string

	constructor(id: string) {
		
		this.id = id
		this.policies = []
	}

	public static make(data: any): API {

		let api: API = new API(data.id)
		api.name = data.apiName
		api.isActive = data.isActive == 'true',
		api.type = APIType[<string> data.type]
		api.owner = data.owner

		if (data.policy) {
			api.policies.push(APIPolicy.make(data.policy))
		}

		return api
	}
}

export enum Maturity {
	Beta = "Beta",
	Deprecated = "Deprecated",
	Experimental = "Experimental",
	Production = "Production",
	Test = "Test"
}

@Injectable()
export class APIGatewayService {
	
	public static SEARCH: string = "/rest/apigateway/search"

	private _gatewayUrl: string
	private _gatewayUser: string
	private _gatewayPwd: string

	constructor(private _settings: Settings, private _http: HttpClient) {   
		
    }

	public apiList(apiGatewayUrl: string, apiGatewayUser: string, apiGatewayPassword: string, maturity: string, activeOnly: boolean): Observable<API[]> {

		let url: string = apiGatewayUrl + APIGatewayService.SEARCH

		let search: SearchObj = new SearchObj([Type.api], Condition.and, 0, -1)
		search.responseFields = ['apiName', 'id', 'name', 'owner', 'policyScope','names']

		if (activeOnly)
			search.addScope('isActive', true)

		search.addScope('maturityState', maturity.toString())

		let payload: string = JSON.stringify(search)

		let headers = new HttpHeaders()
                    .append('Content-Type', 'application/json')
                    .append('Accept', 'application/json')
                    .append('Cache-Control', 'no-cache')
                    .append('Cache-Control', 'no-store')
                    .append('Pragma','no-cache')
                    .append('Expires', '0')
                    .append('Accept', 'application/json')
                    .set('Authorization', `Basic ${btoa(apiGatewayUser + ":" + apiGatewayPassword)}`)

		let options: any = { headers }

      	return this._http.post(url, payload, options).pipe(map( (responseData) => {

            return this._mapResponse(responseData)
            
          },
          error => {
            return null
       	}))
	}

	 private _mapResponse(responseData: any): API[]
    {
 // data is returned as list called references or as a single entity

 		let images: API[] = []

 		responseData.forEach((i) => {
 			images.push(API.make(i))
 		})

 		return images
    }
}

enum Type {
	api = "api",
	application = "application",
	alias = "application",
	user = "user",
	group = "group",
	policy = "policy"
}

enum Condition {
	or = "or",
	and = "and"
}

class Scope {
	attributeName: string
	keyWord: any
}

class SearchObj {

	public types: Type[]
	public condition: Condition
	public scope: Scope[]
	public responseFields: string[]
	public from: number
	public size: number

	constructor(types: Type[], condition: Condition, from: number, size: number) {

		this.types = types
		this.condition = condition
		this.from = from
		this.size = size
		this.scope = []
	}

	public addScope(attributeName: string, keyWord: any) {

		let scope: Scope = new Scope()
		scope.attributeName = attributeName
		scope.keyWord = keyWord

		this.scope.push(scope)
	}
}