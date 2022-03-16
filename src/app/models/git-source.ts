import { APIDefinition } from './wm-package-info'

export class Repository {
    public name: string
    public description: string
    public branch: string
    public path: string
    public configPath: string
    public type: string
    public include: string[]
    public exclude: string[]
    public useForStandardConfig: boolean
    public selectedAPIs: APIDefinition[] = [] // only used for display purposes, NOT to be persisted

    public constructor(name: string, path?: string, configPath?: string) {

        this.name = name
        this.path = path
        this.configPath = configPath
        this.useForStandardConfig = false

        this.include = []
        this.exclude = []
    }

    public static make(data: any): Repository {

        let r: Repository = new Repository(data.name)

        r.path = data.path
        r.configPath = data.configPath
        r.type = data.type
        r.useForStandardConfig = data.useForStandardConfig

        if (data.include)
            r.include = data.include

        if (data.exclude)
            r.exclude = data.exclude

        return r
    }
}

export class Source {

    public type: string
    public name: string
  	public gitURI: string
  	public gitUser: string
  	public gitPassword: string
    public repositories: Repository[]
  	public targetDir: string

 	  public constructor() {
      this.repositories = []
    }

    public merge(other: Source) {

        if (other.type)
             this.type = other.type

        if (other.name)
            this.name = other.name

 		if (other.gitURI)
 			this.gitURI = other.gitURI

 		if (other.gitUser)
 			this.gitUser = other.gitUser

 		if (other.gitPassword)
 			this.gitPassword = other.gitPassword

 	    if (other.repositories) {
            other.repositories.forEach((r) => {
                this.repositories.push(Repository.make(r))
            })
        }

 		if (other.targetDir)
 			this.targetDir = other.targetDir
 	}

 	public static make(data: any): Source {

 		let s: Source = new Source()
		s.type = data.type || 'git'
        s.name = data.name
        s.gitURI = data.gitURI
		s.gitUser = data.gitUser
		s.gitPassword = data.gitPassword
		s.targetDir = data.targetDir

        if (data.repositories) {
            data.repositories.forEach((r) => {
                s.repositories.push(Repository.make(r))
            })
        }

		return s
 	}
}
