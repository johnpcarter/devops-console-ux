import { Injectable } 	           	 			      from '@angular/core'
import { HttpClient, HttpHeaders,
                                HttpResponse }  from '@angular/common/http'
import { Observable }               		        from 'rxjs'
import { map } 						                      from 'rxjs/operators'

import { NgxXml2jsonService } 					        from 'ngx-xml2json'
import { Settings }                     		    from '../settings'
import {Project, RunSet} from '../models/project';
import {Installer} from '../models/Installer';
import {Container} from '../models/container';
import {ArgDisplayType} from '../models/display-type';
import {Builder, DeploymentSet} from '../models/build';
import { environment } from '../../environments/environment'

@Injectable()
export class ConfigurationService {

    public static URI_CONFIG: string = environment.SERVER_API + "/rad/jc.devops:api/configuration"
    public static URI_TEMPLATES: string = environment.SERVER_API + "/rad/jc.devops:api/templates"

    constructor(private _settings: Settings, private _http: HttpClient, private _ngxXml2jsonService: NgxXml2jsonService) {

    }

    public generateJenkinsPipeline(project: Project, gitUri: string, gitRepo: string, gitUser: string, gitPassword: string): Observable<any> {

      let url: string = ConfigurationService.URI_CONFIG + "/jenkins"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        //.set('Accept', 'text/plain')

      let wrapper = {
          definition: project,
          gitUri: gitUri,
          gitRepo: gitRepo,
          gitUser: gitUser,
          gitPassword: gitPassword
      }

      let body: string = JSON.stringify(wrapper)

      return this._http.post(url, body, { headers, responseType: "blob" as "json" }).pipe(map( (responseData) => {

            return responseData
          },
          error => {
            return null
         }))
    }

    public installTemplate(product: string): Observable<Installer> {

      let url: string = ConfigurationService.URI_TEMPLATES + "/install/" + product

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers, observe: 'response', responseType: 'text' }).pipe(map( (responseData) => {

            return Installer.parse(responseData.body)
          },
          error => {
            return null
      }))
    }

    public runtimeTemplate(product: string): Observable<Container> {

      let url: string = ConfigurationService.URI_TEMPLATES + "/runtime/" + product

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return Container.make((<any>responseData).container)
          },
          error => {
            return null
      }))
    }

    public displayTypes(): Observable<ArgDisplayType[]> {

      let url: string = ConfigurationService.URI_TEMPLATES + "/display"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            let types: ArgDisplayType[] = [];

            (<any> responseData).forEach((t) => {
              types.push(ArgDisplayType.make(t))
            })

              return types
          },
          error => {
            return null
      }))
    }

    public deploymentSets(): Observable<string[]> {

      let url: string = ConfigurationService.URI_CONFIG + "/deploysets"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).sets
          },
          error => {
            return null
      }))
    }

    public deploymentSet(id: string): Observable<DeploymentSet> {

      let url: string = ConfigurationService.URI_CONFIG + "/deployset/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return DeploymentSet.make((<any>responseData).build)
          },
          error => {
            return null
         }))
    }

    public uploadDeploymentSet(serviceSet: DeploymentSet): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/deployset"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      let body: string = JSON.stringify(serviceSet)

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public deleteDeploymentSet(id: string): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/deployset/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.delete(url, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public installs(): Observable<string[]> {

      let url: string = ConfigurationService.URI_CONFIG + "/installs"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).installs
          },
          error => {
            return null
         }))
    }

    public install(id: string): Observable<Installer> {

      let url: string = ConfigurationService.URI_CONFIG + "/install/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers, observe: 'response', responseType: 'text' }).pipe(map( (response: HttpResponse<any>) => {

            return Installer.parse(response.body)
          },
          error => {
            return null
         }))
    }

    public uploadInstall(install: Installer): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/install"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      let body: string = install.toString()

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public deleteInstall(id: string): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/install/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.delete(url, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public builds(): Observable<string[]> {

      let url: string = ConfigurationService.URI_CONFIG + "/builds"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).builds
          },
          error => {
            return null
         }))
    }

    public build(id: string): Observable<Builder> {

      let url: string = ConfigurationService.URI_CONFIG + "/build/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return Builder.make((<any>responseData).build.build || (<any>responseData).build)
          },
          error => {
            return null
         }))
    }

    public uploadBuild(build: Builder): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/build"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      let body: string = JSON.stringify(build)

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public deleteBuild(id: string): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/build/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.delete(url, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public runSets(): Observable<string[]> {

      let url: string = ConfigurationService.URI_CONFIG + "/runs"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).runs
          },
          error => {
            return null
         }))
    }

    public runSet(id: string): Observable<RunSet> {

      let url: string = ConfigurationService.URI_CONFIG + "/run/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return RunSet.make((<any>responseData).run)
          },
          error => {
            return null
         }))
    }

    public uploadRunSet(runSet: RunSet): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/run"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      let body: string = JSON.stringify(runSet)

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public deleteRunSet(id: string): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/run/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.delete(url, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public projects(): Observable<string[]> {

      let url: string = ConfigurationService.URI_CONFIG + "/projects"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any>responseData).projects
          },
          error => {
            return null
         }))
    }

    public project(id: string): Observable<Project> {

      let url: string = ConfigurationService.URI_CONFIG + "/project/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return Project.make((<any>responseData).project)
          },
          error => {
            return null
         }))
    }

    public uploadProject(project: Project): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/project"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      let body: string = JSON.stringify(project)

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }

    public deleteProject(id: string): Observable<boolean> {

      let url: string = ConfigurationService.URI_CONFIG + "/project/" + encodeURIComponent(id)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      return this._http.delete(url, { headers }).pipe(map( (responseData) => {

            return true
          },
          error => {
            return false
         }))
    }
}
