import { Injectable } 	           	  from '@angular/core'
import { HttpClient, HttpHeaders,
			HttpErrorResponse }             from '@angular/common/http'
import { Observable, of }             from 'rxjs'
import { map, catchError } 			      from 'rxjs/operators'


import { Settings }								    from '../settings'
import { TestStatus }							    from '../models/docker-image'
import { TestSuiteResults }           from '../models/test-suite'
import {environment} from '../../environments/environment';

@Injectable()
export class TestTraceService {

    public static TEST_URL: string = environment.SERVER_API + "/rad/jc.devops:api/test"

    private _dockerHost: string

    constructor(private _http: HttpClient, private _settings: Settings) {

    	  this._settings.values().subscribe((v) => {
          this._dockerHost = v.dockerHost
        })
    }

    public testCasesInContainer(runName: string, containerName?: string): Observable<TestSuiteResults[]> {

      let url: string = TestTraceService.TEST_URL + "/" + runName

      if (containerName) {
 		    url += "/" + containerName
      }

      let headers = new HttpHeaders()

      return this._http.get(url, { headers }).pipe(map( (responseData : any) => {

        let tests: TestSuiteResults[] = []
        responseData.results.tests.forEach((t) => {
          tests.push(TestSuiteResults.make(t))
 			  })

 			  return tests
 			  },
          error => {
            return []
      }))
    }

    public run(runName: string, containerName?: string): Observable<boolean> {

      let url: string = TestTraceService.TEST_URL + "/run/" + runName

       if (containerName) {
 		    url += "/" + containerName
       }

       let headers: HttpHeaders = this.headers()

       return this._http.get(url, { headers }).pipe(map( (responseData : any) => {
          return true
       }, error => {
         return false
       }))
    }

    public archivedTestCases(runName: string): Observable<TestSuiteResults[]> {

      let url: string = TestTraceService.TEST_URL + "/archive/" + runName

      let headers: HttpHeaders = this.headers()

 		  return this._http.get(url, { headers }).pipe(map((responseData: any) => {
 		    let tests: TestSuiteResults[] = []

 			  responseData.results.forEach((t) => {

 				  tests.push(TestSuiteResults.make(t))
 			  })

 			  return tests
 		  }, error => {
 			  return null
 		  }))
    }

    public transferTestCasesFromContainer(runName: string, containerName?: string): Observable<boolean> {

      let url: string = TestTraceService.TEST_URL + "/transfer/" + runName

      if (containerName) {
 		    url += "/" + containerName
      }

      let headers: HttpHeaders = this.headers()

 		  return this._http.get(url, { headers }).pipe(map((responseData: any) => {
 		    return true
 		  }, error => {
 			  return false
 		  }))
    }

    public testStatus(runName: string, container?: string): Observable<TestStatus> {

 		let url: string = TestTraceService.TEST_URL + "/status/" + runName

 		if (container) {
 		  url += "/" + container
    }

    let headers: HttpHeaders = this.headers()

 		return this._http.get(url, { headers }).pipe(map((responseData: any) => {

 			let status: string = responseData.status

 			if (status == 'COMPLETED')
				return TestStatus.completed
			else if (status == 'RUNNING')
				return TestStatus.running
			else if (status == 'FAILED')
				return TestStatus.failed
			else if (status == 'TODO')
				return TestStatus.todo
			else if (status == 'NA')
				return TestStatus.none
			else
				return TestStatus.none

 		}), catchError((error: HttpErrorResponse) => {
 			return of(TestStatus.none)
 		}))
 	}

 	private headers(): HttpHeaders {

      let headers: HttpHeaders = new HttpHeaders()
          .append('Content-Type', 'application/json')
          .append('Accept', 'application/json')
          .append('Cache-Control', 'no-cache')
          .append('Cache-Control', 'no-store')
          .append('Pragma','no-cache')
          .append('Expires', '0')
          .append('Accept', 'application/json')

      if (this._dockerHost) {
        headers = headers.append('dockerHost', this._dockerHost)
      }

      return headers
    }
}
