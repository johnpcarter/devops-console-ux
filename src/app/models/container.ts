import { DockerImage, TestStatus }  from '../models/docker-image'
import { TestTraceService }         from '../services/test-trace.service'
import { BuildCommand }              from './build'
import { DockerBuild }              from './docker-build'
import { Arg, Environment, Port, Volume } from './environment'

export enum ContainerType {
  other = "other",
  msr = "msr",
  apigw = "apigw",
  apimg = "apimg",
  apipr = "apipr",
  um = "um",
  tc = "tc",
  mws = "mws"
}

export class Container {

  public name: string
  public names: string[]
  public active: string
  public type: ContainerType
  public typeLabel: string
  public description: string
  public hostname: string
  public secure: string
  public image: string
  public build: DockerBuild
  public environments: Environment[]
  public readinessProbe
  public livenessProbe
  public adminUser: string
  public adminPassword: string
  public testStatus: TestStatus = TestStatus.unknown

  // runtime only

  public id: string
  public state: string
  public status: string
  public created: Date
  public runningVersion: string

  constructor() {

    this.active = "true"
    this.environments = [new Environment()]
  }

  public copy() {
    return Container.make(this)
  }

  public uniqueName(usesDedicatedRepo: boolean): string {

    let repo: string = this.repository()

    if (repo)
      return repo + (usesDedicatedRepo ? "/" : ":") + this.imageName()
    else
      return this.imageName()
  }

  public repository(): string {

    if (this.image.indexOf(":") != -1) {

      return this.image.substring(0, this.image.indexOf(":"))
    } else {
      return null
    }
  }

  public imageName(): string {

    let name: string = this.image

    const idx: number = name.indexOf(':')

    if (idx !== -1) {

      const rside = name.substring(idx + 1)

      if (rside === 'latest' || DockerImage.isVersionNumber(rside)) {

        // name is on left side

        if (this.image.lastIndexOf('/') !== -1) {
          const start: number = this.image.lastIndexOf('/')
          const end: number = this.image.indexOf(':')

          name = this.image.substring(start + 1, end)
        } else {
          name = name.substring(0, idx)
        }
      } else {

        // name and perhaps version is in right side

        name = rside

        if (name.indexOf('-') !== -1) {

          const start: number = name.lastIndexOf('-')
          const b4: string = name.substring(0, start)
          const af: string = name.substring(start + 1, name.length)

          if (DockerImage.isVersionNumber(af)) {
            name = b4
          }
        }
      }
    }

    if (name.endsWith('.d')) {
      name = name.substring(0, name.length - 2)
    }

    return name
  }

  public preferredImageVersion(): string {

    if (this.image && this.image.indexOf(":")) {

      let version: string = this.image.substring(this.image.indexOf(":")+1, this.image.length)

      if (version.indexOf("-") != -1) {
        let idx: number = version.lastIndexOf("-")
        version = version.substring(idx+1, version.length)
      }

      // no versioning, only a name

      if (!DockerImage.isVersionNumber(version))
        version = "latest"

      return version
    } else {

      return "latest"
    }
  }

  public setType(type: string) {

    this.typeLabel = type

    if (type && Object.keys(ContainerType).indexOf(type) != -1) {
      this.type = ContainerType[type]
    } else {
      this.type = ContainerType.other
    }
  }
  public static make(data: any): Container {

    let c: Container = new Container()
    c.names = data.names
    if (data.names)
      c.name = data.names[0]
    else
      c.name = data.name

    c.active = data.active
    c.description = data.description
    c.hostname = data.hostName
    c.secure  = data.secure
    c.image = data.image
    c.adminUser = data.adminUser
    c.adminPassword = data.adminPassword

    c.setType(data.type)

    if (data.typeLabel != null)
      c.typeLabel = data.typeLabel
    else
      c.typeLabel = data.type

    if (data.build)
      c.build = DockerBuild.make(data.build)

    if (data.environments)
      c.environments = Environment.makeArray(data.environments)

    if (data.ports) {
      c.environmentSettings().ports = Port.makeArray(data.ports)
    }

    if (data.env) {
      c.environmentSettings().env = Arg.makeArray(data.env)
    }

    if (data.volumes) {
      c.environmentSettings().volumes = Volume.makeArray(data.volumes)
    }

    if (data.readinessProbe)
      c.readinessProbe = Probe.make(data.readinessProbe)

    if (data.livenessProbe)
      c.livenessProbe = Probe.make(data.livenessProbe)

    return c
  }

  public fileForType(type: string, name?: string) {

    let file: BuildCommand = null

    for (var i = 0; i < this.build.buildCommands.length; i++) {

      let f: BuildCommand = this.build.buildCommands[i]

      if (f.fileType == type && (!name || name == f.source || name == f.description)) {
        file = f
      }
    }

    return file
  }

  public getTestStatus(runName: string, _testService: TestTraceService) {

    _testService.testStatus(runName, this.name).subscribe((r) => {
      this.testStatus = r
    })
  }

  public addEnvironmentVariable(arg: Arg, environmentName: string = null) {

    let env = this.environmentSettings(environmentName)

    env.env.push(arg)
  }

  public environmentVariable(id: string, environmentName: string = null) {

    let env = this.environmentSettings(environmentName)

    return env.environmentVariable(id)
  }

  public environmentSettings(environmentName: string = null): Environment {

    if (environmentName == null || this.environments.length == 1) {
      return this.environments[0]
    } else {
      let found: Environment = null

      this.environments.forEach((e) => {
        if (e.name.toLowerCase() == environmentName.toLowerCase()) {
          found = e
        }
      })

      return found
    }
  }

  public updateEnvironmentSettings(env: Environment) {

    env.mergeSettings(this.environmentSettings(env.name)); // get existing
  }
}

export class Probe {

  public path: string
  public port: string
  public initialDelaySeconds: number
  public periodSeconds: number
  public timeoutSeconds: number

  public static make(data: any): Probe {

    let p = new Probe()
    p.path = data.path
    p.port = data.port
    p.initialDelaySeconds = Number(data.initialDelaySeconds)
    p.periodSeconds = Number(data.periodSeconds)
    p.timeoutSeconds = Number(data.timeoutSeconds)

    return p
  }
}
