import { Arg, Port, Volume } from './container';

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
