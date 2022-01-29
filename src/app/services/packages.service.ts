import { Injectable } 	           	 			      from '@angular/core'
import { HttpClient, HttpHeaders }              from '@angular/common/http'
import { Observable }               		        from 'rxjs'
import { map } 						                      from 'rxjs/operators'

import { NgxXml2jsonService } 					        from 'ngx-xml2json'

import { Settings }                     		    from '../settings'
import { WmPackageInfo }                        from '../models/wm-package-info'
import { Source }                               from '../models/git-source'
import {environment} from '../../environments/environment';

export class DependencyWrapper {
  public packages: WmPackageInfo[]
  public dependencies: WmPackageInfo[]
}

export class Sources {

  public gitURI: string
  public gitRepository: string
  public gitUser: string
  public gitPassword: string
  public type: string
  public include: string[]
  public targetDir: string
}

@Injectable()
export class PackagesService {

    public static URI: string = environment.SERVER_API + "/rad/jc.devops:api/package"

    constructor(private _settings: Settings, private _http: HttpClient, private _ngxXml2jsonService: NgxXml2jsonService) {

    }

    public packages(packagesDir?: string): Observable<WmPackageInfo[]> {

      let url: string = PackagesService.URI

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

       if (packagesDir)
         headers = headers.set('packagesDir', packagesDir)

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

          let packages: WmPackageInfo[] = [];

          (<any> responseData).packages.forEach((p) => {
            packages.push(WmPackageInfo.make(p))
          })

           return packages
        },
        error => {
            return []
        }))
    }

    public servicesForPackage(name: string, packagesDir?: string): Observable<string[]> {

      let url: string = PackagesService.URI + "/" + name + "/services"

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

        if (name)
          headers = headers.set('packagesDir', packagesDir)

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

          return (<any> responseData).services
        },
        error => {
            return []
        }))
    }

    public packageDetails(name: string, packagesDir?: string): Observable<WmPackageInfo> {

      let url: string = PackagesService.URI + "/" + name

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      if (packagesDir)
         headers = headers.set('packagesDir', packagesDir)

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

           return WmPackageInfo.make((<any> responseData).packages[0])
        },
        error => {
            return null
        }))
    }

    public index(deploymentSetName: string, source: Source, forceReindex: boolean): Observable<WmPackageInfo[]> {

		  let url: string = PackagesService.URI + "/" + deploymentSetName + "/index"

		  let headers = new HttpHeaders()
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')

      if (forceReindex)
        headers = headers.append("forceReindex", "true")

		  let body: string = JSON.stringify(source)

      return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

            return this._makePackage(responseData)
          },
          error => {
            return []
       	}))
    }

    public checkDependenciesForPackages(packages: string[], name: string): Observable<DependencyWrapper> {

      var packs: string = ""
      packages.forEach((p) => {

        if (packs != "")
          packs = packs + "," + p
        else
          packs = p
      })

      let url: string = PackagesService.URI + "/dependencies/" + encodeURIComponent(packs)

      let headers = new HttpHeaders()
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

        if (name)
          url += "?name=" + name

      return this._http.get(url, { headers }).pipe(map( (responseData) => {

          let packages: WmPackageInfo[] = [];
          (<any>responseData).packages.forEach((p) => {
            if (p != null)
              packages.push(WmPackageInfo.make(p))
            else
              console.log("** WARNING ** - invalid null dependencies found for '" + packs + "' in " + name)
           })

          let dependencies: WmPackageInfo[] = [];
          (<any>responseData).dependencies.forEach((p) => {
            dependencies.push(WmPackageInfo.make(p))
           })

           return {packages: packages, dependencies: dependencies}
        },
        error => {
            return null
        }))
    }

    private _makePackage(responseData: any): WmPackageInfo[] {

      let packages: WmPackageInfo[] = []

      responseData.packages.forEach((p) => {
        packages.push(WmPackageInfo.make(p))
      })

      return packages
    }
}
