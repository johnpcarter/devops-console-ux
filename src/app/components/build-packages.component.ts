import { Component, OnInit, ViewChild }   from '@angular/core'
import { SelectionModel } 							  from '@angular/cdk/collections'
import { FormBuilder, FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute }                 from '@angular/router'

import { MatTable } 					 			      from '@angular/material/table'
import {RepoSettings, Settings, Values} from '../settings'

import { ConfigurationService } 			 		from '../services/configuration.service'
import { PackagesService } 						 	  from '../services/packages.service'
import { DeploymentSet }							    from '../models/project'
import { Source } 									      from '../models/git-source'
import { WmPackageInfo, APIDefinition }	  from '../models/wm-package-info'

import { SourceWrapper }						 	     from './elements/git-sources.component'
import {GitRepo, GitSourceService} from '../services/git-source-control.service'
import {Observable, of }                   from 'rxjs'
import { startWith, map }                  from 'rxjs/operators'

@Component({
  selector: 'build-package',
  templateUrl: '../templates/build-packages.html',
  styleUrls: ['../templates/build-packages.css']
})

export class BuildPackagesComponent implements OnInit {

	public deploymentSets: string[] = []
	public dependencyDisplayedColumns: string[] = ['select', 'package', 'description', 'tests']
	public apiReadOnlyDisplayedColumns: string[] = ['name', 'package', 'swagger', 'description']

	public dependencies: WmPackageInfo[]
	public selectedDependencies: SelectionModel<WmPackageInfo> = new SelectionModel<WmPackageInfo>(true, [])

	public indexing: boolean = true
  public apiEnabled: boolean = true

	public deploymentSet: DeploymentSet

	public gitURI: string
	public gits: string[]
	public repositories: RepoSettings[]

	public selectedGit: string
	public selectedRepo: string

	public repoNameCtrlIsDisabled: boolean = false

	@ViewChild("dependentsTable")
	public dependentsTable: MatTable<any>

	@ViewChild("readonlyAPIs")
	public deploymentSetAPIsTable: MatTable<APIDefinition>

	public form: FormGroup
	public deploymentNameCtrl: FormControl
  public repoNameCtrl: FormControl

	public values: Values

	public filteredSets: Observable<string[]>

	private _selectedGit: GitRepo
	private _gitSelectionModel: SelectionModel<any>
  private _freshReload = false

	public constructor(private _activatedRoute: ActivatedRoute, private _formBuilder: FormBuilder, private  _settings: Settings, private _configService: ConfigurationService, private _gitService: GitSourceService, private _packagesService: PackagesService) {

		this._settings.values().subscribe((v) => {

			this.values = v

			this.gitURI = v.gitUri
      this.gits = [v.gitName]
      this.selectedGit = this.gits[0]

      this.repositories = v.gitRepos

			this._configService.deploymentSets().subscribe((r) => {

				this.deploymentSets = r
				this.indexing = false

				this.filteredSets = of(this.deploymentSets)

				this.filteredSets = this.deploymentNameCtrl.valueChanges
        .pipe(
        startWith(''),
        map(value => this._filter(value)))
			})

			this._settings.setCurrentPage("package")
		})
	}

	public ngOnInit() {

	    this.deploymentNameCtrl = new FormControl()
      this.repoNameCtrl = new FormControl()

	    this.form = this._formBuilder.group({
        deploymentNameCtrl: this.deploymentNameCtrl,
        repoNameCtrl: this.repoNameCtrl
	    })

	    this.clear()

	    this._activatedRoute.paramMap.subscribe(params => {
        this.deploymentNameCtrl.setValue(params.get('id'))
        this.loadDeploymentSet(this.deploymentNameCtrl.value)
      })
	}

	private _filter(value: string): string[] {
      const filterValue = value.toLowerCase()
      return this.deploymentSets.filter(option => filterValue.length == 0 || option.toLowerCase().includes(filterValue))
	}

	public nameDidChange(event: any) {

		if (event.target.value && (!this.deploymentSet || this.deploymentSet.name != event.target.value)) {

			this.clear()
			this.deploymentSet.name = event.target.value

			if (this._isExistingDeploymentSet(this.deploymentSet.name))
				this.loadDeploymentSet(this.deploymentSet.name)

		} else if (!event.target.value && this.deploymentSet.name) {
		   this.clear()
    }
	}

	public repoDidChange(event: any) {

  }

	public deploymentSetChanged(event: any) {

		if (event.option.value && (!this.deploymentSet || this.deploymentSet.name != event.option.value)) {

			this.clear()
			this.deploymentSet.name = event.option.value

			this.loadDeploymentSet(this.deploymentSet.name)
		}
	}

	public addDeploymentSet(event) {

		event.target.label = "Adding"
		event.target.disabled = true

		this.deploymentSet = this.makeDeploymentSet(this.deploymentSet.name)

		this.saveDeploymentSet(true)
	}

	public deleteDeploymentSet(event) {

		this._configService.deleteDeploymentSet(this.deploymentSet.name).subscribe( result => {

		    this.deploymentSets.splice(this.indexOfTemplate(this.deploymentSet.name), 1)
        this.deploymentNameCtrl.setValue("", {onlySelf: true, emitEvent: false})
        this.deploymentSet = null
    })
	}

	public deploymentSetNotConfigured() {

		return this.deploymentSet && this.deploymentSet.name != null && (this.deploymentSet.source == null || this.deploymentSet.source.include.length == 0)
	}

	public isExistingDeploymentSet(): boolean {

		return this.deploymentSet && this._isExistingDeploymentSet(this.deploymentSet.name)
	}

	public _isExistingDeploymentSet(name: string): boolean {

		if (this.deploymentSet.name) {

			var found = false

			for (var i=0;i<this.deploymentSets.length;i++) {

				if (this.deploymentSets[i] == name)
				{
					found = true
					break
				}
			}

			return found
		} else {
			return false
		}
	}

	public selectedRepoName(): string {

	  if (this.deploymentSet)
      return this.deploymentSet.source.gitRepository
	  else
	    return this.repoNameCtrl.value
	}

	public deploymentSetPackages(): string[] {

		if (this.deploymentSet && this.deploymentSet.source.include != null && this.deploymentSet.source.include.length > 0)
			return this.deploymentSet.source.include
		else
			return null
	}

	public deploymentSetExcludedPackages(): string[] {

		if (this.deploymentSet && this.deploymentSet.source && this.deploymentSet.source.exclude && this.deploymentSet.source.exclude.length > 0)
			return this.deploymentSet.source.exclude
		else
			return null
	}

	public deploymentSetAPIs(): APIDefinition[] {

		if (this.deploymentSet && this.deploymentSet.apis && this.deploymentSet.apis.length > 0) {

			return this.deploymentSet.apis

		} else {
			return null
		}
	}

	/** Whether the number of selected elements matches the total number of rows. */
  	public isAllDependenciesSelected() {
    	const numSelected = this.selectedDependencies.selected.length
    	const numRows = this.dependencies.length

    	return numSelected === numRows
  	}

  	public selectDependencyRow(row) {

  		this.selectedDependencies.toggle(row)

  		this.dependenciesSelectionChanged()
  	}

  /** Selects all rows if they are not all selected; otherwise clear selectedDependencies. */
	public masterDependenciesToggle() {

	    this.isAllDependenciesSelected() ?
	        this.selectedDependencies.clear() :
	        this.dependencies.forEach(row => this.selectedDependencies.select(row))

	    this.dependenciesSelectionChanged()
	}

	private dependenciesSelectionChanged() {

		this.selectedDependencies.selected.forEach((p) => {

			this.deploymentSet.source.include.push(p.name)
		})
	}

	public gitAPIActivated(active: boolean) {
	  this.apiEnabled = active
  }

	public selectedGitRepoChanged(repo: GitRepo) {

		if (!this.deploymentSet || this._selectedGit != repo) {

		  this._selectedGit = repo

			if (this.deploymentSet && this.deploymentSet.source.gitRepository != this._selectedGit.name)
			  this.deploymentSet = this.makeDeploymentSet(this.deploymentSet.name, this.deploymentSet.source)
		}
	}

	public selectedSourcesDidLoad(sourceWrapper: SourceWrapper) {

		this._gitSelectionModel = sourceWrapper.model
	}

	public selectedSourcesDidChange(sourceWrapper: SourceWrapper) {

	  this._freshReload = false

		this.deploymentSet.source = sourceWrapper.source
		this._gitSelectionModel = sourceWrapper.model

		if (this.deploymentSet.name)
			this.checkDependencies()
	}

	public haveDependencies(): boolean {

		return this.dependencies && this.dependencies.length > 0
	}

	public haveSelectedSomeDependents(): boolean {

		return (this.selectedDependencies.selected.length > 0)
	}

	public addSelectedDependentsToSource() {

		var p: WmPackageInfo = null

		while(p=this.selectedDependencies.selected.pop()) {

			this.removeDependency(p)
			this._gitSelectionModel.select(p.name)
		}

		this.checkDependencies()
		this.dependentsTable.renderRows()
	}

	public addSelectedDependentsToIgnore() {

		let p: WmPackageInfo = null

		while(p=this.selectedDependencies.selected.pop()) {

			this.removeDependency(p)
			this.deploymentSet.source.exclude.push(p.name)
		}

		this.saveDeploymentSet(false)
	}

	public whichTabToShow() {

	  if (this._freshReload && this.deploymentSet && this.deploymentSet.source.include.length > 0)
	    return 0
	  else
	    return 1
  }

  public reindexDeploymentSet(event) {

		event.target.disabled = true
		this.indexOnServer(true, event.target)
	}

	private removeDependency(o: any): WmPackageInfo {

		let p: WmPackageInfo = null

		for (let i = 0; i < this.dependencies.length; i++) {
			if (this.dependencies[i].name == o.name) {
				p = this.dependencies.splice(i, 1)[0]
				break
			}
		}

		this.selectedDependencies.deselect(o)
		return p
	}

	private loadDeploymentSet(name: string) {

	  let gitURI: string = this.deploymentSet.source.gitURI

		this._configService.deploymentSet(name).subscribe((d) => {

		  this._freshReload = true
			this.deploymentSet = d
			this.repoNameCtrl.setValue(d.source.gitRepository, {onlySelf: true, emitEvent: false})
      this.repoNameCtrlIsDisabled = true

		  //this.deploymentSet.source.gitURI = gitURI

      // update deployment set to reference current git info

      this._settings.values().subscribe( v => {

        if (!v.gitUser && !v.gitName) {

          // git is not setup, don't do now't

          window.alert("Warning - You haven't setup you git preferences!!")

        } else {

          this.deploymentSet.source.gitURI = v.gitUri

          if (!this.deploymentSet.source.gitURI.endsWith("/"))
				    this.deploymentSet.source.gitURI = this.deploymentSet.source.gitURI + "/"

			    if (v.gitName)
				    this.deploymentSet.source.gitURI += [ v.gitName ]
			    else
				    this.deploymentSet.source.gitURI += [ v.gitUser ]

			    this.deploymentSet.source.gitURI += "/" + d.source.gitRepository + ".git"

          this.saveDeploymentSet(true)
        }
        //this.indexOnServer(false)
      })

      this.deploymentNameCtrl.setValue(d.name, {onlySelf: true, emitEvent: false})
		})
	}

	private selectPackagesForCurrentDeploymentSet() {

		if (this.deploymentSet.source && this.deploymentSet.source.include) {

			if (this._gitSelectionModel) {
				this.deploymentSet.source.include.forEach((r) => {
					this._gitSelectionModel.select(r)
				})
			}

			this.checkDependencies()
		}
	}

	private saveDeploymentSet(indexOnCompletion: boolean) {

		this._configService.uploadDeploymentSet(this.deploymentSet).subscribe((d) => {

			if (indexOnCompletion)
				this.indexOnServer(false)

			if (!this.isExistingDeploymentSet())
				this.deploymentSets.push(this.deploymentSet.name)
		})
	}

	private indexOnServer(reindex: boolean, button?: any) {

		this.indexing = true

		this._packagesService.index(this.deploymentSet.name, this._selectedGit.config.packages, this.deploymentSet.source, reindex).subscribe((packages) => {

			this.indexing = false

			if (button)
			  button.disabled = false

			if (this.deploymentSet.source.include.length > 0)
				this.checkDependencies()
			  this.selectPackagesForCurrentDeploymentSet()
		}, error => {
		  this.indexing = false
    })
	}

	private checkDependencies() {

		let l: string[] = this.convertToStringList(this.deploymentSet.source)

		if (l.length > 0) {

		  let dir: string = this.deploymentSet.source.gitRepository

		  if (this._selectedGit.config.packages.startsWith("/"))
        dir += this._selectedGit.config.packages
		  else
		    dir += "/" + this._selectedGit.config.packages

			this._packagesService.checkDependenciesForPackages(l, dir).subscribe((r) => {

				this.dependencies = r.dependencies

				this.rebuildAPIList(r.packages)

				if (this.deploymentSetAPIsTable)
					this.deploymentSetAPIsTable.renderRows()
			})

			this.saveDeploymentSet(false)

		} else {
			this.dependencies = []
		}
	}

	private rebuildAPIList(packages: WmPackageInfo[]) {

		this.deploymentSet.apis = []

		packages.forEach((p) => {

			if (p.apis) {
				p.apis.forEach((a) => {
					if (this.notInAPIList(a)) {
						this.deploymentSet.apis.push(a)
					}
				})
			}
		})
	}

	private notInAPIList(a: APIDefinition): boolean {

		if (!this.deploymentSet.apis || this.deploymentSet.apis.length == 0)
			return true

		var notFound: boolean = true

		for (var i=0; i < this.deploymentSet.apis.length; i++) {

			if (this.deploymentSet.apis[i].name == a.name) {
				notFound = false
				break
			}
		}

		return notFound
	}

	private clear() {

	  this.repoNameCtrlIsDisabled = false
		this.deploymentSet = this.makeDeploymentSet()
		if (this._gitSelectionModel) {
			this._gitSelectionModel.clear()
		}
	}

	private convertToStringList(source: Source): string[] {

		var out: string[] = []
		source.include.forEach((p) => {
				out.push(p)
		})

		return out
	}

	private makeDeploymentSet(name?: string, sources?: Source): DeploymentSet {

		let deploymentSet: DeploymentSet = new DeploymentSet()
		deploymentSet.name = name ? name : null
		let s: Source = sources || new Source()
		s.type = "package"

		let values = this._settings.values().subscribe((v) => {

			if (!v.gitUri.endsWith("/"))
				v.gitUri = v.gitUri + "/"

			s.gitURI = v.gitUri + v.gitUser + "/" + this._selectedGit.name + ".git"

			s.gitUser = v.gitUser
			s.gitPassword = v.gitPassword
			s.gitRepository = this._selectedGit.id
		})

		deploymentSet.source = s

		return deploymentSet
	}

	private indexOfTemplate(name): number {

      if (!name || !this.deploymentSets)
        return -1

      var found: number = -1

      for (var i=0; i < this.deploymentSets.length; i++) {

        if (this.deploymentSets[i] == name) {
          found = i
          break
        }
      }

      return found
  }
}
