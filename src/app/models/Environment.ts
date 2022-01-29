import { DisplayType } from './build'

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
    public mandatory: boolean = false

    constructor(public source: string, public target: string, public description: string, mandatory?: boolean) {

        this.mandatory = mandatory
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
