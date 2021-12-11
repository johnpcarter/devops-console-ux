
export class Source {

  	public gitURI: string
  	public gitUser: string
  	public gitPassword: string
  	public gitRepository: string
  	public type: string
  	public include: string[]
  	public exclude: string[]
  	public targetDir: string

 	public constructor() {

  		this.include = []
  		this.exclude = []
  	}

 	public merge(other: Source) {

 		this.include = other.include
 		this.exclude = other.exclude

 		if (other.gitURI)
 			this.gitURI = other.gitURI

 		if (other.gitRepository)
 		  this.gitRepository = other.gitRepository

 		if (other.gitUser)
 			this.gitUser = other.gitUser

 		if (other.gitPassword)
 			this.gitPassword = other.gitPassword

 		if (other.type)
 			this.type = other.type

 		if (other.targetDir)
 			this.targetDir = other.targetDir
 	}

 	public static make(data: any): Source {

 		let s: Source = new Source()
		s.gitURI = data.gitURI
		s.gitRepository = data.gitRepository
		s.gitUser = data.gitUser
		s.gitPassword = data.gitPassword
		s.targetDir = data.targetDir
		s.type = data.type

		if (data.include)
			s.include = data.include

		if (data.exclude)
			s.exclude = data.exclude

		return s
 	}
}
