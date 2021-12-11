import { DockerImage }                                      from '../models/docker-image'
import {Container, RunSet, Deployment, Port, Arg, Probe, Environment, ContainerType} from '../models/project';
import {ConfigurationService} from '../services/configuration.service'
import {Injectable} from '@angular/core'
import {Observable, Observer} from 'rxjs'

@Injectable()
export class ContainerTemplates {

    public static products: string[] = ["Micro Service Runtime", "Universal Messaging", "API Gateway", "API Micro Gateway", "API Portal", "MyWebMethods", "CentraSite Active SOA", "Terracotta DB", "Micro Service Runtime with JDBC Adapter", "Micro Service Runtime for Monitoring", "MySQL 5.7 Enterprise Edition with webMethods 10.5 schema", "Elastic Search"]
    public static productCodes: string[] = ["msr", "um", "apigw", "apimg", "apipr", "mws", "centrasite", "tc", "msr-jdbc", "msr-monitor", "mysqldb", "elk"]

    public constructor(private _configService: ConfigurationService) {

    }

    public static productCodeLabel(code: string): string {

        if (code)
          return this.products[this.productCodes.indexOf(code)]
        else
          return null
    }

    public static setDefaultsForK8s(run: RunSet) {

        if (!run.namespace && run.name)
            run.namespace = run.name.toLocaleLowerCase().replace(/\s/g,'-').replace('_','-')

        run.deployments.forEach((s) => {

            if (!s.appName)
                s.appName = s.name.toLowerCase().replace(/\s/g,'-').replace('_','-')

            if (!s.serviceType)
               s.serviceType = "Stateless"

            if (!s.replicas)
               s.replicas = "1"

            if (!s.restartPolicy)
               s.restartPolicy = "Always"
        })
    }

    public configureContainerFor(container: Container, image: DockerImage, template: string, environment: string): Observable<boolean> {

        if (image != null && image.name() != "EXTERNAL") {
            container.image = ContainerTemplates.imageRef(image)
        } else {
            container.active = "false"
        }

        return this.applyTemplate(container, image != null ? image.primaryPort : null, template, environment)
    }

    public applyTemplate(container: Container, primaryPort: string, template: string, environment: string): Observable<boolean> {

        let env: Environment = container.environmentSettings(environment)

        env.ports.splice(0, env.ports.length)
        env.volumes.splice(0, env.volumes.length)
        env.env.splice(0, env.env.length)

        return Observable.create((observer: Observer<boolean>) => {

            this._configService.runtimeTemplate(template).subscribe((t) => {

              if (t.name) {
                container.name = t.name
              }

              if (t.hostname) {
                container.hostname = t.hostname
              }

              if (!container.name && t.description)
                container.name = t.description.toLowerCase().replace(/\s/g, "-")

              if (t.description)
                container.description = t.description

              container.setType(template)

              container.description = t.description

              if (!container.image)
                container.image = t.image

              if (!container.livenessProbe)
                container.livenessProbe = t.livenessProbe

              if (!container.readinessProbe)
                container.livenessProbe = t.readinessProbe

              if (env.ports.length == 0)
                env.ports = t.environmentSettings().ports

              if (env.env.length == 0)
                env.env = t.environmentSettings().env

              if (env.volumes.length == 0)
                env.volumes = t.environmentSettings().volumes

              observer.next(true)
            })
        })
    }

    public static indexOfAttribute(container: Container, att: string, environment: string): number {

    	var found: number = -1

    	let env = container.environmentSettings(environment)

    	for (var i = 0; i < env.env.length; i++) {

    		if (env.env[i].source == att) {
    			found = i
    			break
    		}
		  }

		  return found
    }

    private static imageRef(image: DockerImage): string {

        if (image.tag)
            return image.tag()
        else
            return image.name()
    }

}
