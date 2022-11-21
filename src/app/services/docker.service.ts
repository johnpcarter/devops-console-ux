import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observer, Observable, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'

import { NgxXml2jsonService } from 'ngx-xml2json'

import { DockerImage } from '../models/docker-image'
import { Container } from '../models/container'
import { Installer } from '../models/Installer'
import { Builder } from '../models/build'
import { RunSet } from '../models/project'
import { Port } from '../models/environment'

import { WebSocketService } from './websocket.service'

import { Settings } from '../settings'
import { environment } from '../../environments/environment'

export enum DockerFilterType {
 all,
 sag,
 custom
}

@Injectable()
export class DockerService {

    public static INSTALL: string = environment.SERVER_API + "/rad/jc.devops:api/docker/install"
    public static BUILD: string = environment.SERVER_API + "/rad/jc.devops:api/docker/build"
    public static RUN: string = environment.SERVER_API + "/rad/jc.devops:api/docker/run"
    public static RUNKS8: string = environment.SERVER_API + "/rad/jc.devops:api/k8s/run"
    public static STOP: string = environment.SERVER_API + "/rad/jc.devops:api/docker/stop"
    public static CONTAINERS: string = environment.SERVER_API + "/rad/jc.devops:api/docker/containers"
    public static IMAGES: string = environment.SERVER_API + "/rad/jc.devops:api/docker/images/"
    public static IMAGE: string = environment.SERVER_API + "/rad/jc.devops:api/docker/image/"

    private __allImages: DockerImage[] = []
    private _baseImages: DockerImage[] = []
    private _sagImages: DockerImage[] = []
    private _customImages: DockerImage[] = []

    private _keyedImages: Map<string, DockerImage> = new Map()

    constructor(private _settings: Settings, private _http: HttpClient, private _ngxXml2jsonService: NgxXml2jsonService) {

        this._keyedImages = new Map<string, DockerImage>()
    }

    public pullImage(name: string, version?: string, environment?: string): Observable<DockerImage> {

      let url: string = DockerService.IMAGE + encodeURIComponent(name) + "/"

      if (version)
        url += "?version=" + version

      let headers = this.headers(environment)

       let options: any = { headers }

       return this._http.get(url, options).pipe(map( (responseData) => {

            return DockerImage.make((<any>responseData).imageInfo)

          }), catchError((error) => {
           console.log(error.message)
           return of(null)
       }))
    }

    public pushImage(image: DockerImage, environment?: string): Observable<boolean> {

      let url: string = DockerService.IMAGE + encodeURIComponent(image.tag()) + "/"

      //if (image.version())
       // url += "?version=" + image.version()

      let headers = this.headers(environment)

       let options: any = { headers }

       return this._http.put(url, options).pipe(map( (responseData) => {

            return true

          }), catchError(error => {
            return of(false)
        }))
    }

    public image(name: string):Observable<DockerImage> {

      if (this._keyedImages.size == 0) {

        return this.customImages(false).pipe(map( (images) => {
          return this._image(name)
        }))
      } else {
        return of(this._image(name))
      }
    }

    public images(useCache: boolean, filterKey?: string, filterValue?: string, environment?: string): Observable<DockerImage[]> {

    let url: string = DockerService.IMAGES
    let headers = this.headers(environment)

    let options: any = { headers }

    if (filterValue) {
        options = { headers, params: new HttpParams().append("filter", "{ label: [ " +  filterKey + "=" + filterValue  + "]}") }
    }

    return this._http.get(url, options).pipe(map( (responseData) => {

        return this._mapImagesResponse(filterValue, responseData)

      },
      error => {
        return null
     }))
    }

    public baseImages(refresh: boolean): Observable<DockerImage[]> {

         if (this._baseImages.length > 0 && !refresh) {
             return of(this._baseImages)
         } else {
             return this._allImages(refresh, DockerFilterType.all).pipe(map((results) => {

                 this._baseImages = this._groupImagesByVersion(results, DockerFilterType.all)

                 return this._baseImages
             }))
         }
    }

    public sagImages(refresh: boolean): Observable<DockerImage[]> {

         if (this._sagImages.length > 0 && !refresh) {
             return of(this._sagImages)
         } else {
             return this._allImages(refresh, DockerFilterType.sag).pipe(map((results) => {

                 this._sagImages = this._groupImagesByVersion(results, DockerFilterType.sag)

                 return this._sagImages
             }))
         }
    }

    public customImages(refresh: boolean): Observable<DockerImage[]> {

        if (this._customImages.length > 0 && !refresh) {
             return of(this._customImages)
        } else {
             return this._allImages(refresh, DockerFilterType.custom).pipe(map((results) => {

                 this._customImages = this._groupImagesByVersion(results, DockerFilterType.custom)

                 return this._customImages
             }))
        }
    }

    public versions(uniqueName: string): Observable<DockerImage[]> {

        if (this._customImages.length == 0) {
           return this.customImages(true).pipe(map((imgs) => {
                return this._versions(uniqueName)
            }))
        } else {
            return of(this._versions(uniqueName))
        }
    }

    public containers(filterValue?: string, environment?: string): Observable<Container[]> {

        let url: string = DockerService.CONTAINERS

        let headers = this.headers(environment)

        let options: any = { headers }

        return this._http.get(url, options).pipe(map( (responseData) => {

            return this._mapContainerResponse(filterValue, responseData)

          },
          error => {
            return null
           }))
    }

    public containerLog(containerId: string): Observable<string> {

       let ws: WebSocketService = WebSocketService.default("docker/container", containerId)

       console.log("ws " + ws.isActive())

       let def: any = {"containerId": containerId}

       return Observable.create((observer: Observer<string>) => {

          ws.send(JSON.stringify(def)).subscribe((result) => {

         if (result) {
           return ws.listen().subscribe((log) => {
             observer.next(log)
           })
         }
         else {
           observer.complete()
         }
         })
       })
    }

    public install(installer: Installer, comments: string, user?: string, password?: string, encryptedPassword?: string, archiveWmImage?: boolean, environment?: string): Observable<any> {

      let url: string = DockerService.INSTALL

      let headers = this.headers(environment)

      headers = headers.append("dedicatedRepo", "" + installer.targetImage.dedicatedRepository())

      if (archiveWmImage)
        headers = headers.append("archiveWmImage", "" + archiveWmImage)

      //installer.version = version
      installer.targetImage.id = null

      let wrapper = {install: installer, comments: comments, downloadOnly: "false"}
      let body: string = JSON.stringify(wrapper, stringifyReplacer)

      let obs: Observable<Result> =  this._http.post(url, body, { headers }).pipe(map( (responseData) => {

          let targetImage: DockerImage = this._keyedImages.get(installer.targetImage.uniqueName())

          if (!targetImage) {
            targetImage = installer.targetImage
            this._keyedImages.set(targetImage.uniqueName(), targetImage)
            this._sagImages.push(targetImage)
            this.__allImages.push(targetImage)
          }

          targetImage.availableVersions.unshift(installer.targetImage)

          installer.targetImage.id = (<any>responseData).imageId
          this._baseImages.unshift(installer.targetImage)

          if ((<any>responseData).imageId) {
            if (archiveWmImage)
              return new Result(true, (<any>responseData).imageId, (<any>responseData).wmImageName)
            else
              return new Result(true, (<any>responseData).imageId)
          } else {
            return new Result(false)
          }

        }))

      return WebSocketService.default("docker/log").listen(obs)
    }

    public build(builder: Builder, version: string, comments: string, environment?: string, push?: boolean): Observable<any> {

  		let url: string = DockerService.BUILD

        if (push) {
            url += "?push=true"
        }

  		let headers = this.headers(environment)
        headers = headers.append("dedicatedRepo", "" + builder.targetImage.dedicatedRepository())

        builder.version = version
        builder.targetImage.id = null

        let wrapper = {build: builder, comments: comments, downloadOnly: "false"}
  		let body: string = JSON.stringify(wrapper, stringifyReplacer)

  		let obs: Observable<Result> = this._http.post(url, body, { headers }).pipe(

        map( (responseData) => {

          let targetImage: DockerImage = this._keyedImages.get(builder.targetImage.uniqueName())

          if (!targetImage) {

            // new image

            targetImage = builder.targetImage.copy()

            console.log("adding image " + targetImage.uniqueName()  + " / " + targetImage.type + " to custom images array....... " + this._customImages.length)

            this._keyedImages.set(targetImage.uniqueName(), targetImage)
            this._customImages.push(targetImage)
            this.__allImages.push(targetImage)

            console.log("done adding image " + targetImage.uniqueName() + " to custom images array....... " + this._customImages.length)
          }

          // update versions to include this one
          targetImage.availableVersions.unshift(builder.targetImage)
          targetImage.isCustom = true
          targetImage.createdDate = new Date()

          builder.targetImage.id = (<any>responseData).imageId

          console.log("build completed")

          if ((<any>responseData).imageId) {
              return new Result(true, (<any>responseData).imageId)
           } else {
             return new Result(false)
           }
        }),catchError((error) => {
          console.log(error.message)
          return of(error)
        }))

      return WebSocketService.default("docker/log").listen(obs)
    }

    public closeLog() {

      WebSocketService.closeDefault()
    }

     public downloadInstall(installer: Installer, comments: string, user?: string, password?: string, encryptedPassword?: string): Observable<string> {

      let url: string = DockerService.INSTALL

      let headers = this.headers()

      headers = headers.append("dedicatedRepo", "" + installer.targetImage.dedicatedRepository())

      //installer.version = version
      installer.targetImage.id = null

      let wrapper = {install: installer, comments: comments, downloadOnly: "true"}
      let body: string = JSON.stringify(wrapper, stringifyReplacer)

      return this._http.post(url, body, { headers }).pipe(

        map( (responseData) => {

          return (<any>responseData).zipFile

        }))
    }

    public downloadBuild(builder: Builder, version: string, comments: string): Observable<string> {

      let url: string = DockerService.BUILD

      let headers = this.headers()

      headers = headers.append("dedicatedRepo", "" + builder.targetImage.dedicatedRepository())

      builder.version = version
      builder.targetImage.id = null

      let wrapper = {build: builder, comments: comments, downloadOnly: "true"}
      let body: string = JSON.stringify(wrapper, stringifyReplacer)

      return this._http.post(url, body, { headers }).pipe(

        map( (responseData) => {

          return (<any>responseData).zipFile

        }))
    }


    public run(run: RunSet, runAsKS8: boolean, includeTests: boolean, download: boolean, uploadAPI: boolean, environment: string, pull: boolean): Observable<any> {

      let url: string

      if (runAsKS8)
        url = DockerService.RUNKS8
      else
        url = DockerService.RUN

      if (pull) {
              url += "?pull=true"
      }

      let headers = this.headers(environment)

      if (includeTests != null) {
        headers = headers.append("test", "" + includeTests)
      }

      if (uploadAPI != null) {
        headers = headers.append("uploadAPIs", "" + uploadAPI)
      }

      if (download) {
        headers = headers.append("generateOnly", "true")
      }

      let body: string = JSON.stringify(run)

      let obs: Observable<any> = this._http.post(url, body, { headers, responseType: "blob" as "json" }).pipe(

        map( (responseData) => {

          if (download)
            return responseData
          else
            return "ok"

        }),
        catchError((error) => {
          console.log(error.message)
          return of(error)
        }))

      if (download)
        return obs
      else
        return WebSocketService.default("docker/log").listen(obs)
    }

    public stop(run: RunSet, environment?: string): Observable<boolean> {

      let url: string = DockerService.STOP + "/" + encodeURIComponent(run.name)

      let headers = this.headers(environment)

      return this._http.get(url, { headers }).pipe(

        map( (responseData) => {

          return true

        }), catchError(this.handleErrorBool))
    }

    public stopContainer(containerId: string, environment?: string): Observable<boolean> {

      let url: string = DockerService.STOP + "/" + containerId + "?isContainerId=true"

      let headers = this.headers(environment)

      return this._http.get(url, { headers }).pipe(

        map( (responseData) => {

          return true

        }), catchError(this.handleErrorBool))
    }

    private handleError(error): string {

      console.log("intercepted error: " + JSON.stringify(error))

      return error;//of("")
    }

    private handleErrorBool(error): Observable<boolean> {

      console.log("intercepted error: " + JSON.stringify(error))

      return of(false)
    }

    private _mapContainerResponse(filter: string, responseData: any): Container[]
    {
 // data is returned as list called references or as a single entity

         let containers: Container[] = []

         responseData.containers.forEach((c) => {
            containers.push(this._makeContainerFromDockerResponse(c))
         })

         return containers
    }

    private _versions(uniqueName: string): DockerImage[] {

        if (this._keyedImages.get(uniqueName)) {

            let img: DockerImage = this._keyedImages.get(uniqueName)
            let versions: DockerImage[] = img.availableVersions

            let out: DockerImage[] = []

            if (versions.length == 0) {
              out.push(img)
            } else {
                 versions.forEach((v) => {
                    out.push(v)
                })
            }

            return out
        }
        else {
            return []
        }
    }

    private _image(name: string): DockerImage {

      return this._keyedImages.get(name)
    }

    private _allImages(refresh: boolean, filterType: DockerFilterType): Observable<DockerImage[]> {

        if (!refresh && this.__allImages.length > 0) {

            return of(this._filterAllList(filterType))

        } else {
            // fetch

            return this.images(false, null, null).pipe(map((results) => {

                this.__allImages = []

                results.forEach((a) => {
                    this.__allImages.push(a)
                })

                return this._filterAllList(filterType)
            }))
        }
    }

    private _groupImagesByVersion(dockerList: DockerImage[], type: DockerFilterType): DockerImage[] {

        dockerList.forEach((d) => {

          if (!d.name().endsWith('.d')) {
            let matchedImage: DockerImage = this._keyedImages.get(d.uniqueName())

            if (matchedImage == null) {
                this._keyedImages.set(d.uniqueName(), d)
                matchedImage = d
            }

            // add to version history too

            if (!matchedImage.hasVersionAlready(d)) {
              matchedImage.addVersion(d)
            }
          }
        })

        let it: IterableIterator<DockerImage> = this._keyedImages.values()

        let groupedList: DockerImage[] = []
        let itObj: IteratorResult<DockerImage>

        while (!(itObj=it.next()).done) {

            if (type == DockerFilterType.custom && itObj.value.isCustom)
              groupedList.push(itObj.value)
            else if (type == DockerFilterType.sag && itObj.value.isSagImage && !itObj.value.isCustom)
               groupedList.push(itObj.value)
            else if (type == DockerFilterType.all)
               groupedList.push(itObj.value)
        }

        return groupedList
    }

    private _filterAllList(type: DockerFilterType): DockerImage[] {

        if (type == DockerFilterType.all) {
            return this.__allImages
        } else {
            let out: DockerImage[] = []

            this.__allImages.forEach((a) => {

                if (a.name) {
                    if (type == DockerFilterType.custom && a.isCustom)
                        out.push(a)
                    else if (type === DockerFilterType.sag && a.isSagImage)
                        out.push(a)
                }
            })

            return out
        }
    }

    private _mapImagesResponse(filter: string, responseData: any): DockerImage[]
    {
 // data is returned as list called references or as a single entity

     let images: DockerImage[] = []

     responseData.images.forEach((i) => {

            let image: DockerImage = DockerImage.make(i)

            if (image.name() && image.tag() && image.tag() != 'none')
             images.push(image)
     })

     return images
    }

    private _makeContainerFromDockerResponse(data: any): Container {

        let c: Container = new Container()

        c.id = data.id.substring(0, 8)
        c.names = data.names
        c.image = data.image; // key
        c.status = data.status
        c.state = data.state

        if (c.names) {
          for (var i =0; i < c.names.length; i++) {
            if (c.names[i].startsWith("/"))
              c.names[i] = c.names[i].substring(1)
          }
        }
        if (c.names)
          c.name = c.names[0]

        if (data.Created)
          c.created = new Date(+data.Created)//*1000)
        else
          c.created = data.createdDate

        c.runningVersion = data.runningVersion

        if (data.names)
            c.description = data.names[0]

        if (data.ports) {
            c.environmentSettings().ports = []

            data.ports.forEach((p) => {
                if (p.external)
                    c.environmentSettings().ports.push(new Port(p.internal, p.external,  p.external, p.type))
            })
        }
        return c
    }

    private headers(environment?: string): HttpHeaders {

      let headers: HttpHeaders = new HttpHeaders()
          .append('Content-Type', 'application/json')
          .append('Accept', 'application/json')
          .append('Cache-Control', 'no-cache')
          .append('Cache-Control', 'no-store')
          .append('Pragma','no-cache')
          .append('Expires', '0')
          .append('Accept', 'application/json')

    if (environment != null) {
      headers = headers.append('environment',environment);
    }

      return headers
    }
}

export class Result {

  public constructor(public success: boolean, public imageId?: string, public otherId?: string) {

  }
}

function stringifyReplacer(key, value) {
  const originalObject = this[key]
  if(originalObject instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
    }
  } else {
    return value
  }
}
