import { DockerImage }                          from './docker-image';
import {BuildCommand, Builder, BuildParams }    from './build';

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
