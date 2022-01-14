import { APIDefinition }            from './wm-package-info'
import { Container }                from './container';
import { Test }                     from './Test';
import { Builder }                  from './build';

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

export class RunSet {

    public name: string
    public builds: Builder[]
    public deployments: ContainerSet[]

    public namespace: string
    public useKubernetes: string
    public description: string
    public type: string

    public constructor() {

        this.builds = []
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
                p.deployments.push(ContainerSet.make(i))
            })
        }

        return p
    }

    public deploymentFor(id: string): ContainerSet {

        let found: ContainerSet = null

        for (var z = 0; z < this.deployments.length; z++ ) {

            let service: ContainerSet = this.deployments[z]

            if (service.name == id) {
                found = service
                break
            }
        }

        return found
    }

    public deploymentForContainer(container: Container) : ContainerSet {

        let found: ContainerSet = null

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

            let deployment: ContainerSet = this.deployments[z]

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

export class Stage {

    public id: string
    public name: string
    public containerHost: string
    public useKubernetes: string
    public buildOnStart: string
    public deployments: ContainerSet[]
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
                s.deployments.push(ContainerSet.make(c))
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

export class ContainerSet {

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
    return ContainerSet.make(this)
  }

  public static make(data: any): ContainerSet {

    let s: ContainerSet = new ContainerSet(data.namespace)
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
