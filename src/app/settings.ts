import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { map, share } from 'rxjs/operators'
import { environment } from '../environments/environment'

export class RepoSettings {

  constructor(public name: string, public packages: string, public configuration: string) {

  }
}

export enum GitType {
  github,
  gitlab
}

export class Values {

  public gitUri: string = 'https://github.com/'
  public gitAPIUrl: string = 'https://api.github.com'
  public gitType: GitType = GitType.github
  public gitName: string
  public gitUser: string
  public gitIsPACPassword: string = 'true'
  public gitPassword: string
  public gitRepos: RepoSettings[] = [new RepoSettings('wm', '/packages', '/config')]

  public dockerHost: string = null
  public dockerUseHttps: boolean = false
  public dockerCertificate: string = null

  public imagePrefix: string

  public lastViewedPage: string = null
  public lastViewedPageArg: string = null

  public k8sUrl: string = 'https://localhost:6443'
  public k8sNamespace: string = null
  public k8sToken: string = null
  public k8sType: string = null


  public completeGitUri(): string {

    if (this.gitUri.endsWith("/"))
      return this.gitUri + this.gitUser
    else
      return this.gitUri + "/" + this.gitUser
  }

  public repoForName(name: string): RepoSettings {

    let found: RepoSettings = null

    this.gitRepos.forEach((r) => {

      if (r.name == name) {
        found = r
      }
    })

    return found
  }
}

@Injectable()
export class Settings {

  public static WS_SERVER = 'ws://localhost:9191'

  // runtime prefs

  public currentEnvironment: string = 'Default'
  public currentRuntime: string
  public gitExpander: boolean
  public dockerExpander: boolean
  public k8sExpander: boolean
  public empowerExpander: boolean

  public _environments: string[] = []
  // server managed settings

  private _values: Values
  private _valuesName: string = null

  private static CONFIG: string = environment.SERVER_API + '/rad/jc.devops:api/configuration/user'
  private static ENVIRONMENTS: string = environment.SERVER_API + '/rad/jc.devops:api/configuration/environments'

  public constructor(private _http: HttpClient) {

    this._values = new Values()
    this.values()
  }

  public environments(): Observable<string[]> {

    if (this._environments.length > 0) {
      return of(this._environments)
    }

    let headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')
      .append('Cache-Control', 'no-store')
      .append('Pragma', 'no-cache')
      .append('Expires', '0')

    return this._http.get(Settings.ENVIRONMENTS, { headers }).pipe(map((response) => {

      let env: string[] = ['Default']

      if ((<any>response).environments != null)
      {
        (<any>response).environments.forEach((e) => {
          if (e.length > 0) {
            env.push(e)
          }
        })
      }

      this._environments = env

      return env
    }))
  }

  public values(environment: string = null, includeDefaults: boolean = true): Observable<Values> {

    if (this._valuesName != null && this._valuesName == environment || (environment == null && this._valuesName == 'default')) {

      console.log('getting preloaded settings')

      return of(this._values)
    } else {
      console.log('restoring settings')

      return this._restore(environment, environment == null ? "true" : (includeDefaults ? "true" : "false")).pipe(share())
    }
  }

  public setCurrentPage(page: string, arg?: string) {

    if (this._values.lastViewedPage != page) {
      this._values.lastViewedPage = page
      this._values.lastViewedPageArg = arg

      this.saveChanges(this._values)
    }
  }

  public setCurrentNamespace(namespace: string) {

    if (this._values.k8sNamespace != namespace) {
      this._values.k8sNamespace = namespace

      this.saveChanges(this._values)
    }
  }

  public gotoLastViewedPage(router: Router) {

    if (this._values.lastViewedPage) {

      if (this._values.lastViewedPageArg) {
        router.navigate([this._values.lastViewedPage, this._values.lastViewedPageArg])
      } else {
        router.navigate([this._values.lastViewedPage])
      }

      this._values.lastViewedPage = null
    }
  }

  public _restore(environment: string, includeDefaults: string): Observable<Values> {

    let headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')
      .append('Cache-Control', 'no-store')
      .append('Pragma', 'no-cache')
      .append('Expires', '0')
      .append('defaults', includeDefaults)

    let url = Settings.CONFIG

    if (environment != null) {
      url += "?environment=" + environment
    }

    return this._http.get(url, { headers }).pipe(map((response) => {

      return this._cacheValues((<any>response).User, environment)
    }))
  }

  public removeEnvironment(environment: string) {

    let headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')

    return this._http.delete(Settings.ENVIRONMENTS, { headers }).subscribe((r) => {
      if (this._environments.indexOf(environment) != -1) {
        this._environments.splice(this._environments.indexOf(environment), 1)
      }
    })
  }

  public saveChanges(newValues: Values, environment: string = null) {

    this._values = newValues

    let url: string = Settings.CONFIG
    let headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')
      .append('Cache-Control', 'no-cache')
      .append('Pragma', 'no-cache')
      .append('Expires', '0')

    if (environment != null) {
      headers = headers.append('environment', environment)

      if (this._environments.indexOf(environment) == -1) {
        this._environments.push(environment)
      }
    }

    let options: any = {headers}

    let body: string = JSON.stringify(this._values)

    return this._http.post(url, this._values, options).subscribe((response) => {

        console.log('response is ' + response)
      },
      error => {
        return new Values()
      })
  }

  private _cacheValues(data: any, environment: string): Values {

    this._values = new Values()

    if (data) {

      if (data.gitUri) {
        this._values.gitUri = data.gitUri

        this._values.gitType = data.gitType == 0 ? GitType.github : GitType.gitlab

        if (this._values.gitType == GitType.github) {
          let protoMarker: number = data.gitUri.indexOf('//')
          this._values.gitAPIUrl = data.gitUri.substring(0, protoMarker) + '//api.' + data.gitUri.substring(protoMarker + 2)
        } else {
          this._values.gitAPIUrl = this._values.gitUri
        }
      }

      if (data.gitUser) {
        this._values.gitUser = data.gitUser
      }

      if (data.gitName) {
        this._values.gitName = data.gitName
      }

      if (data.gitPassword) {
        this._values.gitPassword = data.gitPassword
      }

      if (data.gitType) {
        this._values.gitType = data.gitType == 0 ? GitType.github : GitType.gitlab
      }

      if (data.gitIsPACPassword) {
        this._values.gitIsPACPassword = data.gitIsPACPassword
      }

      if (data.gitRepos) {

        this._values.gitRepos = []

        data.gitRepos.forEach((r) => {
          this._values.gitRepos.push(new RepoSettings(r.name, r.packages, r.configuration))
        })
      }

      if (data.dockerHost) {
        this._values.dockerHost = data.dockerHost
      }

      if (data.dockerUseHttps) {
        this._values.dockerUseHttps = data.dockerUseHttps
      }

      if (data.dockerCertificate) {
        this._values.dockerCertificate = data.dockerCertificate
      }

      if (data.imagePrefix) {
        this._values.imagePrefix = data.imagePrefix
      }

      if (data.k8sUrl) {
        this._values.k8sUrl = data.k8sUrl
      }

      if (data.k8sNamespace) {
        this._values.k8sNamespace = data.k8sNamespace
      }

      if (data.k8sToken) {
        this._values.k8sToken = data.k8sToken
      }

      if (data.k8sType) {
        this._values.k8sType = data.k8sType
      }

      if (data.lastViewedPage) {
        this._values.lastViewedPage = data.lastViewedPage
      }

      if (data.lastViewedPageArg) {
        this._values.lastViewedPageArg = data.lastViewedPageArg
      }
    }

    console.log("loaded settings: " + this._values.dockerHost)

    this._valuesName = environment == null ? 'default' : environment

    return this._values
  }
}
