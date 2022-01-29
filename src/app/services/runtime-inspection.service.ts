import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable } from 'rxjs';
import { map } from 'rxjs/operators';


import { Settings } from '../settings';
import { ContainerConnections } from '../models/container-connections';
import { MicrogatewayReferences } from '../models/microgateway-references';
import {environment} from '../../environments/environment';

@Injectable()
export class RuntimeInspectionService {

  public static INSPECT_URL: string = environment.SERVER_API + '/rad/jc.devops:api/inspect';

  constructor(private _http: HttpClient, private _settings: Settings) {
  }

  public msrStatus(runName: string, containerName?: string, environment?: string): Observable<ContainerConnections[]> {

    let url: string = RuntimeInspectionService.INSPECT_URL + '/msr/' + runName;

    if (containerName) {
      url += '?containerName=' + containerName;
    }

    let headers = new HttpHeaders(environment);

    return this._http.get(url, {headers}).pipe(map((responseData: any) => {

        let connections: ContainerConnections[] = [];
        responseData.connections.forEach((t) => {
          connections.push(t);
        });

        return connections;
      },
      error => {
        return [];
      }));
  }

  public microgatewayStatus(runName: string, containerName?: string, environment?: string): Observable<MicrogatewayReferences[]> {

    let url: string = RuntimeInspectionService.INSPECT_URL + '/apimg/' + runName;

    if (containerName) {
      url += '?containerName=' + containerName;
    }

    let headers: HttpHeaders = this.headers(environment);

    return this._http.get(url, {headers}).pipe(map((responseData: any) => {
      let refs: MicrogatewayReferences[] = [];
      (<any> responseData).gateways.forEach((t) => {
        refs.push(t);
      });

      return refs;

    }, error => {
      return [];
    }));
  }

  private headers(environment?: string): HttpHeaders {

    let headers: HttpHeaders = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Accept', 'application/json')
      .append('Cache-Control', 'no-cache')
      .append('Cache-Control', 'no-store')
      .append('Pragma', 'no-cache')
      .append('Expires', '0')
      .append('Accept', 'application/json');

    if (environment != null) {
      headers = headers.append('environment',environment);
    }

    return headers;
  }
}
