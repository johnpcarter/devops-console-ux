import { Injectable } 	           	 			      from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams }  from '@angular/common/http'
import { Observable, of }               		    from 'rxjs'
import { switchMap, map } 						          from 'rxjs/operators'

import { NgxXml2jsonService } 					        from 'ngx-xml2json'

import { Source }                              from './../models/git-source'
import { Settings }                     		    from '../settings'


@Injectable()
export class ResourceService {
	
    public static URI_RESOURCES: string = Settings.SERVER_API + "/rad/jc.devops:api/resources"
   
    constructor(private _settings: Settings, private _http: HttpClient, private _ngxXml2jsonService: NgxXml2jsonService) {  

    }

    public resourceTypes(): Observable<string[]> {

		  let url: string = ResourceService.URI_RESOURCES

		  let headers = new HttpHeaders()
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).types
          },
          error => {
            return null
       	}))
    }

    public resourcesForType(type: string): Observable<any[]> {

      let url: string = ResourceService.URI_RESOURCES + "/type/" + type

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).files
          },
          error => {
            return null
         }))
    }

    public downloadResource(type: string, name: string) {

       window.open(ResourceService.URI_RESOURCES + "/type/" + encodeURIComponent(type) + "/" + encodeURIComponent(name))
    }

    public uploadResourceUrl(type: string, name: string): string {  

      return ResourceService.URI_RESOURCES + "/type/" + encodeURIComponent(type) + "/default/" + encodeURIComponent(name);  
    }

    public uploadResource(type: string, name: string, contentType: string, data: any): Observable<boolean> {     

      let url: string = ResourceService.URI_RESOURCES + "/type/" + encodeURIComponent(type) + "/default/" + encodeURIComponent(name)

      let headers = new HttpHeaders()
        .set('Content-Type', "tex/plain")
        .set('Accept', 'application/json')

      let formData:FormData = new FormData()
      formData.append('files', data, name)

      return this._http.post(url, formData, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }
}