import { APIDefinition}           from './wm-package-info'
import { Source }                 from './git-source'
import { DockerImage }            from './docker-image'
import { ArgDisplayType }         from './display-type';

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

      if (buildCommands[i].fileType == type && (!name || name == buildCommands[i].source)) {
        s = i
        break
      }
    }

    if (s != -1) {
      buildCommands.splice(s,1)
    }
  }
}

export class DeploymentSet {

  public id: string
  public name: string
  public source: Source[]
  public active: string
  public apis: APIDefinition[]

  public constructor() {
    this.apis = []
    this.source = [new Source()]
  }

  public static make(data: any): DeploymentSet {

    let p: DeploymentSet = new DeploymentSet()
    p.id = data.id || data.name
    p.name = data.name

    if (data.source) {
      p.source = []
      data.source.forEach((s) => {
        p.source.push(Source.make(s))
      })
    }

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
  public display: DisplayType
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
