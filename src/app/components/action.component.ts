import { Component, ChangeDetectorRef, EventEmitter,
			OnInit, OnChanges, OnDestroy, Input, 
										Output }   		from '@angular/core'

import { Router }									  	from '@angular/router'
import {FormBuilder, FormGroup, FormControl, 
								Validators} 			from '@angular/forms'
import { SelectionModel }                             	from '@angular/cdk/collections'

import { MediaMatcher }                               	from '@angular/cdk/layout'
import { MatAccordion }                               	from '@angular/material/expansion'
import { MatInput }										from '@angular/material/input'
import { MatButton }									from '@angular/material/button'

import { MatDialog, MatDialogRef,
					MAT_DIALOG_DATA }	  				from '@angular/material/dialog'

import { Stage, Container, Action }            			from '../models/project'

@Component({
  selector: 'action',
  templateUrl: '../templates/action.html'
})

export class ActionComponent implements OnInit, OnChanges {

	@Input() 
	public stage: Stage

	@Input()
	public action: Action

	@Input()
	public type: string

	@Output()
	public change: EventEmitter<Action> = new EventEmitter()

	public form: FormGroup

	public apiMaturityList: string[] = ["none"," Beta", "Development", "Test", "Tested", "Failed", "Production", "Deprecated"]
	public apiActionsPositive: any[] = [{key: "none", value: "none"}, 
										{key: "upload", value: "Upload to API API Gateway"}, 
										{key: "promote", value: "Promote"},
										{key: "activate", value: "Activate"}, 
										{key: "publish", value: "Publish to Portal"}]

	public apiActionsNegative: any[] = [{key: "none", value: "none"}, 
										{key: "remove", value: "Remove API API Gateway"}, 
										{key: "rollback", value: "Rollback previous Promotion"},
										{key: "deactivate", value: "Deactivate"}, 
										{key: "unpublish", value: "Unpublish from Portal"}]

	public dockerActions: string[] = ["none", "push", "archive", "delete"]

  	public runTestsCtrl: FormControl
  	public keepAliveCtrl: FormControl
  	public apiDeployCtrl: FormControl
  	public apiStageCtrl: FormControl
  	public promoteAPIsCtrl: FormControl
  	public apiMaturityCtrl: FormControl
  	public tagImageCtrl: FormControl
  	public actionImageCtrl: FormControl
  	public pipelineStatusCtrl: FormControl

  	private _ignoreValueChanges: boolean

  	public constructor(private _formBuilder: FormBuilder) {
  	}

	public ngOnInit() {


		this._setupForm()
	}

	public ngOnChanges() {
		
	}

	public haveAPIs(): boolean {

		var found: boolean = false

		for (var i=0; i < this.stage.deployments.length; i++) {

			if (this.stage.deployments[i].apis.length > 0) {
				found = true
				break
			}
		}

		return found
	}

	public apiActions() {
		
		if (this.type == 'fail') {

			return this.apiActionsNegative

		} else {

			return this.apiActionsPositive
		}
	}

	public isAPIStageControlDisabled() {

		return this.apiDeployCtrl.value != 'promote'
	}

	private updateForm() {

		if (this.apiStageCtrl) {
			
			this._ignoreValueChanges = true
	  		
	  		this.runTestsCtrl.setValue(this.action.runTests == "true" ? true : false)
	  		this.apiDeployCtrl.setValue(this.action.apiDeployType ? this.action.apiDeployType : "none")
	  		this.apiStageCtrl.setValue(this.action.apiStage ? this.action.apiStage : this.stage.name)
	  		this.apiMaturityCtrl.setValue(this.action.apiMaturity ? this.action.apiMaturity : "none")
	  		this.keepAliveCtrl.setValue(this.action.stop == "false" ? true : false)
	  		this.actionImageCtrl.setValue(this.action.dockerAction)
	  		this.tagImageCtrl.setValue(this.action.dockerTag)
	  		this.pipelineStatusCtrl.setValue(this.action.pipelineAction ? this.action.pipelineAction : this.type == 'fail' ? "stop" : "continue")


			if (this.isAPIStageControlDisabled())
				this.apiStageCtrl.disable()
			else 
				this.apiStageCtrl.enable()

	  		this._ignoreValueChanges = false
  		}
	}

	private _setupForm() {

  		this.apiDeployCtrl = new FormControl("none")
  		this.apiStageCtrl = new FormControl({ value: '', disabled: this.isAPIStageControlDisabled() })
	  	this.apiMaturityCtrl = new FormControl("none")
	  	this.runTestsCtrl = new FormControl()
	  	this.keepAliveCtrl = new FormControl()
	  	this.actionImageCtrl = new FormControl()
	  	this.tagImageCtrl = new FormControl()
	  	this.pipelineStatusCtrl = new FormControl("continue")

	  	this.form = this._formBuilder.group({
  			runTestsCtrl: this.runTestsCtrl,
  			keepAliveCtrl: this.keepAliveCtrl,
  			apiDeployCtrl: this.apiDeployCtrl,
  			apiStageCtrl: this.apiStageCtrl,
  			apiMaturityCtrl: this.apiMaturityCtrl,
  			actionImageCtrl: this.actionImageCtrl,
  			tagImageCtrl: this.tagImageCtrl,
  			pipelineStatusCtrl: this.pipelineStatusCtrl
  		})

  		this.updateForm()

  		this.form.valueChanges.subscribe((d) => {

  			if (this._ignoreValueChanges)
  				return

			if (this.runTestsCtrl.dirty)
				this.action.runTests = "" + this.runTestsCtrl.value

			if (this.keepAliveCtrl.dirty)
				this.action.stop = "" + !this.keepAliveCtrl.value

			if (this.apiDeployCtrl.dirty) {

				let oldValue: string = this.action.apiDeployType

				this.action.apiDeployType = this.apiDeployCtrl.value

				if (this.apiDeployCtrl.value != oldValue) {

					if (this.apiDeployCtrl.value == 'promote')
					this.apiStageCtrl.enable()
				else 
					this.apiStageCtrl.disable()
				}
			}

			if (this.apiStageCtrl.dirty)
				this.action.apiStage = this.apiStageCtrl.value

			if (this.apiMaturityCtrl.dirty)
				this.action.apiMaturity = this.apiMaturityCtrl.value != "none" ? this.apiMaturityCtrl.value : null
			
			if (this.actionImageCtrl.dirty)
				this.action.dockerAction = this.actionImageCtrl.value

			if (this.tagImageCtrl.dirty)
				this.action.dockerTag = this.tagImageCtrl.value

			if (this.pipelineStatusCtrl.dirty)
				this.action.pipelineAction = this.pipelineStatusCtrl.value

			if (this.action.isActive())
				this.action.active = "true"
			else
				this.action.active = "false"
			
			this._save()
		}); 
  	}

  	private _save() {
  		this.change.emit(this.action)
  	}
}
