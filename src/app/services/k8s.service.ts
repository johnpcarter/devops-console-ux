import { Injectable }                  from '@angular/core'
import { HttpClient, HttpHeaders,
          HttpParams }                 from '@angular/common/http'
import { Observable, of }              from 'rxjs'
import { switchMap, map, catchError }  from 'rxjs/operators'

import { Settings }                    from '../settings'

import { DockerImage, VersionType }    from '../models/docker-image'
import { K8sDeploymentDefinition,
            K8sContainerRef }          from '../models/k8s-deployment-definition'
import { K8sDeployment }               from '../models/k8s-deployment'
import { K8sPod }                      from '../models/k8s-pod'

@Injectable()
export class K8sService {

  //public static URL: string = "/apis/apps/v1/namespaces/NMESPCE/deployments"
  //public static NAMESPACES: string = "/api/v1/namespaces"
  //public static DEPLOYMENTS: string = "/apis/extensions/v1beta1/namespaces/NMESPCE/deployments"
  //public static DEPLOY: string = "/apis/apps/v1/namespaces/NMESPCE/deployments/NAMEDEPLOY"

    public static NAMESPACES: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/namespace"
    public static DEPLOYMENTS: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/deployments"
    public static DEPLOYMENT: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/deployment"
    public static SCALE: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/scale"
    public static UPDATE: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/update"

  //  public static URL: string = "/apis/apps/v1/namespaces/NMESPCE/pods"
    //public static RESOURCE: string = "/api/v1/namespaces/NMESPCE/pods"
  public static RESOURCE: string = Settings.SERVER_API + "/rad/jc.devops:api/k8s/pods"

    //public static SCALE: string = "/apis/apps/v1/namespaces/NMESPCE/deployments/NAMEDEPLOY/scale"

   private _K8sUrl: string
   private _K8sToken: string

  public _cache: Map<String, K8sDeploymentDefinition[]>

  constructor(private _settings: Settings, private _http: HttpClient) {

      this._cache = new Map()

      this._settings.values().subscribe((v) => {
            this._K8sUrl = v.k8sUrl
            this._K8sToken = v.k8sToken
      })
  }

  public namespaces(K8sUrl?: string, K8sToken?: string): Observable<string[]> {

    if (K8sToken)
      this._K8sToken = K8sToken

    if (K8sUrl)
      this._K8sUrl = K8sUrl

    //let url: string = this._K8sUrl + K8sDeploymentService.NAMESPACES

    let url: string = K8sService.NAMESPACES

    let headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')
     // .append('Authorization', 'Bearer ' + this._K8sToken)

    return this._http.get(url, { headers }).pipe(map( (responseData) => {

        return this._mapResponseNamespace(responseData)

      },
      error => {
        return null
     }))
  }

  public deployments(namespace: string, useCache?: boolean): Observable<K8sDeploymentDefinition[]> {

    if (useCache && this._cache.get(namespace == null ? 'default' : namespace)) {

      return of(this._cache.get(namespace == null ? 'default' : namespace))

    } else {

      //let url: string = this._K8sUrl + K8sDeploymentService.DEPLOYMENTS.replace(/NMESPCE/, namespace)
      let url: string = K8sService.DEPLOYMENTS + "/" + namespace

      let headers = new HttpHeaders()
                            .append('Content-Type', 'application/json')
                            .append('Accept', 'application/json')
                            //.append('Authorization', 'Bearer ' + this._K8sToken)

          return this._http.get(url, { headers }).pipe(map( (responseData) => {

              return this._mapResponse(namespace, responseData)

            },
            error => {
              return null
           }))
        }
    }

    public podsForAppLabel(namespace: string, app: string): Observable<K8sPod[]> {

        //let url: string = this._K8sUrl + K8sPodService.RESOURCE.replace(/NMESPCE/, namespace)
        let url: string = K8sService.RESOURCE + "/" + namespace

    let headers = new HttpHeaders()
                            .append('Content-Type', 'application/json')
                            .append('Accept', 'application/json')
                            .append('Cache-Control', 'no-cache')
                            .append('Cache-Control', 'no-store')
                            .append('Pragma','no-cache')
                            .append('Expires', '0')
                           // .append('Authorization', 'Bearer ' + this._K8sToken)

        let httpParams: HttpParams = new HttpParams().append('app', app)

      return this._http.get(url, { headers, params: httpParams }).pipe(map( (responseData) => {

          return this._mapPodsResponse(namespace, responseData)

          },
          error => {
              return null
      }))
    }

    public updateVersion(deployment: K8sDeploymentDefinition, containers: K8sContainerRef[]): Observable<boolean> {

       let url: string = K8sService.UPDATE + "/" + deployment.namespace + "/" + deployment.name

        let headers = new HttpHeaders()
                            .append('Content-Type', 'application/json')
                            .append('Accept', 'application/json')

        let body: string = JSON.stringify(containers)

        console.log("body is " + body)

        return this._http.post(url, body, { headers }).pipe(map((responseData) => {

            deployment.containers.forEach((c) => {
                c.setVersion(c.getNextVersion(VersionType.minor))
            })

            return true
        },
          error => {
              console.log("error is " + error.message)
            return false
        }))
    }

    public rollbackLastChange(deployment: K8sDeploymentDefinition): Observable<boolean> {

        return of(true)
    }

    public deleteDeployment(deployment: K8sDeploymentDefinition): Observable<boolean> {

        // let url: string = this._K8sUrl + K8sDeploymentService.DEPLOY.replace(/NMESPCE/, deployment.namespace)
        //                                                     .replace(/NAMEDEPLOY/, deployment.name)

        let url: string = K8sService.DEPLOYMENT + "/" + deployment.namespace + "/" + deployment.name

        let headers = new HttpHeaders()
            .append('Content-Type', 'application/json')
            .append('Accept', 'application/json')
        //.append('Authorization', 'Bearer ' + this._K8sToken)

        return this._http.delete(url, { headers }).pipe(map((responseData) => {

            return true
        }), catchError((error) => {
            console.log("operation failed due to:" + error.message)
            return of(false)
        }))
    }

    public scalePods(deployment: K8sDeploymentDefinition, count: number): Observable<boolean> {

       // let url: string = this._K8sUrl + K8sDeploymentService.DEPLOY.replace(/NMESPCE/, deployment.namespace)
       //                                                     .replace(/NAMEDEPLOY/, deployment.name)

      let url: string = K8sService.SCALE + "/" + deployment.namespace + "/" + deployment.name + "?replicas=" + count

      let headers = new HttpHeaders()
                            .append('Content-Type', 'application/json')
                            .append('Accept', 'application/json')
                            //.append('Authorization', 'Bearer ' + this._K8sToken)

      return this._http.get(url, { headers }).pipe(map((responseData) => {

        return true
      }), catchError((error) => {
        console.log("operation failed due to:" + error.message)
        return of(false)
      }))
    }

    /*private _scalePod(deployment: K8sDeploymentDefinition, count: number) {

         let payload: string = this.scalePut.replace(/NAMEDEPLOY/, deployment.name)
                                  .replace(/NMESPCE/, deployment.namespace)
                                  .replace(/SELFLNK/, deployment.reference)
                                  .replace(/SELFID/, deployment.id)
                                  .replace(/RSRCVERSION/, "" + deployment.version)
                                  .replace(/DATESTAMP/, deployment.creationDate.toISOString())
                                  .replace(/NEWCOUNT/, "" + count)
                                  .replace(/OLDCOUNT/, "" + deployment.replicas)
                                  .replace(/NAMEAPP/, deployment.description)

        let url: string = this._K8sUrl + K8sDeploymentService.DEPLOY.replace(/NMESPCE/, deployment.namespace)
                                                            .replace(/NAMEDEPLOY/, deployment.name) + "/scale"

        let headers = new HttpHeaders()
                            .append('Content-Type', 'application/json')
                            .append('Accept', 'application/json')
                            .append('Authorization', 'Bearer ' + this._K8sToken)

        console.log("payload is " + payload)

        return this._http.put(url, payload, { headers }).subscribe((responseData) => {

             console.log("good")

             deployment.replicas = count

          },
          error => {

            console.log("got an error: " + error)
          })
    }*/

    private _mapResponseNamespace(responseData: any): string[]
    {
 // data is returned as list called references or as a single entity

     let names: string[] = []

     if (responseData.results.items) {

        responseData.results.items.forEach((i) => {
         names.push(i.metadata.name)
        })
     }

     return names
    }

    private _mapPodsResponse(filter: string, responseData: any): K8sPod[] {
 // data is returned as list called references or as a single entity

       let images: K8sPod[] = []

         if (responseData.results.items) {

             responseData.results.items.forEach((i) => {
                 images.push(K8sPod.make(i))
             })
         }

       return images
    }

    private _mapResponse(filter: string, responseData: any): K8sDeploymentDefinition[]
    {
 // data is returned as list called references or as a single entity

     let images: K8sDeploymentDefinition[] = []

     if (responseData.results.items) {

        responseData.results.items.forEach((i) => {
         images.push(K8sDeployment.make(i))
        })
     }

     this._cache.set(filter, images)

     return images
    }

    private setupTestData() {

      let deployments: K8sDeploymentDefinition[] = []

      let d1: K8sDeploymentDefinition = new K8sDeploymentDefinition()
      d1.id ="aeglr40ogf4f0330fgs30"
      d1.name = "Hello World"
      d1.description = "how now brown cow"

      let d2: K8sDeploymentDefinition = new K8sDeploymentDefinition()
      d2.id ="b604b10s4030bee"
      d2.name = "UserMgmt API"
      d2.description = "baa baa black sheep"

      deployments.push(d1)
      deployments.push(d2)

      this._cache.set('default', deployments)

        let runningDeployments: K8sDeployment[] = []

        let r1: K8sDeployment = new K8sDeployment()
        r1.id ="aeglr40ogf4f0330fgs30"
        r1.name = "Hello World"
        r1.description = "how now brown cow"

        let r2: K8sDeployment = new K8sDeployment()
        r2.id ="b604b10s4030bee"
        r2.name = "UserMgmt API"
        r2.description = "baa baa black sheep"

        runningDeployments.push(r1)
        runningDeployments.push(r2)

        this._cache.set('run', runningDeployments)
    }

    private buildUpdateSpec(deployment: K8sDeploymentDefinition): any {

        let content: any = {}
        content['$setElementOrder/containers'] = []
        content['containers'] = []

        deployment.containers.forEach((c) => {

            content['$setElementOrder/containers'].push({name: c.altName})

            if (c.repository)
              content['containers'].push({image: c.repository + ":" + c.name + "-" + c.getNextVersion(VersionType.minor), name: c.altName})
            else
              content['containers'].push({image: c.name + ":" + c.getNextVersion(VersionType.minor), name: c.altName})
        })

        return {spec: {template: {spec: content}}}
    }

    private scalePut: string = "{ \
          \"kind\": \"Scale\", \
          \"apiVersion\": \"autoscaling/v1\", \
          \"metadata\": { \
            \"name\": \"NAMEDEPLOY\", \
            \"namespace\": \"NMESPCE\", \
            \"selfLink\": \"SELFLNK\", \
            \"uid\": \"SELFID\", \
            \"resourceVersion\": \"RSRCVERSION\", \
            \"creationTimestamp\": \"DATESTAMP\" \
          }, \
          \"spec\": { \
            \"replicas\": NEWCOUNT \
          }, \
          \"status\": { \
            \"replicas\": OLDCOUNT, \
            \"selector\": \"app=NAMEAPP\" \
          } \
        }"
}
