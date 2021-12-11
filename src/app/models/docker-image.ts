
import * as moment from 'moment'

export enum ImageStatus {
	new,
	deployed,
	running,
	failed,
	deprecated
}

export enum TestStatus {
	none = "none",
	unknown = "unknown",
	todo = "todo",
	running = "running",
  completed = "completed",
  passed = "passed",
	failed = "failed",
}

export enum VersionType {
	major,
	minor,
	patch
}

export class DockerImage {

	public static currentImage: DockerImage

	public id: string
	public createdDate: Date
	public sizeGb: number

	private _tag: string
	private _name: string
	private _version: string = "1"
	private _repository: string

	private _dedicatedRepo: boolean

	public altName: string; // used by k8s

	public description: string
	public author: string
	public comments: string
	public buildTemplate: string
	public primaryPort: string

	public osType: string = "centos"
	public type: string
	public status: ImageStatus = ImageStatus.new
	public isCustom: boolean = false
	public isSagImage: boolean = false
	public testStatus: TestStatus = TestStatus.unknown

	public availableVersions: DockerImage[] = []

	public static build(repo: string, name: string, version: string, useDedicatedRepo?: boolean): DockerImage {

		let img: DockerImage = new DockerImage()
		img._repository = repo
		img._name = name
		img._version = version

		if (repo)
			img._tag = repo

		if (name) {
			if (img._tag) {
				if (useDedicatedRepo)
					img._tag += "/" + name
				else
					img._tag += ":" + name
			} else {
				img._tag = name
			}
		}

		if (version) {

			if (img._tag) {
				if (useDedicatedRepo)
					img._tag += ":" + version
				else
					img._tag += "-" + version
			}
		}

		return img
	}

	public constructor(tag?: string) {

		if (tag) {
			this._setTag(tag)
		}
	}

	public match(tag: string, version?: string): DockerImage {

    if (this.tag() == tag) {
      return this
    } else if (tag == this._name) {
      // check available versions

      let found: DockerImage = null

      if (version != null && version != 'latest') {
        this.availableVersions.forEach((v) => {
          if (v._version == version) {
            found = v
          }
        })
      } else {
        // assume they want the latest version

        found = this
      }

      return found
    }

    return null
  }

	public imageForVersion(version): DockerImage {

		if (this._version == version) {

			return this

		} else {

			let found: DockerImage = null

			for (var i = 0; i < this.availableVersions.length; i++) {

				if (this.availableVersions[i]._version == version) {
					found = this.availableVersions[i]
					break
				}

			}

			if (found)
				return found
			else
				return this
		}

	}

	public copy(): DockerImage {

		return DockerImage.make(this)
	}

	public dedicatedRepository(): boolean {

		return this._dedicatedRepo
	}

	public setDedicatedRepository(dedicated: boolean) {

		if (this._dedicatedRepo && !dedicated) {
			// remove image name from repo

			let index: number = this._repository.indexOf(this._name)

			if (index != -1)
				this._repository = this._repository.substring(0, index-1)
		} else if (!this._dedicatedRepo && dedicated) {

			// add name to repo

			if (this._repository != null && this._name != null)
				this._repository = this._repository + "/" + this._name
		}

		this._dedicatedRepo = dedicated

		this._updateTag()
	}

	public repository(): string {

		return this._repository
	}

	public setRepository(repository: string) {

		this._repository = repository

		this._updateTag()
	}

	public name(): string {

		return this._name
	}

	public setName(newName: string) {

		this._name = newName

		this._updateTag()
	}

	public uniqueName(): string {

		if (this._repository && this._repository.endsWith(this._name)) {
			return this._repository
		} else if (this._repository) {

			if (this._dedicatedRepo)
				return this._repository + "/" + this.name
			else
				return this._repository + ":" + this._name

		} else {
			return this._name
		}
	}

	public version(): string {

		return this._version
	}

	public setVersion(newVersion: string) {

		this._version = newVersion

		this._updateTag()
	}

	public latestVersion(): DockerImage {

		if (this.availableVersions && this.availableVersions.length > 1)
			return this.availableVersions[0]
		else
			return this
	}

	public addVersion(img: DockerImage) {

		if (this.availableVersions.length > 0) {
			this._addVersion(img, this.availableVersions)
		}
		else {
			this.availableVersions.push(img)
		}
	}

	private _addVersion(img: DockerImage, versions: DockerImage[]) {

		for (var i = 0; i < versions.length; i++) {

			let version: string = versions[i].version();//this.latestVersion()

			if (!isNaN(+version)) {
			// simple increment

        if (!isNaN(+img.version())) {
          if (+img.version() > +version) {
					// add to top of of list
					  if (i > 0)
						  versions.splice(i-1, 0, img)
					  else
						  versions.unshift(img)

					  break
				  } else if (i == versions.length-1) {
				  // reached end, so just add it
					  versions.push(img)
					  break
				  }
        } else {
          if (this._compare(this.version(), img, i, versions)) {
            break
          }
        }
			} else if (i == versions.length-1) {
        // read end, so just add it

        versions.push(img)
        break

      } else if (version.match(/^\d{1,3}\.\d{1,3}(?:\.\d{1,6})?$/)) {

				if (this._compare(this.version(), img, i, versions)) {
				  break
        }
			}
		}
  }

    public hasVersionAlready(version: DockerImage): boolean {

        let found: boolean = false

        for (var i = 0; i < this.availableVersions.length; i++) {
            if (this.availableVersions[i].version() == version.version()) {
                found = true
                break
            }
        }

        return found
    }

	public getNextVersion(type: VersionType): string {

		let version: string = this._version;//this.latestVersion()

		if (type != VersionType.patch && !isNaN(+version)) {
			// simple increment

			if (type != VersionType.major) {
				version = "" + Math.round((Number(version) + .1) * 100)/100
			}
			else {
				version = "" + (Number(version) + 1)

				if (version.indexOf(".") == -1)
					version += ".0"
			}

		} else if (version.match(/^\d{1,3}\.\d{1,3}(?:\.\d{1,6})?$/)) {

			// have major and minor indicator

			var major, minor, patch
		    var versionArray = version.split('.')

		    major = parseInt(versionArray[0])
		    minor = parseInt(versionArray[1])
		    patch = parseInt(versionArray[2])

		    if (isNaN(major))
		      major = 0

		    if (isNaN(minor))
		      minor = 0

		    if (isNaN(patch))
		      patch = 0

		    if (type === VersionType.major) {
		        major = major + 1
		        minor = 0
		        patch = 0
		    }
		    else if (type === VersionType.minor) {
		        minor = minor + 1
		        patch = 0
		    }
		    else if (type === VersionType.patch) {
		        patch = patch + 1
		    }

		    version = major + '.' + minor + '.' + patch

		    if (type === null || type === undefined) {
		        version = '0.0.0'
		    }
		} else {
			version = "0.0.0"
		}

		return version
	}

	public exists(): boolean {

		let found: boolean = false

		if (this.id)
			return true
		else
			return false

		this.availableVersions.forEach((v) => {
			if (v.version === this.version)
				found = true
		})

		return found
	}

	public tag(): string {

		return this._tag
	}

	public static make(data: any): DockerImage {

		return DockerImage._make(new DockerImage(), data)
	}

	public static isVersionNumber(v: string): boolean {

		return v == 'latest' || v == 'lts'  || !isNaN(+v) || v.match(/^(v|V|)\d{1,3}(?:\.\d{1,6})(?:\.\d{1,6})(?:\.\d{1,6})?$/) != null || v.match(/^(v|V|)\d{1,3}(?:\_\d{1,6})(?:\_\d{1,6})(?:\_\d{1,6})?$/) != null
	}

	private _compare(version: string, img: DockerImage, i: number, versions: DockerImage[]): boolean {

	  var tmajor, tminor, tpatch
	  var versionArray = version.split('.')

	  tmajor = parseInt(versionArray[0])
	  tminor = parseInt(versionArray[1])
	  tpatch = parseInt(versionArray[2])

	  var xmajor, xminor, xpatch
	  var xversionArray = img.version().split('.')

	  xmajor = parseInt(xversionArray[0])
	  xminor = parseInt(xversionArray[1])
	  xpatch = parseInt(xversionArray[2])

	  if (tmajor > xmajor) {

	    if (i > 0) {
	      versions.splice(i, 0, img)
      } else  {
	      versions.push(img)
      }
	    return true

	  } else if (tmajor == xmajor && tminor > xminor) {

	    if (i > 0) {
	      versions.splice(i, 0, img)
      } else  {
	      versions.push(img)
      }

	    return true
	  } else if (tmajor == xmajor && tminor == xminor && tpatch >= xpatch) {

      if (i > 0) {
	      versions.splice(i, 0, img)
      } else  {
	      versions.push(img)
      }

	    return true
	  }

    return false
  }

	protected static _make(image: DockerImage, data: any): DockerImage {

		image.id = data.Id || data.id

		image._repository = data._repository

		image.osType = data.osType

		if (data.RepoTags) {
			image._tag = data.RepoTags[0]

			if (data.Labels) {
				image.description = data.Labels['DESCRIPTION']
				image.author = data.Labels['MAINTAINER']
				image.comments = data.Labels['COMMENT']
				image.type = data.Labels['TYPE']
				image.isCustom = data.Labels['CUSTOM'] == "true"

				if (data.Labels['TEST-STATUS']) {
					if (data.Labels['TEST-STATUS'] == "FAILED" || data.Labels['TEST-STATUS'] == "FAIL")
						image.testStatus = TestStatus.failed
					else if (data.Labels['TEST-STATUS'] == "COMPLETED")
						image.testStatus = TestStatus.passed
					else if (data.Labels['TEST-STATUS'] == "TODO")
						image.testStatus = TestStatus.todo
					else if (data.Labels['TEST-STATUS'] == "RUNNING")
						image.testStatus = TestStatus.running
				}
			}
		} else if (data._tag || data._name) {
			image._tag = data._tag || data._name
			image._name = data._name
			image._version = data._version
			image.type = data.type
			image.primaryPort = data.primaryPort

			image.description = data.description
			image.comments = data.comments
			image.buildTemplate = data.buildTemplate

			if(typeof(data.isCustom) === "boolean")
				image.isCustom = data.isCustom
			else
				image.isCustom = data.isCustom == "true" ? true : false

			if(typeof(data.isSagImage) === "boolean") {
				image.isSagImage = data.isSagImage
			}
			else {
				image.isSagImage = data.isSagImage == "true" ? true : false

				if (!image.isSagImage && image._tag) {
					image.isSagImage = image._tag && image._tag.indexOf("softwareag") != -1
				}
			}

			image.author = data.author

			if (data.testStatus) {
					if (data.testStatus == "FAILED" || data.testStatus == "FAIL")
						image.testStatus = TestStatus.failed
					else if (data.testStatus == "COMPLETED")
						image.testStatus = TestStatus.passed
					else if (data.testStatus == "TODO")
						image.testStatus = TestStatus.todo
					else if (data.testStatus == "RUNNING")
						image.testStatus = TestStatus.running
			}

			if (image._name == null && image._tag.indexOf(":") != -1) {

          let split: number = image._tag.indexOf(":")
          let before: string = image._tag.substring(0, split)
          let after: string = image._tag.substring(split+1)

          if (DockerImage.isVersionNumber(after)) {
            // value version

            image._dedicatedRepo = true
            image._name = before
            image._version = after

            // either no repository or dedicated repository where tag is only the version
            if (image._repository == null || image._name.indexOf(image._repository) != -1) {
              image._repository = image._name
            }

            // perhaps the repo is in the name part (check if we have a slash)

            if (image._name.lastIndexOf("/") != -1) {
              let split: number = image._name.lastIndexOf("/")
              //image._repository = image._name.substring(0, split)
              image._name = image._name.substring(split+1)
            }
          } else
          {
            // name is in tag part!!

            image._repository = before
            image._dedicatedRepo = false
            let split: number = after.lastIndexOf("-")

            if (split != -1 && DockerImage.isVersionNumber(after.substring(split+1))) {
              image._name = after.substring(0, split)
              image._version = after.substring(split+1)
            } else {
              image._name = after
            }
          }
        }
		} else {
			image._tag = "none"
		}

		if (data.CreatedDate)
			image.createdDate = new Date(data.createdDate)
		else
			image.createdDate = new Date(data.Created*1000);//moment(data.Created).toDate()

		if (data.Size)
			image.sizeGb = Math.round((+data.Size / 1073741824) * 100) / 100
		else
			image.sizeGb = data.sizeGb

		if (image.type == null && image._name != null) {
			// guess

			if (image._name.toLowerCase().indexOf("api") != -1 || image._name.toLowerCase().indexOf("microg") != -1)
				image.type = "API Gateway"
			else if (image._name.toLowerCase().indexOf("msc") != -1 || image._name.toLowerCase().indexOf("micros") != -1)
				image.type = "MicroService Runtime"
			else if (image._name.toLowerCase().indexOf("esb") != -1)
				image.type = "Service Engine"
			else if (image._name.toLowerCase().indexOf("bpm") != -1)
				image.type = "BPM Engine"
			else if (image._name.toLowerCase().indexOf("mws") != -1)
				image.type = "MyWebMethods"
			else if (image._name.toLowerCase().indexOf("opt") != -1)
				image.type = "Optimize Analytics"
		} else if (image.type == null) {
			image.type = "unknown"
		}

		if (image.author != null && image.author.indexOf("(") != -1) {
			image.author = image.author.substring(0, image.author.indexOf("("))
		}

		return image
	}

	private _setTag(tag: string) {

		this._tag = tag

		if (tag.indexOf(":") != -1) {

			let b4: string = tag.substring(0, tag.indexOf(":"))
			let af: string = tag.substring(tag.indexOf(":")+1)

			if (af.length > 0) {
				this._repository = b4
				this._setNameAndVersion(af, b4)
			} else {
				this._setNameAndVersion(tag)
			}
		} else {

			this._setNameAndVersion(tag)
		}
	}

	private _setNameAndVersion(name: string, repo?: string) {

		if (DockerImage.isVersionNumber(name)) {

			// have dedicated repo

			this._dedicatedRepo = true
			this._version = name

			if (repo.indexOf("/") != -1) {
				this._repository = repo.substring(0, repo.lastIndexOf("/"))
				this._name = repo.substring(repo.lastIndexOf("/")+1)
			}
		} else if (name.indexOf("-") != -1) {

		  // name is in tag

			this._dedicatedRepo = false

			// version might be in name

			let b4: string = name.substring(0, name.lastIndexOf("-"))
			let af: string = name.substring(name.lastIndexOf("-")+1)

			if (af.endsWith(".d") || DockerImage.isVersionNumber(af)) {
				this._version = af
				this._name = b4
			} else {
				this._name = name
			}

		} else {

			this._dedicatedRepo = false
			this._name = name
		}
	}

	private _updateTag() {

		if (this._dedicatedRepo || this._repository) {

			if (this._version) {
        this._tag = this._repository + ":" + this._name + "-" + this._version
      } else {
        this._tag = this._repository + ":" + this._name
      }
		} else if (this._version) {
        	this._tag = this._name + ":" + this._version
		} else {
		  this._tag = this._name
		}
	}
}
