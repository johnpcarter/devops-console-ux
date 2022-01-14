import { Component, ChangeDetectorRef, Input, Output, EventEmitter,
			OnInit, OnChanges, OnDestroy, ViewChild }   	        from '@angular/core'
import { SelectionModel } 						                      from '@angular/cdk/collections'

import { FormBuilder, FormGroup, FormControl } 	            from '@angular/forms'

import {MatPaginator, PageEvent} from '@angular/material/paginator';
import { MatTableDataSource } 					                    from '@angular/material/table'

import { BuilderProperties, PropertiesChangedOwner }	      from './build-image-choose.directive'
import { GitSourceService, GitRepo }				                from '../../services/git-source-control.service'
import { WmPackageInfo }						                        from '../../models/wm-package-info'
import {Repository, Source} from '../../models/git-source';

import { Settings, RepoSettings }                           from '../../settings'
import {PackagesService }                                   from '../../services/packages.service'

export class SourceWrapper {
	public source: Source
	public model: SelectionModel<WmPackageInfo>
}

export class GitSelectionModel extends SelectionModel<WmPackageInfo> {

	private _data: WmPackageInfo[]

	public constructor() {
		super(true, [])
	}

	public setSourceModel(packages: WmPackageInfo[]) {
		this._data = packages
	}

	public select(row: any) {

		if (row instanceof WmPackageInfo) {

			super.select(<WmPackageInfo> row)
		} else if (this._data) {

			for (var i = 0; i < this._data.length; i++) {
				if (this._data[i].name == row) {
					super.select(this._data[i])
					break
				}
			}
		}
	}
}

@Component({
  selector: 'git-source',
  templateUrl: '../../templates/elements/git-sources.html'
})

export class GitSourcesComponent implements OnInit, OnChanges //, BuilderComponent
{
	@Input()
	public selectedRepoName: string

	@Input()
	public selected: string[]

	@Input()
	public showSource: boolean

	@Input()
  	public disabled: boolean

	@Input()
	public pageSize: number

	@Input()
	public
	@Output()
	public selectedGitRepoChanged: EventEmitter<GitRepo> = new EventEmitter()

	@Output()
	public selectedSourcesChanged: EventEmitter<SourceWrapper> = new EventEmitter()

	@Output()
	public selectedSourcesLoaded: EventEmitter<SourceWrapper> = new EventEmitter()

	@Output()
  	public apiActivated: EventEmitter<boolean> = new EventEmitter()

	public formGroup: FormGroup
	public packageTableDataSource: MatTableDataSource<WmPackageInfo>
	public owner: PropertiesChangedOwner

	public gitURI: string
	public gits: string[]
	public repositories: GitRepo[]

  	public selectedRepo: GitRepo
  	public selectedGit: string

	public displayedColumns: string[] = ['select', 'package', 'version', 'description']
	public selectionModel: GitSelectionModel = new GitSelectionModel()

	public manualSyncRequired: boolean
	@ViewChild('gitPaginator')
	public gitPaginator: MatPaginator

	public isBusy: boolean

  	private _configuredGitRepos: RepoSettings[] = []
	private _source: Source

	private _gitAPIUrl: string
  	private _gitUser: string
  	private _gitToken: string
	pageEvent: PageEvent

	constructor(private _settings: Settings, private _gitService: GitSourceService, private _packagesService: PackagesService) {
	}

	public ngOnInit() {

	  this._gitService.values().subscribe((v) => {

	    this.gitURI = v.gitUri

			if (!this.gitURI.endsWith("/"))
				this.gitURI = this.gitURI + "/"

			if (v.gitName)
				this.gits = [ v.gitName ]
			else
				this.gits = [ v.gitUser ]

			this._gitAPIUrl = v.gitAPIUrl
			this._gitUser = v.gitUser
			this._gitToken = v.gitPassword

			this.selectedGit = this.gits[0]

			v.gitRepos.forEach((r) => {
			  this._configuredGitRepos.push(r)
			})

			this.fetchRepositories()
		})
	}

	public ngOnChanges() {

	  this.setCurrentRepoFromInput()
	  this.onGitChange()
	}

	public onGitChange(event?: any) {

	  if (this._gitAPIUrl && (!this._source || this.selectedRepo.id != this._source.repositories[0].name)) {
	     this.setCurrentRepo(this.selectedRepo)
    }
	}

	public resyncGitRepo() {
    this.isBusy = true
	  this.fetchPackageContents(true)
  }

	public packagesDir(): string {

	  if (this.selectedRepo) {
	   let gitRepo: RepoSettings = this.configForRepo(this.selectedRepo.name)

	   if (gitRepo.packages.startsWith("/"))
	    return gitRepo.packages
	   else
	    return "/" + gitRepo.packages
    }
	}

  /** Whether the number of selected elements matches the total number of rows. */
  	public isAllSelected() {
    	const numSelected = this.selectionModel.selected.length
    	const numRows = this.packageTableDataSource.data.length

    	return numSelected === numRows
  	}

  	public selectRow(row) {

  		this.selectionModel.toggle(row)

  		this.firePropertiesChanged()
  	}

  /** Selects all rows if they are not all selected; otherwise clear selectionModel. */
	public masterToggle() {

	    this.isAllSelected() ?
	        this.selectionModel.clear() :
	        this.packageTableDataSource.data.forEach(row => this.selectionModel.select(row))

	    this.firePropertiesChanged()
	}

	private fetchRepositories() {

	  this.isBusy = true

		this._gitService.repositories(this.selectedGit).subscribe((r) => {
			this.repositories = r

			if (this.repositories.length > 0 && !this.selectedRepo) {
        let repo: GitRepo = this.repoForId(this._configuredGitRepos[0].name)

			  if (repo)
			    this.setCurrentRepo(repo)
			  else
			    this.setCurrentRepo(this.repositories[0])
      }
			this.isBusy = false
		}, error => {
			this._settings.values().subscribe((v) => {

				this.repositories = []
				v.gitRepos.forEach((g) => {
					this.repositories.push(new GitRepo(g.name, g.name, "", "main"))
				})

				if (this.repositories.length > 0 && !this.selectedRepoName)
				  this.setCurrentRepo(this.repositories[0])
        else
          this.setCurrentRepoFromInput()

				this.isBusy = false
			})
		})
	}

	private setCurrentRepoFromInput() {

	  if (this.selectedRepoName && (!this.selectedRepo || this.selectedRepoName != this.selectedRepo.id)) {
	    let found: GitRepo = null

      if (this.repositories) {
        for (let i = 0; i < this.repositories.length; i++) {
          if (this.repositories[i].id == this.selectedRepoName) {
            found = this.repositories[i]
            break
          }
        }

        if (found) {
          this.setCurrentRepo(found)
        }
      }
    }
  }

	private setCurrentRepo(git: GitRepo) {

    this.selectedRepo = git

    let repoConfig: RepoSettings = this.configForRepo(git.name)
    git.config = repoConfig

    this._source = new Source()
    this._source.gitURI = this.gitURI + this.selectedGit + "/" + repoConfig.name + ".git"
    this._source.gitUser = this._gitUser
    this._source.gitPassword = this._gitToken

    this._source.repositories = [];
    this._source.repositories.push(new Repository(this.selectedRepo.name))
    this.fetchPackageContents(false)

    this.selectedGitRepoChanged.emit(git)
	}

	private repoForId(id: string): GitRepo {

	  let found: GitRepo = null

	  for (let i = 0; i < this.repositories.length; i++) {
	    if (this.repositories[i].id == id) {
	      found = this.repositories[i]
	      break
      }
    }
	  return found
  }

	private configForRepo(name: string): RepoSettings {

	  let found: RepoSettings = null

	  for (let i = 0; i < this._configuredGitRepos.length; i++) {
	    if (this._configuredGitRepos[i].name == name) {
	      found = this._configuredGitRepos[i]
	      break
      }
    }

	  if (found == null) {
	    found = new RepoSettings(name, "/packages", "/config")
    }

	  return found
  }

	private fetchPackageContents(resync: boolean) {

		if (this.selectedRepo) {

		  this.isBusy = true

			this._gitService.wmPackages(this.selectedGit, this.selectedRepo.id, this.configForRepo(this.selectedRepo.name).packages, !resync).subscribe((packages) => {

				 this._setModel(packages)
				 this.apiActivated.emit(true)
          this.isBusy = false
			}, error => {

			  // okay, api failed, so lets try cloning data on server side and then return the packages from there
        // less efficient but bette than nothing.

        console.log("git request failed, let trying indexing via clone on server and get packages back from that")

        this._packagesService.index(this.selectedRepo.name, this._source, resync).subscribe((p) => {

          this.manualSyncRequired = true
          this.selectedRepoName = this._source.repositories[0].name
          this._setModel(p)

          this.isBusy = false

          this.apiActivated.emit(false)
        }, error => {
          // bugger even that failed.

          this.isBusy = false

          if (error.status == 404) {
					  window.alert("Error 404 - git request failed, this might be either because you have specified invalid user credentials, or the packages path is not valid. Please revisit your git preferences")
				  } else {
					  window.alert("Error " + error.status + ", git request failed with error " + error.message)
				  }
        })
			})
		}
	}

	private _setModel(packages: WmPackageInfo[]) {

	  let cp = [...packages] // If I don't do this, the paginator starts removing elements from the list when using it!

	  this.packageTableDataSource = new MatTableDataSource(cp)
	  this.packageTableDataSource.paginator = this.gitPaginator
	  this.selectionModel.setSourceModel(cp)
	  this.setInitialSelection()
	  this.selectedSourcesLoaded.emit({source:this._source, model: this.selectionModel})
  }

	private setInitialSelection() {

		if (this.selected) {

			this.selectionModel.clear()

			this.selected.forEach((s) => {

				for(var i = 0; i < this.packageTableDataSource.data.length; i++) {
					if (this.packageTableDataSource.data[i].name == s) {
						this.selectionModel.select(this.packageTableDataSource.data[i])
					}
				}
			})
		}
	}

	private firePropertiesChanged() {

    let props: Map<string, BuilderProperties[]> = new Map()
    this._source.repositories[0].include = []
		this.selectionModel.selected.forEach((p) => {

      let l: BuilderProperties[] = []

			//l.push(new BuilderProperties("name", p.name))
			l.push(new BuilderProperties("Type", ["service"]))
			l.push(new BuilderProperties("Version", ["" + p.version]))
			l.push(new BuilderProperties("Description", [p.description]))

			props.set(p.name, l)
			this._source.repositories[0].include.push(p.name)
		})

		if (this.owner)
			this.owner.propertiesChangedInBuilder("msc", props, this._source)
		else
			this.selectedSourcesChanged.emit({source:this._source, model: this.selectionModel})
	}
}
