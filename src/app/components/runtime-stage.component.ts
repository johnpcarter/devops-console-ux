import { Component, ChangeDetectorRef, ViewChild,
			OnInit, OnDestroy }   						            from '@angular/core'
import { Router }					   								from '@angular/router'

import {FormBuilder, FormGroup, FormControl,
								Validators} 			            from '@angular/forms'

import { Project, RunSet, Builder, DeploymentSet, Deployment, Probe,
	Port, Arg, Stage, Container }       				          	from '../models/project'

import { Settings }                                   				from '../settings'
import { ConfigurationService }                    		  			from '../services/configuration.service'
import { ResourceService }                            				from '../services/resources.service'
import { GitSourceService, GitRepo }									from '../services/git-source-control.service'

@Component({
  selector: 'runtime-stage',
  templateUrl: '../templates/runtime-stage.html',
  styleUrls: ['../templates/runtime-stage.css']
})

export class RuntimeStageComponent implements OnInit {

	  public stageTemplateFormGroup: FormGroup
	  public finaliseFormGroup: FormGroup
	  public isLinearStepper: boolean = true

	  public runListCtrl: FormControl
	  public stageCtrl: FormControl
	  public useGitCtrl: FormControl
	  public selectedGitCtrl: FormControl
    public selectedGitRepoCtrl: FormControl

    public runSets: string[]
    public projects: string[]

    public currentProject: Project

    public starting: boolean

    private _ignoreValuesChange = false
    private _stageForms: Map<string, FormGroup> = new Map()

	  public gitURI: string
	  public gits: string[]
	  public repositories: GitRepo[]

	  private _gitUri: string; // selected by user
    private _gitRepo: string; // selected by user
	  private _gitUser: string
	  private _gitPassword: string

    @ViewChild("downloadLink")
    private _downloadLink

	public constructor(private _router: Router, private _settings: Settings, private _formBuilder: FormBuilder, private _resources: ResourceService, private _configService: ConfigurationService, private _gitService: GitSourceService) {

		this.runSets = []
		this._configService.runSets().subscribe((p) => {
          this.runSets = p
        })

        this._configService.projects().subscribe((p) => {
          this.projects = p
        })

        this.selectedGitCtrl = new FormControl()
		    this.selectedGitRepoCtrl = new FormControl()

        this._settings.values().subscribe((v) => {

          this.gitURI = v.gitUri
        	this._gitUser = v.gitUser
        	this._gitPassword = v.gitPassword

			if (v.gitName)
				this.gits = [ v.gitName ]
			else
				this.gits = [ v.gitUser ]

			/*if (this.repositories)
				this.repositories.unshift(new GitRepo("Use Project Name", "Use Project Name"))
			else
				this.repositories = [new GitRepo("Use Project Name", "Use Project Name")];*/

			this.loadGitRepositories()

			this._settings.setCurrentPage("stage")
        })
	}

	public ngOnInit() {

		this.currentProject = new Project()
		let stage: Stage = this.addStageToProject("local")
		stage.containerHost = "localhost"

		this.runListCtrl = new FormControl()
    	this.stageCtrl = new FormControl()

		this.stageTemplateFormGroup = this._formBuilder.group({
			runListCtrl: this.runListCtrl,
			stageCtrl: this.stageCtrl
		})

		this.useGitCtrl = new FormControl()

		this.finaliseFormGroup = this._formBuilder.group({
			useGitCtrl: this.useGitCtrl,
			selectedGitCtrl: this.selectedGitCtrl,
			selectedGitRepoCtrl: this.selectedGitRepoCtrl
		})

		this.stageTemplateFormGroup.valueChanges.subscribe((d) => {

			if (this._ignoreValuesChange)
    			return

    		if (this.stageCtrl.dirty && this.stageCtrl.value.length > 0 && this.stageCtrl.value !== this.currentProject.name) {

				this.setTemplate(this.stageCtrl.value)
			} else if (this.runListCtrl.dirty) {
        		this.setRunTemplateForStage(this.runListCtrl.value)
      		}

		})

		this.finaliseFormGroup.valueChanges.subscribe((d) => {

			if (this.useGitCtrl.value) {

			  if (this.gitURI.endsWith('/')) {
          this._gitUri = this.gitURI + this.selectedGitCtrl.value
        } else {
          this._gitUri = this.gitURI + '/' + this.selectedGitCtrl.value
        }

				if (this.selectedGitRepoCtrl.value != "Use Project Name")
					this._gitRepo = this.selectedGitRepoCtrl.value
				else
					this._gitRepo = null

				this.loadGitRepositories()
			} else {
				this._gitUri = null
				this._gitRepo = null
			}
		})
	}

	public haveRunTemplates() {

    	return this.runSets && this.runSets.length > 0
  	}

  	public goRunPage() {

    	this._router.navigate(['/run'])
  	}

	public loadGitRepositories() {

		this._gitService.repositories(this.selectedGitCtrl.value).subscribe((r) => {
			this.repositories = r
			this.repositories.unshift(new GitRepo("Use Project Name", "Use Project Name"))
		})
	}

	public buttonLabel() {

		if (this.useGitCtrl.value) {
			return "Commit to repository"
		} else {
			return "Download Jenkins file"
		}
	}

	public addStage(currentStage: Stage) {

		let i: number = this.indexOfStageInProject(currentStage.name)

		if (i != -1) {
			let copy: Stage = currentStage.copy()
			this.currentProject.stages.splice(i, 1, currentStage, copy)

			copy.deployments = []
			this.currentProject.run.deployments.forEach((s) => {
				let serviceCopy: Deployment = s.copy()

				serviceCopy.containers.forEach((c) => {
					c.active = "true"
				})

				copy.deployments.push(serviceCopy)
			})

			this._save()
			this.updateForms()
		}
	}

	public removeStage(currentStage: Stage) {

		let i: number = this.indexOfStageInProject(currentStage.name)

		if (i != -1 && this.currentProject.stages.length > 1) {
			this.currentProject.stages.splice(i, 1)
			this._save()
			this.updateForms()
		}
	}

	public stageUpdated(stage: Stage) {

		this._save()
	}

	public isExistingTemplate(): boolean {

      return this.currentProject && this.indexOfTemplate(this.currentProject.name) != -1
    }

    public addTemplate(event) {

    	this.currentProject.name = this.stageCtrl.value
      	let stage: Stage = this.addStageToProject("local")
      	this._configService.uploadProject(this.currentProject).subscribe((success) => {
		this.projects.push(this.currentProject.name)
      })
    }

  	public deleteTemplate(event) {

      this._configService.deleteProject(this.currentProject.name).subscribe((success) => {
        this.projects.splice(this.indexOfTemplate(this.currentProject.name), 1)
        this.currentProject = new Project()
        this.stageCtrl.setValue("", {onlySelf: true, emitEvent: false})
      })
  	}

  	public formGroupForStage(stage: Stage): FormGroup {

  		var form: FormGroup = this._stageForms.get(stage.id)

  		if (!form) {
  			form = this._formBuilder.group({})
  			this._stageForms.set(stage.id, form)
  		}

  		return form
  	}

  	public isNotFirstStage(stage: Stage, type: string): boolean {

  		if (type.startsWith('build')) {

  			if (type == 'build')
  				return stage.buildOnStart == "true"
  			else
  				return this.currentProject.stages[0] != stage

  		} else {

  			return (type == "start" && (stage.buildOnStart == "true" || stage.onStart.runTests == "true" || (stage.onStart.apiDeployType != null && stage.onStart.apiDeployType != 'none'))) || this.currentProject.stages[0] != stage

  		}
  	}

  	public isNotLastStageFail(stage: Stage) {

  		if ((!stage.onFail.pipelineAction || stage.onFail.pipelineAction == 'stop') || (stage.onSuccess.pipelineAction  && stage.onSuccess.pipelineAction == 'stop'))
  			return false
  		else
  			return this.isNotLastStage(stage, true)
  	}

	public isNotLastStage(stage: Stage, isPostAction): boolean {

		return (!isPostAction && ((stage.onSuccess.pipelineAction != 'stop' || !isPostAction) && (this.postActionDescription(stage, 'success') != null || this.postActionDescription(stage, 'fail') != null))) ||
				((stage.onSuccess.pipelineAction != 'stop' || !isPostAction) && this.currentProject.stages[this.currentProject.stages.length-1] != stage)
  	}

  	public isFailEnd(stage: Stage): boolean {

  		return !stage.onFail.pipelineAction || stage.onFail.pipelineAction == 'stop'
  	}

  	public isSuccessEnd(stage: Stage): boolean {

  		return stage.onSuccess.pipelineAction && stage.onSuccess.pipelineAction == 'stop'
  	}

  	public borderStyleForPostAction(stage: Stage): any {

  		let style: any = {}

  		let s: string = this.postActionDescription(stage,'success')
  		let f: string = this.postActionDescription(stage,'fail')

  		if (s && f) {

  			style['border-left'] = '0.5px solid #ff0000'

  			if (this.currentProject.stages[this.currentProject.stages.length-1] != stage) {
  				style['border-right'] = '0.5px solid #ff0000'
  			}
  		}

  		return style
  	}

  	public postActionDescription(stage: Stage, type: string): string {

  		if (type == "start") {
  			return stage.onStart ? stage.onStart.summary() : null
  		} else if (type == "success") {
  			return stage.onSuccess ? stage.onSuccess.summary() : null
  		} else {
  			return stage.onFail ? stage.onFail.summary() : null
  		}
  	}

  	public labelForBuild() {

  		if (this.currentProject.run.builds.length > 0)
  			return this.currentProject.run.builds[0].name
  		else
  			return ""
  	}

  	public download() {

  		this.starting = true

  		this.currentProject.stages.forEach((s) => {

  			s.onSuccess.active = s.onSuccess.isActive() ? "true" : "false"
  			s.onFail.active = s.onFail.isActive() ? "true" : "false"
  		})

  		this._save()

    	this._configService.generateJenkinsPipeline(this.currentProject, this._gitUri, this._gitRepo, this._gitUser, this._gitPassword).subscribe((file) => {

      		this.starting = false

      		if (this._gitUri) {

      			// do nothing

      		} else {

      			// allow file to be downloaded
      			if (file) {
      				let url = window.URL.createObjectURL(file)
	      			//window.open('data:text/plain,' + encodeURIComponent(file))

	      			const link = this._downloadLink.nativeElement
  					link.href = url
  					link.download = 'Jenkinsfile-' + this.currentProject.name
  					link.click()

  					window.URL.revokeObjectURL(url)
	      		} else {
	        		window.alert("Oops, geeneration failed, refer to Integration Server log for more info")
	      		}
      		}
	    })
  	}

	private setRunTemplateForStage(runTemplateName: string) {

		this._configService.runSet(runTemplateName).subscribe((r) => {
			this.currentProject.run = r

			if (this.currentProject.stages.length == 0) {
				this.addStageToProject("local").containerHost = "localhost"
			}

			this.currentProject.stages.forEach((s) => {
				this.restoreStageContainersToBuild(s)
			})

			this.updateForms()
			this._save()
		})
	}

	private setTemplate(stageName: string) {

		if (this.indexOfTemplate(stageName) === -1) {

			this.currentProject.name = name
		} else {

			this._configService.project(stageName).subscribe((p) => {
				this.isLinearStepper = false
				this.currentProject = p
				this.refresh()
			})
		}
	}

	private refresh() {

		this._configService.runSet(this.currentProject.run.name).subscribe((runSet) => {
			this.currentProject.run = runSet
			this.updateForms()
			this._save()
		})
	}

	private _save() {

		if (!this.currentProject.name)
			return

		this._configService.uploadProject(this.currentProject).subscribe((status) => {

		})
	}

	private updateForms() {

		if (this.currentProject.run.name)
      this.runListCtrl.setValue(this.currentProject.run.name.replace(/-/g,' '), {emitEvent: false})
	}

	private addStageToProject(id: string) {

		var stage: Stage = this.stageInProject(id)

		if (!stage) {
			stage = new Stage()
			stage.id = id
			stage.name = id

			this.restoreStageContainersToBuild(stage)

			this.currentProject.stages.push(stage)
		}

		return stage
	}

	private restoreStageContainersToBuild(stage: Stage) {

		stage.deployments = []
		this.currentProject.run.deployments.forEach((s) => {
			stage.deployments.push(s.copy())
		})

		stage.deployments.forEach((s) => {
			s.containers.forEach((c) => {
				c.active = "true"
				c.hostname = null
			})
		})
	}

	private stageInProject(id: string): Stage {

		let found: number = this.indexOfStageInProject(id)

		if (found != -1)
			return this.currentProject.stages[found]
		else
			return null
	}

	private indexOfStageInProject(id: string): number {

		var found: number = -1

     	for (var i=0; i < this.currentProject.stages.length; i++) {

        if (this.currentProject.stages[i].name == id) {
        	found = i
          	break
        }
      }

      return found
	}

	private indexOfTemplate(name): number {

    	var found: number = -1

      	if (this.projects) {

      		for (var i=0; i < this.projects.length; i++) {

        		if (this.projects[i] == name) {
          			found = i
          			break
        		}
      		}
  	   }

      return found
  }

}
