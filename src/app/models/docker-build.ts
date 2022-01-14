import { BuildCommand } from './build';

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
