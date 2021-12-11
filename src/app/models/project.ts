import {APIDefinition} from '../models/wm-package-info'
import {Source} from '../models/git-source'
import {DockerImage, TestStatus} from '../models/docker-image'
import {TestTraceService} from '../services/test-trace.service'

export class DeploymentSet {

  public id: string
  public name: string
  public source: Source
  public active: string
  public apis: APIDefinition[]

  public constructor() {
      this.apis = []
      this.source = new Source()
  }

  public static make(data: any): DeploymentSet {

      let p: DeploymentSet = new DeploymentSet()
      p.id = data.name
      p.name = data.name

      if (data.source)
       p.source = Source.make(data.source)

      p.apis = []

      if (data.apis) {

        data.apis.forEach((a) => {
          p.apis.push(APIDefinition.make(a))
        })
      }

      return p
  }
}

export enum DisplayType {
  hidden = "hidden",
  readonly = "readonly",
  editable = "editable",
  password = "password",
  file = "file",
  dropdown = "dropdown",
  yesno = "yesno"
}

export class BuildCommand {

  public commandType: string
  public buildTarget: string
  public fileType: string
  public source: string
  public target: string
  public description: string = ""
  public display: DisplayType = DisplayType.hidden
  public required: boolean = true
  public conditions: string[]

  public static make(d: any): BuildCommand {

    let f: BuildCommand = new BuildCommand()
    f.commandType = d.commandType
    f.buildTarget = d.buildTarget
    f.fileType = d.fileType
    f.source = d.source
    f.target = d.target
    f.description = d.description
    f.conditions = d.conditions

    if (d.display != null && Object.values(DisplayType).indexOf(d.display) != -1) {
      f.display = DisplayType[d.display]
    } else {
      f.display = DisplayType.hidden
    }

    f.required = false
    return f
  }

  copy() {
    return BuildCommand.make(this)
  }

  public equals(b: BuildCommand): boolean {

    return (b.source && b.source == this.source) || (!b.source && b.target == this.target)
  }

  public matchConditions(args: Map<string, string>): boolean {

    return ArgDisplayType._matchConditions(this.conditions, args)
  }
}

export interface BuildParams {

  name: string
  publicPort(): string
  setPublicPort(port: string)
  assignedLicense(): string
  hostName: string
  entryPoint: string
  exitPoint: string
  healthCheck: string
  args: Map<string, string>
  buildCommands: BuildCommand[]

  fileForType(type: string): BuildCommand[]
  isCustomImage(): boolean
}

export class ArgDisplayType {

  public name: string
  public description: string
  public display: DisplayType = DisplayType.hidden
  public conditions: string[]
  public choices: string[]
  public required: boolean = true

  public constructor(name: string) {
    this.name = name
    this.description = this.name
    this.conditions = []
    this.choices = []
  }

  public copy(): ArgDisplayType {

      let copy: ArgDisplayType = new ArgDisplayType(this.name)
      copy.description = this.description
      copy.display = this.display
      copy.conditions = this.conditions
      copy.choices = this.choices
      copy.required = this.required

      return copy
  }

  public static make(d: any): ArgDisplayType {

    let a: ArgDisplayType = new ArgDisplayType(d.name)

    if (d.display == "editable")
      a.display = DisplayType.editable
    else if (d.display == "readonly")
      a.display = DisplayType.readonly
    else if (d.display == "file")
      a.display = DisplayType.file
    else if (d.display == "password")
      a.display = DisplayType.password
    else if (d.display == "yesno")
      a.display = DisplayType.yesno
    else if (d.display == "dropdown")
      a.display = DisplayType.dropdown
    else
      a.display = DisplayType.hidden

    if (d.required != null)
      a.required = d.required

    a.description = d.description || d.name

    if (d.conditions)
      a.conditions = d.conditions

    if (a.choices)
      a.choices = d.choices

    return a
  }

  public matchConditions(args: Map<string, string>): boolean {

      return ArgDisplayType._matchConditions(this.conditions, args)
  }

  public static _matchConditions(conditions: string[], args: Map<string, string>): boolean {

      if (conditions && conditions.length > 0) {

        let matched: boolean = false

        for (let i = 0; i < conditions.length; i++) {
          let m: string = conditions[i]

          if (m.indexOf("==") != -1) {
            let k: string = m.substring(0, m.indexOf("=="))
            let v: string = m.substring(m.indexOf("==")+2)

            if (args.get(k) == v || (v == "false" && !args.get(k)))
              matched = true

          } else if (m.indexOf("!=") != -1) {
            let k: string = m.substring(0, m.indexOf("!="))
            let v: string = m.substring(m.indexOf("!=")+2)

            if (args.get(k) != v)
              matched = true

          } else if (args.get(m) && args.get(m) != "false")
            matched = true
        }

        return matched
      } else {
        return true
      }
  }
}

export class Port {

  public publicPort: string
  public serviceType: string = ""

  constructor(public internal: string, public external: string, public description: string, public type?: string) {

    if (this.serviceType == null)
      this.serviceType = ''
  }

  public merge(p: Port, allowClear = false) {

    if (p) {
      if (allowClear || p.external) {
        this.external = p.external
      }

      if (allowClear || p.type) {
        this.type = p.type
      }

      if (allowClear || p.publicPort) {
        this.publicPort = p.publicPort
      }

      if (allowClear || p.serviceType) {
        this.serviceType = p.serviceType
      }

      if (allowClear || p.description) {
        this.description = p.description
      }
    }
  }

  public static makeArray(array: any[], keepValues: boolean = true): Port[] {

    let ports: Port[] = []

    array.forEach((p) => {
      let port: Port = new Port(p.internal, keepValues ? p.external : "", keepValues ? p.description : "", keepValues ? p.type : "")
      port.publicPort = keepValues ? p.publicPort : ""
      port.serviceType = keepValues && p.serviceType ? p.serviceType : ""

      ports.push(port)
    })

    return ports
  }
}

export class Volume {

  public k8sStorageType: string = "hostPort"
  public k8sAccessMode: string = "ReadWriteOnce"
  public k8sCapacity: string = "4Gi"

  constructor(public source: string, public target: string, public description: string) {

  }

  public merge(v: Volume, allowClear: boolean = false) {

    if (v) {
      if (allowClear || v.target != "") {
        this.target = v.target
      }

      if (allowClear || v.k8sStorageType != "") {
        this.k8sStorageType = v.k8sStorageType
      }

      if (allowClear || v.k8sAccessMode != "") {
        this.k8sAccessMode = v.k8sAccessMode
      }

      if (allowClear || v.k8sCapacity != "") {
        this.k8sCapacity = v.k8sCapacity
      }

      if (allowClear || v.description != "") {
        this.description = v.description
      }
    }
  }

  public static makeArray(array: any[], keepValues: boolean = true): Volume[] {

    let volumes: Volume[] = []

    array.forEach((a) => {

      let v: Volume = new Volume(a.source, keepValues ? a.target : "", keepValues ? a.description : "")

      if (a.k8sStorageType != null) {
        v.k8sStorageType = keepValues ? a.k8sStorageType : ""
      }

      if (a.k8sAccessMode != null) {
        v.k8sAccessMode = keepValues ? a.k8sAccessMode : ""
      }

      if (a.k8sCapacity != null) {
        v.k8sCapacity = keepValues ? a.k8sCapacity : ""
      }

      volumes.push(v)
    })

    return volumes
  }
}

export class Arg {

  public display: DisplayType = DisplayType.hidden
  public conditions: string[]
  public choices: string[]

  constructor(public source: string, public target: string, public description: string) {

  }

  public merge(v: Arg, allowClear: boolean = false) {

    if (v) {
      if (allowClear || v.target != "") {
        this.target = v.target
      }

      if (allowClear || v.description != "") {
        this.description = v.description
      }

      if (allowClear || v.display) {
        this.display = v.display
      }

      if (allowClear || v.conditions.length > 0) {
        this.conditions = v.conditions
      }

      if (allowClear || v.choices.length > 0) {
        this.choices = v.choices
      }
    }
  }

  public static makeArray(array: any[], keepValues: boolean = true): Arg[] {

    let args: Arg[] = []

    array.forEach((a) => {
      args.push(new Arg(a.source, keepValues ? a.target : "", keepValues ? a.description : ""))
    })

    return args
  }
}

export class Installer implements BuildParams {

    public name: string
    public sourceImageTag: string
    public isNew: string = "true"
    public targetImage: DockerImage
    public productType: string
    public licenseFile: string
    public primaryPort: string
    public hostName: string
    public wmInstallerImage: string
    public includeUpdate: string = "false"
    public buildCommands: BuildCommand[]
    public args: Map<string, string>
    public isSAGProduct: string = "true"

    public entryPoint: string
    public exitPoint: string
    public healthCheck: string

    public constructor() {

    this.sourceImageTag = "centos:latest"
    this.targetImage = new DockerImage()
    this.buildCommands = []
    this.args = new Map<string, string>()
  }

  public copy(): Installer {

    return Installer.make(this)
  }

  public static parse(data: string): Installer {

    return this.make(JSON.parse(data, parserReviver).install)
  }

  public isCustomImage(): boolean {
    return true
  }

  public static make(data: any): Installer {

    let i: Installer = new Installer()
    i.name = data.name
    i.isSAGProduct = data.isSAGProduct
    i.args = data.args
    i.productType = data.productType
    i.wmInstallerImage = data.wmInstallerImage
    i.sourceImageTag = data.sourceImageTag

    if (data.targetImage)
      i.targetImage = DockerImage.make(data.targetImage)

    i.licenseFile = data.licenseFile
    i.primaryPort = data.primaryPort
    i.isNew = data.isNew
    i.includeUpdate = data.includeUpdate
    i.hostName = data.hostName
    i.entryPoint = data.entryPoint
    i.exitPoint = data.exitPoint
    i.healthCheck = data.healthCheck
    i.healthCheck = data.healthCheck

    if (!i.args)
       i.args = new Map<string, string>()

    if (data.buildCommands) {
      data.buildCommands.forEach((f) => {
        i.buildCommands.push(BuildCommand.make(f))
      })
    }

    return i
  }

  public publicPort(): string {
    return this.primaryPort
  }

  public setPublicPort(port: string) {
    this.primaryPort = port
  }

  public assignedLicense(): string {

    return this.licenseFile
  }

  public fileForType(type: string, name?: string): BuildCommand[] {

      return Builder._fileForSource(this.buildCommands, type, name, null)
  }

  public fileWithDescription(type: string, description: string): BuildCommand[] {
      return Builder._fileForSource(this.buildCommands, type, null, description)
  }

  public removeFileForType(type: string, name?: string) {

      return Builder._removeFileForType(this.buildCommands, type, name)
  }

  public toString(): string {
    return JSON.stringify(this, stringifyReplacer)
  }
}

export class Builder implements BuildParams {

  public name: string
  public deploymentType: string
  public deployments: DeploymentSet[]

  public sourceImage: DockerImage
  public targetImage: DockerImage
  public version: string
  public testStatus: string
  public buildCommands: BuildCommand[]
  public hasTests: string
  public buildUser: string
  public entryUser: string
  public entryPoint: string
  public exitPoint: string
  public healthCheck: string
  public args: Map<string, string>

  public hostName: string; // not used!!

  public constructor() {

    this.sourceImage = new DockerImage()
    this.targetImage = new DockerImage()
    this.buildCommands = []

    this.args = new Map<string, string>()
  }

  public hyphenatedName(): string {

    return this.name.toLowerCase().replace(/\s/g, "-")
  }

  public static make(data: any): Builder {

    let b: Builder = new Builder()
    b.name = data.name
    b.deploymentType = data.type

    b.deployments = []

    if (data.deployments) {
      data.deployments.forEach((d) => {
            b.deployments.push(DeploymentSet.make(d))
      })
    }

    if (data.buildCommands) {
      data.buildCommands.forEach((f) => {
            b.buildCommands.push(BuildCommand.make(f))
      })
    }

    b.sourceImage = DockerImage.make(data.sourceImage)
    b.targetImage = DockerImage.make(data.targetImage)
    b.version = data.version
    b.testStatus = data.testStatus
    b.buildUser = data.buildUser
    b.entryUser = data.entryUser
    b.entryPoint = data.entryPoint
    b.exitPoint = data.exitPoint
    b.healthCheck = data.healthCheck

    if (data.hasTests && data.hasTests == 'true')
      b.hasTests = "true"

    return b
  }

  public publicPort(): string {
    return this.sourceImage.primaryPort
  }

  public setPublicPort(port: string) {
    this.sourceImage.primaryPort = port
  }

  public assignedLicense(): string {

    let lic: BuildCommand[] = this.fileWithDescription("licenses",'Product License')

    if (lic.length > 0) {
      return lic[0].target.replace(/\-/g, " ")
    } else {
      return null
    }
  }

  public isCustomImage(): boolean {
    return this.sourceImage.isCustom
  }

  public fileForType(type: string, name?: string): BuildCommand[] {
      return Builder._fileForSource(this.buildCommands, type, name, null)
  }

  public fileWithDescription(type: string, description: string): BuildCommand[] {
      return Builder._fileForSource(this.buildCommands, type, null, description)
  }

  public removeFileForType(type: string, name?: string) {

      return Builder._removeFileForType(this.buildCommands, type, name)
  }

  public static _fileForSource(buildCommands: BuildCommand[], type: string, name: string, description: string): BuildCommand[] {

      let files: BuildCommand[] = []

      for (var i = 0; i < buildCommands.length; i++) {

        let f: BuildCommand = buildCommands[i]

        if (f.fileType == type && (!name || name == f.source) && (!description || description == f.description)) {
          files.push(f)
        }
      }

      return files
  }

  public static _removeFileForType(buildCommands: BuildCommand[], type: string, name?: string) {

      let s: number = -1

      for (var i = 0; i < buildCommands.length; i++) {

        let f: BuildCommand = buildCommands[i]

        if (f.fileType == type && (!name || name == f.source)) {
          s = 0
        }
      }

      if (s != -1) {

        buildCommands.splice(s,1)
      }
  }
}

export class DockerBuild {

  public context: string
  public dockerfile: string
  public buildCommands: BuildCommand[]

  constructor(cmd?: BuildCommand) {
    this.buildCommands = []

    if (cmd)
      this.buildCommands.push(cmd)
  }

  public static make(data: any): DockerBuild {

     let d: DockerBuild = new DockerBuild()

     d.dockerfile = data.dockerfile
     d.context = data.context

     if (data.buildCommands) {
       data.buildCommands.forEach((b) => {
         d.buildCommands.push(BuildCommand.make(b))
       })
     }

     return d
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

export class Environment {

  public name: string = 'Default'

  ports: Port[]
  public env: Arg[]
  public volumes: Volume[]

  constructor() {
    this.ports = []
    this.env = []
    this.volumes = []
  }

  public mergeSettings(original: Environment) {

    this.ports.forEach((p) => {
      // update original only if we have changes

        let op = original.port(p.internal)

        if (op == null && (p.external != "" || p.serviceType != "" || p.publicPort != "" || p.type != "")) {
          original.ports.push(p)
        } else {
          op.merge(p, true)
        }
    })

    this.volumes.forEach((v) => {
      // update original only if we have changes

        let ov = original.volume(v.source)

        if (ov == null && (v.target != "" || v.k8sCapacity != "" || v.k8sAccessMode != "" || v.k8sStorageType != "")) {
          original.volumes.push(v)
        } else {
          ov.merge(v, true)
        }
    })

    this.env.forEach((e) => {
      // update original only if we have changes

        let oe = original.environmentVariable(e.source)

        if (oe == null && e.target != "") {
          original.env.push(e)
        } else {
          oe.merge(e, true)
        }
    })
  }

  public environmentVariable(id: string): Arg {

    var arg: Arg = null

    for (var i = 0; i < this.env.length; i++) {

      if (this.env[i].source == id) {
        arg = this.env[i]
        break
      }
    }

    return arg
  }

  public port(id: string): Port {

    var port: Port  = null

    for (var i = 0; i < this.ports.length; i++) {

      if (this.ports[i].internal == id) {
        port = this.ports[i]
        break
      }
    }

    return port
  }

  public volume(id: string): Volume {

    var volume: Volume = null

    for (var i = 0; i < this.volumes.length; i++) {

      if (this.volumes[i].source == id) {
        volume = this.volumes[i]
        break
      }
    }

    return volume
  }

  public copy(keepValues: boolean = false): Environment {

    return Environment.make(this, keepValues)
  }

  public static makeArray(data: any): Environment[] {
    let out: Environment[] = []

      data.forEach((e) => {
        out.push(Environment.make(e))
      })

    return out
  }

  public static make(data: any, keepValues: boolean = true): Environment {

    let e: Environment = new Environment()

    if (data.name)
      e.name = data.name

    if (data.ports)
      e.ports = Port.makeArray(data.ports, keepValues)

    if (data.env)
      e.env = Arg.makeArray(data.env, keepValues)

    if (data.volumes)
      e.volumes = Volume.makeArray(data.volumes, keepValues)

    return e
  }
}

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
  public typeLabel: String
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

  fileForType(type: string, name?: string) {

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

export class Test {

  public package: string
  public cases: string[]

  constructor() {

  }

  public static make(data: any): Test {

    let t: Test = new Test()

    t.package = data.package
    t.cases = data.cases

    return t
  }
}

export class Authentication {

  public type: string
  public user: string
  public password: string

  constructor() {

  }

  public static make(data: any): Authentication {

    let t: Authentication = new Authentication()

    if (data.type)
      t.type = data.type
    else
      t.type = "Basic"

    t.user = data.user
    t.password = data.password

    return t
  }
}

export class Server {

  public name: string
  public authentication: Authentication

  constructor() {

  }

  public static make(data: any): Server {

    let t: Server = new Server()

    t.name = data.name

    if (data.authentication)
      t.authentication = Authentication.make(data.authentication)

    return t
  }
}

export class Action {

  public active: string
  public apiDeployType: string
  public apiStage: string
  public apiMaturity: string
  public runTests: string
  public dockerAction: string
  public dockerTag: string
  public tests: Test[]
  public stop: string
  public pipelineAction: string

  constructor() {
    this.runTests = "false"
    this.stop = "false"
    this.active = "false"
  }

  public static make(data: any): Action {

    let s: Action = new Action()

    s.active = data.active
    s.apiStage = data.name
    s.apiDeployType = data.apiDeployType
    s.apiStage = data.apiStage
    s.apiMaturity = data.apiMaturity
    s.runTests = data.runTests
    s.dockerAction = data.dockerAction
    s.dockerTag = data.dockerTag
    s.pipelineAction = data.stopOnFail

    s.stop = data.stop

    if (data.tests) {
        data.tests.forEach((t) => {
          s.tests.push(Test.make(t))
        })
    }

    return s
  }

  public isActive(): boolean {

    return (this.apiDeployType != "none" && this.apiDeployType != null) || this.stop == "true" || (this.apiMaturity != "none" &&  this.apiMaturity != null) ||
                  (this.dockerAction != "none"  && this.dockerAction != null) || this.dockerTag != null || this.stop != null
  }

  public summary(): string {

      var status: string = null

      if (this.apiDeployType == "deploy")
          status = "Deploy API's "
      else if (this.apiDeployType == "promote")
        status = "Promote API's to " + this.apiStage

      if (this.runTests == "true") {

        if (status != null)
          status = status + ", run tests"
        else
          status = "Run tests"
      }

      if (this.apiMaturity) {

        if (status != null)
            status = status + ", and set maturity to " + this.apiMaturity
        else
          status = "Set maturity to " + this.apiMaturity
      }

      if (this.dockerTag) {

        if (status != null)
          status = status + ", then tag image"
        else
          status = "Tag image "
      }

      if (this.dockerAction) {
        if (status != null)
          status = status + ", " + this.dockerAction
        else
          status = this.dockerAction

        status = status + " image"
      }

      if (this.stop == "true") {
        if (status != null)
            status = status + " before stopping"
        else
            status = "stop containers"
      }

      if (this.pipelineAction) {

        if (status != null)
            status = status + ", then " + this.pipelineAction + " pipeline"
        else
            status = "and " + this.pipelineAction + " pipeline execution"
      }

      return status
    }
}

export class Stage {

    public id: string
    public name: string
    public containerHost: string
    public useKubernetes: string
    public buildOnStart: string
    public deployments: Deployment[]
    public onStart: Action
    public onFail: Action
    public onSuccess: Action

    constructor() {
      this.deployments = []
      this.useKubernetes = "false"
      this.buildOnStart = "false"
      this.onStart = new Action()
      this.onSuccess = new Action()
      this.onFail = new Action()
    }

    public copy(): Stage {

      let c = Stage.make(this)

      c.id = this.id + " copy"
      c.name = this.name + " copy"

      return c
    }

    public static make(data: any): Stage {

      let s: Stage = new Stage()

      s.name = data.name
      s.id = s.name
      s.containerHost = data.containerHost
      s.useKubernetes = data.useKubernetes
      s.buildOnStart = data.buildOnStart

      if (data.deployments) {
        data.deployments.forEach((c) => {
          s.deployments.push(Deployment.make(c))
        })
      }

      if (data.onStart) {
        s.onStart = Action.make(data.onStart)
      }

      if (data.onSuccess) {
        s.onSuccess = Action.make(data.onSuccess)
      }

      if (data.onFail) {
        s.onFail = Action.make(data.onFail)
      }

      return s
    }
}

export class Deployment {

  public name: string
  public namespace: string
  public hostname: string
  public appName: string
  public apis: APIDefinition[]
  public containers: Container[]
  public replicas: string
  public serviceType: string
  public restartPolicy: string
  public requiresMonitoring: string
  public requiresVersioning: string = "true"
  public dependsOn: string

  constructor(namespace: string) {

    this.namespace = namespace
    this.containers = []
    this.apis = []
  }

  public copy() {
    return Deployment.make(this)
  }

  public static make(data: any): Deployment {

    let s: Deployment = new Deployment(data.namespace)
    s.name = data.name
    s.hostname = data.hostname
    s.replicas = data.replicas
    s.appName = data.appName
    s.serviceType = data.serviceType
    s.restartPolicy = data.restartPolicy
    s.requiresMonitoring = data.requiresMonitoring
    s.requiresVersioning = data.requiresVersioning
    s.dependsOn = data.dependsOn

    if (data.apis) {
       data.apis.forEach((a) => {
         s.apis.push(APIDefinition.make(a))
       })
    }

    if (data.containers) {
       data.containers.forEach((c) => {
         s.containers.push(Container.make(c))
       })
    }

    return s
  }

  public containerForType(type: string): Container {

    let found: Container = null

    this.containers.forEach((c) => {

      if (c.type == type) {
        found = c
      }
    })

    return found
  }

  public removeContainer(c: Container) {

    var found : number = -1

    for (var i = 0; i < this.containers.length; i++) {
      if (c.name == this.containers[i].name) {
        found = i
        break
      }
    }
    if (found != -1) {
      this.containers.splice(found, 1)
    }
  }

  public removeAPI(a: APIDefinition) {

    var found : number = -1

    for (var i = 0; i < this.apis.length; i++) {
      if (a.name == this.apis[i].name) {
        found = i
        break
      }
    }
    if (found != -1) {
      this.apis.splice(found, 1)
    }
  }
}

export class K8sVersions {
  public constructor(public ingressTemplate: string) {

  }
}

export class RunSet {

  public name: string
  public builds: Builder[]
  public deployments: Deployment[]

  public namespace: string
  public useKubernetes: string
  public description: string
  public type: string

  public constructor() {

    this.builds = []

   // this.builds.push(new Builder())

    this.deployments = []
  }

  public static make(data: any): RunSet {

     let p: RunSet = new RunSet()
     p.name = data.name
     p.useKubernetes = data.useKubernetes
     p.namespace = data.namespace
     p.description = data.description
     p.type = data.type

     if (data.builds) {
       p.builds = []
       data.builds.forEach((i) => {
         p.builds.push(Builder.make(i))
       })
    }

    if (data.deployments) {
      p.deployments = []
       data.deployments.forEach((i) => {
         p.deployments.push(Deployment.make(i))
       })
    }

    return p
  }

  public deploymentFor(id: string): Deployment {

      let found: Deployment = null

      for (var z = 0; z < this.deployments.length; z++ ) {

        let service: Deployment = this.deployments[z]

        if (service.name == id) {
          found = service
          break
        }
      }

      return found
  }

  public deploymentForContainer(container: Container) : Deployment {

      let found: Deployment = null

      for (var z = 0; z < this.deployments.length; z++ ) {

        if (this.deployments[z].containers.indexOf(container) != -1) {
          found = this.deployments[z]
          break
        }
      }

      return found
  }

  public containerInDeploymentFor(id: string, tag?: string): Container {

      let found: Container = null

      for (var z = 0; z < this.deployments.length; z++ ) {

        let deployment: Deployment = this.deployments[z]

        for (var i = 0; i < deployment.containers.length; i++) {

          if (deployment.containers[i].name && (deployment.containers[i].name.startsWith(id) || deployment.containers[i].type == id ||
            (tag && deployment.containers[i].image.indexOf(tag) != -1))) {
              found = deployment.containers[i]
              break
            }
        }

        if (found)
          break
      }

      return found
    }
}

export class Project {

  public name: string
  public run: RunSet
  public stages: Stage[]

  public constructor() {

    this.stages = []

    this.run = new RunSet()
    this.stages = []
  }

  public static make(data: any): Project {

    let p: Project = new Project()
    p.name = data.name

    if (data.run)
      p.run = RunSet.make(data.run)

    if (data.stages) {
       data.stages.forEach((s) => {
         p.stages.push(Stage.make(s))
       })
    }

    return p
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

function parserReviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
  }
  return value
}
