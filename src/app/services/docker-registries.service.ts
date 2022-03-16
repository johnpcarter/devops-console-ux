import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {WmPackageInfo} from '../models/wm-package-info';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {GitType, Settings} from '../settings';
import {catchError, map} from 'rxjs/operators';
import {RegistryToken} from '../models/registry-token';
import {environment} from '../../environments/environment';
import {NgxXml2jsonService} from 'ngx-xml2json';
import {DockerImage} from '../models/docker-image';
import {Builder} from '../models/build';

@Injectable()
export class DockerRegistriesService {

    public static URI: string = environment.SERVER_API + "/rad/jc.devops:api/configuration"

    constructor(private _http: HttpClient) {

    }

    public registries(): Observable<RegistryToken[]> {

        let template: string

        let headers = new HttpHeaders()
            .append('Content-Type', 'application/json')
            .append('Accept', 'application/json')

        let url: string = DockerRegistriesService.URI + "/registries"

        return this._http.get(url, { headers }).pipe(map( (responseData) => {
            return (<any>responseData).registries
        }))
    }

    public addRegistry(registry: RegistryToken): Observable<boolean> {

        let url: string = DockerRegistriesService.URI + "/registry"

        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')

        let body: string = JSON.stringify(registry)

        return this._http.post(url, body, { headers }).pipe(map( (responseData) => {

                return true
            },
            error => {
                return false
            }))
    }

    public removeRegistry(name: string): Observable<boolean> {

        let url: string = DockerRegistriesService.URI + "/registry/" + encodeURIComponent(name)

        let headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')

        return this._http.delete(url, { headers })
            .pipe(
                catchError(error => {
                return of({success: []})
            }))
            .pipe(
            map( (responseData) => {
                return true
            }))
    }
}
