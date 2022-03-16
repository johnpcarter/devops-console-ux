import { Component, OnInit, ViewChild }   				from '@angular/core'
import { SelectionModel } 							  	from '@angular/cdk/collections'
import { FormBuilder, FormControl, FormGroup } 			from '@angular/forms'
import { ActivatedRoute }                 				from '@angular/router'

import { Observable, of }                   			from 'rxjs'
import { startWith, map }                  				from 'rxjs/operators'

import { MatTable, MatTableDataSource } 				from '@angular/material/table'
import { MatDialog } 									from '@angular/material/dialog'
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar'

import { Repository, Source}               				from '../models/git-source'
import { WmPackageInfo, APIDefinition }	  				from '../models/wm-package-info'
import { DeploymentSet } 								from '../models/build'

import { ConfigurationService } 			 			from '../services/configuration.service'
import { PackagesService } 						 	  	from '../services/packages.service'
import { GitSourceService } 							from '../services/git-source-control.service'

import { GitPackageChooserComponent } 					from './elements/git-package-chooser.component'

import { RepoSettings, Settings, Values } 				from '../settings'
import {Property, PropertyValueType} from '../models/properties';

@Component({
  selector: 'build-package',
  templateUrl: '../templates/build-packages.html',
  styleUrls: ['../templates/build-packages.css']
})

export class BuildPackagesComponent implements OnInit {

  	public displayedColumns: string[] = ['type', 'repository', 'description', 'packages', 'useForStandardConfig', 'apis', 'selected'];

  	public deploymentSets: string[] = []
	public dependencyDisplayedColumns: string[] = ['select', 'repository', 'package', 'description']

	public sources: string[] = ['git', 'wpm']

	public dependencies: WmPackageInfo[]
	public selectedDependencies: SelectionModel<WmPackageInfo> = new SelectionModel<WmPackageInfo>(true, [])

  	public apiEnabled: boolean = true

	public deploymentSet: DeploymentSet

	public repositories: MatTableDataSource<Repository>

	@ViewChild("dependentsTable")
	public dependentsTable: MatTable<any>

	@ViewChild('reposTable', {read: MatTable})
	public repoTable: MatTable<any>

	public form: FormGroup
	public deploymentNameCtrl: FormControl
	public sourceTypeCtrl: FormControl
  	public repoNameCtrl: FormControl

	public values: Values

	public filteredSets: Observable<string[]>

	private _availableRepositories: Repository[] = []
  	private _indexingSnackbarRef: MatSnackBarRef<TextOnlySnackBar>
	private _isIndexing: boolean = false

	public constructor(private _activatedRoute: ActivatedRoute, private _formBuilder: FormBuilder, private _snackbar: MatSnackBar, private _dialog: MatDialog, private _settings: Settings, private _configService: ConfigurationService, private _gitService: GitSourceService, private _packagesService: PackagesService) {

		this.repositories = new MatTableDataSource([])

		this._settings.values().subscribe((v) => {

			this.values = v
		  	v.gitRepos.forEach((r) => {
				  this._availableRepositories.push(new Repository(r.name, r.packages, r.configuration))
		  	})

		  	this._configService.deploymentSets().subscribe((r) => {

				this.deploymentSets = r
				this.filteredSets = of(this.deploymentSets)

			  	this.filteredSets = this.deploymentNameCtrl.valueChanges.pipe(startWith(''), map(value => this._filter(value)))
		  	})

		  	this._gitService.repositories(this.values.gitName, v).subscribe((r) => {

			  r.forEach( (l) => {
				  let r: Repository = this.availableRepositoryWithName(l.name)

				  if (r != null) {
					  r.description = l.description
					  r.branch = l.defaultBranch
				  } else {
					  this._availableRepositories.push(new Repository(l.name))
				  }
			  })
		  })

		  this._settings.setCurrentPage("package")
		})
	}

	public ngOnInit() {

	  	this.deploymentNameCtrl = new FormControl()
		this.sourceTypeCtrl = new FormControl('git')
		this.repoNameCtrl = new FormControl()

		this.form = this._formBuilder.group({
        	deploymentNameCtrl: this.deploymentNameCtrl,
			sourceTypeControl: this.sourceTypeCtrl,
        	repoNameCtrl: this.repoNameCtrl,
	    })

      	this.repoNameCtrl.valueChanges.subscribe( repo => {
        	this.repoDidChange(repo)
      	})

		this.sourceTypeCtrl.valueChanges.subscribe( repo => {
			this.sourceTypeDidChange(repo)
		})

	    this._activatedRoute.paramMap.subscribe(params => {

			this.deploymentNameCtrl.setValue(params.get('id'))

			if (this.deploymentNameCtrl.value != null) {
				this.loadDeploymentSet(this.deploymentNameCtrl.value)
        	}
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

	public controlForRepoConfigControl(element: Repository, value?: any): FormControl {

		let ctrl: FormControl = null

		let name: string = element.name

		if (this.form.controls[name]) {
			ctrl = <FormControl> this.form.controls[name]

			if (value != null) {
				ctrl.setValue(value, {emitEvent: false})
			}
		} else {
			ctrl = new FormControl(value || element.useForStandardConfig)
			this.form.addControl(name, ctrl)
		}

		return ctrl
	}

	public updateRepoWithControlValue(element: Repository) {

		this.setDefaultConfigRepo(element, this.controlForRepoConfigControl(element).value)
		this.saveDeploymentSet(false)
	}

	public availableRepositories(): Repository[] {
		let a: Repository[] = []

		this._availableRepositories.forEach((r) => {
			if (this.findRepoForName(r.name) == null) {
				a.push(r)
			}
		})
		return a
	}

	public addRepository() {

		this.repoNameCtrl.setValue(null, {emitEvent: false})
		let r = new Repository("")

		if (this.repositories.data.length == 0) {
			r.useForStandardConfig = true
		} else {
			r.useForStandardConfig = false
		}

		this.repositories.data.push(r)
		this.repoTable.renderRows()
	}

	public sourceTypeDidChange(source: string) {
		// TODO
	}

	public repoDidChange(r: Repository) {

		  this.repositories.data[this.repositories.data.length-1] = r
		  this.saveDeploymentSet(true, true)

		  this.repoTable.renderRows()
	}

	public removeRepository(repo: Repository) {

		let index = -1
		let i = 0
		for (let r of this.repositories.data) {

			if (r == repo) {
				index = i
				break
			}

			i += 1
		}

		if (index != -1) {
			this.repositories.data.splice(index, 1)
			this.repoTable.renderRows()
			this.saveDeploymentSet(true)
		}
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
		this.repositories.data = this.deploymentSet.source[0].repositories
		this.saveDeploymentSet(true)
	}

	public deleteDeploymentSet(event) {

		this._configService.deleteDeploymentSet(this.deploymentSet.name).subscribe( result => {
			this.deploymentSets.splice(this.indexOfTemplate(this.deploymentSet.name), 1)
			this.deploymentNameCtrl.setValue("", {onlySelf: true, emitEvent: false})
			this.deploymentSet = null
			this.repositories.data = []
    	})
	}

	public deploymentSetNotConfigured() {

		return this.deploymentSet && this.deploymentSet.name != null && (this.deploymentSet.source == null || this.deploymentSet.source[0].repositories.length == 0)
	}

	public isExistingDeploymentSet(): boolean {

		return this.deploymentSet && this._isExistingDeploymentSet(this.deploymentSet.name)
	}

	public openGitDialog(repository: Repository) {
		let dialogRef = this._dialog.open(GitPackageChooserComponent, {
			height: '750px',
			width: '800px',
			data: {repository: repository}
		})

		dialogRef.afterClosed().subscribe(result => {
			this.checkDependencies()
		});
	}

	public _isExistingDeploymentSet(name: string): boolean {

		if (this.deploymentSet.name) {

			var found = false

			for (let i=0;i<this.deploymentSets.length;i++) {

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

	public selectedRepoNames(): string[] {

		  if (this.deploymentSet) {

      		let reps: string[] = []

      		this.deploymentSet.source[0].repositories.forEach( (r) =>  {
        		reps.push(r.name)
      		})

      		return reps
	  	} else {
      		return this.repoNameCtrl.value
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

	    //this.dependenciesSelectionChanged()
	}

	private dependenciesSelectionChanged() {

		this.selectedDependencies.selected.forEach((p) => {
			let rep: Repository = this.findDeploymentRepoForName(p.repository)

			if (rep != null) {
				rep.include.push(p.name)
			}
		})
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

			// we need to add it to repo in the list, or even the repo to the list if not present

			let repo: Repository = null

			for (let r of this.repositories.data) {
				if (r.name == p.repository) {
					// got it
					repo = r
					break
				}
			}

			if (repo == null) {
				let path: string = null
				for(let r of this.values.gitRepos) {
					if (r.name == p.repository) {
						path = r.packages
						break
					}
				}

				repo = new Repository(p.repository, path)
				this.repositories.data.push(repo)
			}

			repo.include.push(p.name)
		}

		this.indexOnServer(false)
		this.repoTable.renderRows()
		this.dependentsTable.renderRows()

		this.saveDeploymentSet(false)
	}

  	public addSelectedDependentsToIgnore() {

    	let p: WmPackageInfo = null

    	while(p=this.selectedDependencies.selected.pop()) {

      		this.removeDependency(p)

			this.repositories.data.forEach((r) => {
				// don't which one it refers to so will add to all, doh!
				r.exclude.push(p.name)
			})
    	}

    	this.saveDeploymentSet(false)
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

		this._configService.deploymentSet(name).subscribe((d) => {

			this.deploymentSet = d

			let selectedReps: string[] = []

      		this.deploymentSet.source[0].repositories.forEach((r) => {
        		selectedReps.push(r.name)
      		})

			//this.repoNameCtrl.setValue(selectedReps, {onlySelf: true, emitEvent: false})

			this.repositories.data = this.deploymentSet.source[0].repositories
			this.repoTable.renderRows()

			// update deployment set to reference current git info

      		this._settings.values().subscribe( v => {

        		if (!v.gitUser && !v.gitName) {

          		// git is not setup, don't do now't

          			window.alert("Warning - You haven't setup you git preferences!!")
        		} else {
					this.deploymentSet.source[0].gitURI = v.completeGitUri()
        		}
      		})

      		this.deploymentNameCtrl.setValue(d.name, {onlySelf: true, emitEvent: false})

			this.indexOnServer(false)
		})
	}

	private saveDeploymentSet(indexOnCompletion: boolean, reclone?: boolean) {

		this._configService.uploadDeploymentSet(this.deploymentSet).subscribe((d) => {

			if (indexOnCompletion)
				this.indexOnServer(reclone)

			if (!this.isExistingDeploymentSet())
				this.deploymentSets.push(this.deploymentSet.name)
		})
	}

	private indexOnServer(reindex: boolean, button?: any) {

		this._isIndexing = true
		this._indexingSnackbarRef = this._snackbar.open('Indexing git repository(s), dependency checking will not work until complete');
		this._packagesService.index(this.deploymentSet.name, this.deploymentSet.source[0], reindex).subscribe((packages) => {

			this._isIndexing = false
			this._indexingSnackbarRef.dismiss()

			if (button)
			  button.disabled = false

			if (this.deploymentSet.source[0].repositories.length > 0)
				this.checkDependencies()

		}, error => {
			this._isIndexing = false
			this._snackbar.open('Indexing failed: ' + error, 'Sorry', {duration: 3000})
    	})
	}

  	private checkDependencies() {

		if (this._isIndexing)
		  return

		let l: string[] = this.getAllPackagesForSource(this.deploymentSet.source[0])

		if (l.length > 0) {

      		this.deploymentSet.source[0].repositories.forEach((r) => {

        		this._packagesService.checkDependenciesForPackages(l, this.deploymentSet.name).subscribe((d) => {

					this.dependencies = []
					d.dependencies.forEach((p) => {
						let found: boolean = false
						for(let r of this.repositories.data) {
							if ((r.include.indexOf(p.name) != -1 || r.exclude.indexOf(p.name) != -1) || r.name === p.name) {
								found = true
								break
							}
						}

						if (!found) {

							if (!p.repository) {
								for (let a of this._availableRepositories) {
									if (a.name === p.name) {
										p.repository = a.name
									} else if (a.path) {
										// need to scan contents
										this.setRepoIfPackagePresent(this.values.gitName || this.values.gitUser, a, p)
									}
								}
							}

							this.dependencies.push(p)
						}
					})
          			this.rebuildAPIList(r, d.packages)
        		})
      		})

			this.saveDeploymentSet(false)

		} else {
			this.dependencies = []
		}
	}

	private setRepoIfPackagePresent(git: string, repo: Repository, pckg: WmPackageInfo) {
		this._gitService.wmPackages(git, repo.name, this.configForRepo(repo.name).packages, false).subscribe((packages) => {

			if (!pckg.repository) {
				let found = false
				for (let p of packages) {
					if (p.name == pckg.name) {
						found = true
						break
					}
				}

				if (found) {
					pckg.repository = repo.name
				}
			}
		}, error => {
		})
	}

	private configForRepo(name: string): RepoSettings {

		let found: RepoSettings = null

		for (let i = 0; i < this._availableRepositories.length; i++) {
			if (this._availableRepositories[i].name == name) {
				let r = this._availableRepositories[i]
				found = new RepoSettings(r.name, r.path, r.configPath)
				break
			}
		}

		if (found == null) {
			found = new RepoSettings(name, "/packages", "/config")
		}

		return found
	}

	private rebuildAPIList(r: Repository, packages: WmPackageInfo[]) {

		this.deploymentSet.apis = []
		r.selectedAPIs = []

		packages.forEach((p) => {

			if (p.apis) {
				p.apis.forEach((a) => {
					if (this.notInAPIList(a)) {
						this.deploymentSet.apis.push(a)
					}
				})

				if (r.name == p.name || r.include.indexOf(p.name) != -1) {
					p.apis.forEach((a) => {
						r.selectedAPIs.push(a)
					})
				}
			}
		})
	}

	private notInAPIList(a: APIDefinition): boolean {

		if (!this.deploymentSet.apis || this.deploymentSet.apis.length == 0)
			return true

		let notFound: boolean = true

		for (let i = 0; i < this.deploymentSet.apis.length; i++) {

			if (this.deploymentSet.apis[i].name == a.name) {
				notFound = false
				break
			}
		}

		return notFound
	}

	private clear() {

		this.deploymentSet = this.makeDeploymentSet()
		this.dependencies = []
    	this.repositories.data = this.deploymentSet.source[0].repositories

		if (this.repoTable)
			this.repoTable.renderRows()
	}

	private getAllPackagesForSource(source: Source): string[] {

		let out: string[] = []
    	source.repositories.forEach((r) => {

			if (r.include.length == 0 && r.path == null) {
				out.push(r.name)
      		} else {
        		r.include.forEach((p) => {
          			out.push(p)
        		})
		  	}
    	})

		return out
	}

	private makeDeploymentSet(name?: string, sources?: Source): DeploymentSet {

		let deploymentSet: DeploymentSet = new DeploymentSet()
		deploymentSet.name = name ? name : null
		let s: Source = sources || new Source()

		this._settings.values().subscribe((v) => {

      		if (!v.gitUri.endsWith("/"))
        		v.gitUri = v.gitUri + "/"

			s.gitURI = v.gitUri
      		s.gitURI += + v.gitUser

      		s.gitUser = v.gitUser
      		s.gitPassword = v.gitPassword
		})

		deploymentSet.source[0] = s

		return deploymentSet
	}

	private indexOfTemplate(name): number {

      if (!name || !this.deploymentSets)
        return -1

      let found: number = -1

      for (var i=0; i < this.deploymentSets.length; i++) {

        if (this.deploymentSets[i] == name) {
          found = i
          break
        }
      }

      return found
  	}

	private availableRepositoryWithName(name: string): Repository {

		let found: Repository = null

		for (let r of this._availableRepositories) {
			if (r.name == name) {
				found = r
				break
			}
		}

		return found
	}

	private findRepoForName(repo: string): Repository {

		let found: Repository = null

		for(let r of this.repositories.data) {
			if (r.name == repo) {
				found = r
				break
			}
		}

		return found
	}

	private findDeploymentRepoForName(repo: string): Repository {

		let found: Repository = null

		if (this.deploymentSet != null) {
			for(let r of this.deploymentSet.source[0].repositories) {
				if (r.name == repo) {
					found = r
					break
				}
			}
		}

		return found
	}

	private setDefaultConfigRepo(repo: Repository, isDefault: boolean) {

		let setOnce: boolean = true

		this.repositories.data.forEach((r) => {
			if (r.name === repo.name) {
				r.useForStandardConfig = isDefault
			} else {
				r.useForStandardConfig = isDefault ? false : setOnce
				setOnce = false
			}
		})

		this.saveDeploymentSet(false)
		this.repoTable.renderRows()
	}
}
