import { Injectable } 	           	 	  from '@angular/core'
import { HttpClient, HttpHeaders }      from '@angular/common/http'
import { Observable, of }               from 'rxjs'
import { map, catchError } 	from 'rxjs/operators'

import {GitType, Settings, Values,
                    RepoSettings }      from '../settings'
import { WmPackageInfo }				from '../models/wm-package-info'

import * as moment from 'moment'
import {flatMap} from 'rxjs/internal/operators';

export class GitRepo {

  public config: RepoSettings

	constructor(public id: string, public name?: string, public description?: string, public defaultBranch?: string) {

	  if (this.name == null) {
		  this.name = this.id
	  }
	}
}
export enum FileStatus {

	added,
	removed,
	changed
}

export class FileInfo {

	public status: FileStatus

	public constructor(public fileName: string, status: string) {

		if (status == 'removed')
			this.status = FileStatus.removed
		else if (status == 'added')
			this.status = FileStatus.added
		else
			this.status = FileStatus.changed
	}
}

export class CommitInfo {

	public sha: string
	public committer: string
	public message: string
	public count: number
	public date: Date

	public files: FileInfo[] = []

	constructor() {

	}

	public static make(data: any, count: number): CommitInfo {

		let c: CommitInfo = new CommitInfo()
		c.sha = data.sha
		c.count = count
		c.committer = data.commit.committer.name
		c.date = moment(data.commit.committer.date).toDate()
		c.message = data.commit.message

		if (data.files) {

			data.files.forEach((f) => {
				c.files.push(new FileInfo(f.filename, f.status))
			})
		}

		return c
	}
}

@Injectable()
export class GitSourceService {

  public static GITHUB_REPOS: string = "/user/repos"
	public static GITHUB_CONTENTS: string = "/repos/OWNER/REPO/contents/PATH"

	public static GITLAB_REPOS: string = "/api/v4/projects?owned=true&private_token=TOKEN"
	public static GITLAB_CONTENTS: string = "/api/v4/projects/REPO/repository/tree?path=PATH&private_token=TOKEN"
	public static GITLAB_FILE: string = "/api/v4/projects/REPO/repository/files/PATH?ref=master&private_token=TOKEN"

	public _commitInfo: CommitInfo[]

	private _values: Values
	private _gitType: GitType
	private _gitAPIUrl: string
	private _gitName: string
	private _gitUser: string
	private _gitPassword: string
	private _gitIsPACPassword: string


    constructor(private _settings: Settings, private _http: HttpClient) {

    	this._settings.values().subscribe((v) => {

    	  	this.setup(v)
    	})
    }

    public values(): Observable<Values> {

      if (this._values) {
        return of(this._values)
      } else {
        return this._settings.values()
      }
    }

    public repositories(git: string, v?: Values) {

    	let all: string
    	let template: string

    	let headers = new HttpHeaders()
				.append('Content-Type', 'application/json')
				.append('Accept', 'application/json')

		if (this._gitType == null && v != null) {
			this.setup(v)
		}

    	if (this._gitType == GitType.github) {

    		all = this._gitAPIUrl + GitSourceService.GITHUB_REPOS.replace(/OWNER/, this._gitUser)

    		headers = headers.append('Authorization', `Basic ${btoa(this.authString())}`)
    	}
    	else {
    		all = this._gitAPIUrl + GitSourceService.GITLAB_REPOS.replace(/TOKEN/, this._gitPassword)
    	}

		  console.log("Querying git for repos with url " + all)

		  return this._http.get(all, { headers }).pipe(map( (responseData) => {
            return this._mapRepoResponse(this._gitAPIUrl, responseData)
        }))
    }

    public wmPackages(git: string, repo: string, dir: string, useCache?: boolean): Observable<WmPackageInfo[]> {

		let template: string

		let headers = new HttpHeaders()
					.append('Content-Type', 'application/json')
					.append('Accept', 'application/json')

		if (this._gitType == GitType.github) {
        	template = GitSourceService.GITHUB_CONTENTS
        	headers = headers.append('Authorization', `Basic ${btoa(this.authString())}`)

		} else {
    	  	template = GitSourceService.GITLAB_CONTENTS
		}

		if (dir.startsWith("/")) {
      		dir = dir.substring(1)
    	}

		let url: string = this._gitAPIUrl + template
      		.replace(/OWNER/, git || this._gitUser)
      		.replace(/REPO/, repo)
      		.replace(/PATH/, dir)
      		.replace(/TOKEN/, this._gitPassword)

      	console.log("Querying git for packages with url " + url)

		return this._http.get(url, { headers }).pipe(map( (responseData) => {
			return this._mapPackagesResponse(dir, responseData, repo)
		}))
    }

    public gitInfo(path: string, repo: string): Observable<any> {

		let template: string

		let headers = new HttpHeaders()
				.append('Content-Type', 'application/json')
				.append('Accept', 'application/json')

		if (this._gitType == GitType.github) {

			template = GitSourceService.GITHUB_CONTENTS
							.replace(/OWNER/, this._gitName || this._gitUser)
							.replace(/REPO/, repo)
							.replace(/PATH/, path)

			headers = headers.append('Authorization', `Basic ${btoa(this.authString())}`)

		} else {
			template = GitSourceService.GITLAB_FILE
							  .replace(/REPO/, repo)
							  .replace(/PATH/, path)
                .replace(/TOKEN/, this._gitPassword)
		}

		let url: string = this._gitAPIUrl + template

		return this._http.get(url, { headers }).pipe(map( (responseData) => {

            return (<any> responseData)

          },
          error => {
            return null
		}))
    }

    private _mapPackagesResponse(dir: string, responseData: any, repo: string): WmPackageInfo[] {
 // data is returned as list called references or as a single entity

 		let images: WmPackageInfo[] = []

 		for (let i=0; i < responseData.length; i++) {

 		  if (responseData[i].name) {
 		    let p: WmPackageInfo = WmPackageInfo.make(responseData[i])
			  this.packageDetails(p, dir, repo).subscribe(success => {

				  if (!success)
					  images.splice(i, 1)
			  })

			  images.push(p)
      }
		}

 		return images
    }

	private packageDetails(packageInfo: WmPackageInfo, dir: string, repo: string): Observable<boolean> {

		return this.gitInfo(dir + '/' + packageInfo.name, repo).pipe(flatMap((ref) => {

			if (ref.type === 'submodule') {
				return this._packageDetails(packageInfo, "manifest.v3", packageInfo.name)
			} else {

				let path: string

				if (dir && dir != ".")
					path = dir + (dir.endsWith("/") ? "" : "/") + packageInfo.name + "/manifest.v3"
				else
					path = packageInfo.name + "/manifest.v3"

				return this._packageDetails(packageInfo, path, repo)
			}
		}), catchError((err) => {
			return of(false)
		}))
	}

    private _packageDetails(pckg: WmPackageInfo, path: string, repo: string): Observable<boolean> {

    	return this.gitInfo(path, repo).pipe(map((ref) => {

			const c = ref.content

    		let xmlString: string = atob(c)
    		let xml = new DOMParser().parseFromString(xmlString, 'text/xml')

    		var top = xml.getElementsByTagName('Values')

			  for(var i=0;i<top.length;i++){

				  var values = top[i].getElementsByTagName('value')

				  for (let z = 0; z < values.length; z++) {
					let name: string = values[z].getAttribute('name')
					let value: string = values[z].innerHTML

					if (name == 'version') {
						pckg.version = value

						if (pckg.version === '' || pckg.version === null) {
							pckg.version = "n/a"
						}
					} else if (name == 'build') {
						pckg.build = +value

						if (pckg.build === NaN) {
							pckg.build = 0
						}
					} else if (name == 'description') {
						pckg.description = value
					}
				}

				var records = top[i].getElementsByTagName('record')
				for (let z = 0; z < records.length; z++) {
					let name: string = records[z].getAttribute('name')
					let value = records[z].getElementsByTagName('value')

					if (name === 'requires') {

						pckg.requires = []

						for (let y = 0; y < value.length; y++) {
							let p = new WmPackageInfo(value[y].getAttribute('name'))
							p.version = value[y].innerHTML
							pckg.requires.push(p)
						}
					} else if (name === 'startup_services') {

					} else if (name === 'shutdown_services') {

					}
				}
			  }

    		return true
    	}), catchError((err) => {
    		return of(false)
    	}))
    }

    private _mapRepoResponse(url: string, responseData: any): GitRepo[] {

    	let names: GitRepo[] = []

    	responseData.forEach((r) => {
    		names.push(new GitRepo(this._gitType == GitType.github ? r.name : r.id, r.name, r.description, r.default_branch))
    	})

    	return names.sort((a,b)=> {

    	  let a1 = a.name.toLowerCase()
    	  let b1 = b.name.toLowerCase()

    	  if (a1 == b1)
    	    return 0
    	  else if (a1>b1)
    	    return 1
    	  else
    	    return -1
      })
    }

    private authString(): string {

    	if (this._gitIsPACPassword)
    		return this._gitPassword
    	else
    		return this._gitUser + ":" + this._gitPassword
    }

	private setup(v: Values) {

		this._values = v
		this._gitType = v.gitType
		this._gitAPIUrl  = v.gitAPIUrl
		this._gitName = v.gitName
		this._gitUser = v.gitUser
		this._gitPassword = v.gitPassword
		this._gitIsPACPassword = v.gitIsPACPassword

		if (this._gitAPIUrl.endsWith("/"))
			this._gitAPIUrl = this._gitAPIUrl.substring(0, this._gitAPIUrl.length-1)
	}
}
