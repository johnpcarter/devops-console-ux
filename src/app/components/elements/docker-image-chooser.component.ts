import { Component, EventEmitter, OnInit, OnChanges,
		OnDestroy, Input, Output }   					from '@angular/core'

import { FormBuilder, FormGroup, FormControl,
		                  Validators } 			  		from '@angular/forms'

import {Observable, of }                  				from 'rxjs'
import { map, startWith }                 				from 'rxjs/operators'

import { MatSnackBar } 									from '@angular/material/snack-bar'

import { DockerImage } 								   	from '../../models/docker-image'
import { DockerService }								from '../../services/docker.service'

import { BuildCommand } 								from '../../models/build'
import {BuildImage} from '../../models/build-image';
import {ConfigurationService} from '../../services/configuration.service';

@Component({
  selector: 'docker-image-chooser',
  template: `
  <form [formGroup]="formGroup">
	  <div *ngIf="!disabled;else disabledDiv"style="display:flex; flex-direction: row; width:100%; align-items: center">
		  <mat-tab-group *ngIf="allowBuild; else chooser" animationDuration="40ms" [(selectedIndex)]="selectedTabIndex" style="width: 60%; border: lightgray solid 1px">
			  <mat-tab label="{{title || 'Image'}}" [disabled]="value && value.dockerFile != null">
				  <div style="padding: 20px">
					  <ng-container *ngIf="value && value.dockerFile; else chooserWrapper">
						  <ng-container *ngTemplateOutlet="dockerFile">
							  This text is not displayed
						  </ng-container>
					  </ng-container>
					  <ng-template #chooserWrapper>
						  <ng-container *ngTemplateOutlet="chooser">
						  	This text is not displayed
					  	</ng-container>
					  </ng-template>
				  </div>
			  </mat-tab>
			  <mat-tab *ngIf="builds" label="Build" [disabled]="value && value.dockerFile != null">
				  <mat-form-field style="min-width: 250px;; padding: 25px;">
					  <mat-select id="run.deploy.templateChooser" #selectedProjectControl placeholder="Select Build" [formControlName]="buildRefCtrlLabel">
						  <mat-option *ngFor="let build of builds" [value]="build">
							  {{build}}
						  </mat-option>
					  </mat-select>
				  </mat-form-field>
			  </mat-tab>
			  <mat-tab label="Docker file">
				  <div style="padding: 20px 10px; min-width:90px;">
					  <ng-container *ngIf="value && value.dockerFile != null; else hint">
						  <ng-container *ngTemplateOutlet="dockerFile">
						  </ng-container>
						  <button style="margin-bottom: 20px; float: right" mat-raised-button color="accent" class="red-on-hover" (click)="removeDockerFile()"><fa-icon class="icon" [icon]="['fas', 'trash-alt']"> Remove</fa-icon></button>
					  </ng-container>
					  <ng-template #hint>
						  <p style="color: lightgray; font-size: smaller; padding-right: 20px">Specify a *lightweight* Dockerfile to be built at runtime.</p>
						  <file-uploader-button style="margin-bottom: 20px; float: right;" title="Upload" alias="dockerfiles" [reference]="reference" type="dockerfiles" uploadURL="/invoke/jc.devops.console.resources_.services:uploadMultipartForm" (onCompletion)="dockerFileUploaded($event)"></file-uploader-button>
					  </ng-template>
				  </div>
			  </mat-tab>
		  </mat-tab-group>
		  <ng-template #chooser>
			  <div>
				  <label *ngIf="title">{{title}}</label>
				  <div>
					  <mat-form-field style="min-width: 350px" [floatLabel]="title ? 'never' : (float ? 'float' : 'auto')">
						  <input [id]="baseIdentifier('input')" matInput placeholder="Docker Image template" [formControlName]="imageControlLabel" [matAutocomplete]="autoImage" oninput="this.value = this.value.toLowerCase()" [disabled]="value && value.dockerFile">
						  <mat-hint *ngIf="showRepoLabel()" align="start"><strong>{{value.repository()}}</strong> </mat-hint>
						  <mat-hint *ngIf="hint()" align="start">{{hint()}}</mat-hint>
						  <mat-autocomplete #autoImage="matAutocomplete">
							  <mat-option class="multiline-mat-option" *ngFor="let image of filteredImages | async" [value]="image.name()" [ngStyle]="styleForImageItem(image)">
								  <p>{{image.name()}}</p>
								  <small style="color: gray">{{image.repository()}}</small>
							  </mat-option>
						  </mat-autocomplete>
						  <button [id]="baseIdentifier('button')" matSuffix *ngIf="showPullButton()" mat-flat-button (click)="pullImage($event)" style="margin-left: 5px; margin-top: -15px" matTooltip="Pull image from remote repository, include both registry and version e.g. registry/image:version"> <fa-icon class="icon" [icon]="['fas', 'plus-square']" style="color: red"></fa-icon> </button>
					  </mat-form-field>
					  <mat-form-field *ngIf="showVersionSelector()" style="width: 100px; margin-left: 10px" floatLabel="never">
						  <input [id]="baseIdentifier('version')" matInput placeholder="Version" [formControlName]="imageVersionControlLabel" [disabled]="disabled" [matAutocomplete]="autoVersion">
						  <mat-autocomplete #autoVersion="matAutocomplete">
							  <mat-option *ngFor="let image of availableVersions" [value]="image.version()">
								  {{image.version()}}
							  </mat-option>
						  </mat-autocomplete>
					  </mat-form-field>
					  <p *ngIf="value && value.dockerFile">
						  {{value.dockerFile}}
					  </p>
				  </div>
			  </div>
		  </ng-template>
	  </div>
	  <ng-template #disabledDiv>
	  	<div *ngIf="!value || !value.dockerFile; else dockerFileReadOnly">
		  	<mat-form-field style="min-width: 350px" [floatLabel]="title ? 'never' : float ? float : 'auto'">
		  		<input [id]="baseIdentifier('input')" matInput placeholder="Docker Image template" [value]="readOnlyImageName()" readonly="true" oninput="this.value = this.value.toLowerCase()">
		  		<mat-hint *ngIf="showRepoLabel()" align="start"><strong>{{value.repository()}}</strong> </mat-hint>
		  	</mat-form-field>
		  	<mat-form-field *ngIf="showVersionSelector()" style="width: 100px; margin-left: 10px" floatLabel="never">
	       		<input [id]="baseIdentifier('version')" matInput [value]="readOnlyVersion()" readonly="true">
	    	</mat-form-field>
	  	</div>
		  <ng-template #dockerFileReadOnly>
			  <ng-container *ngTemplateOutlet="dockerFile">
				  This text is not displayed
			  </ng-container>
		  </ng-template>
	  </ng-template>
	  <ng-template #dockerFile>
		  <div style="display: flex; align-items: center; padding-right: 20px;">
			  <div style="display: flex; flex-direction: column">
				  <span style="color: black; font-size: smaller;  line-height: 30px; vertical-align: center">{{value.dockerFile}}</span>
				  <span style="color: lightgray; font-size: smaller"> references {{value.tag()}}</span>
			  </div>
		  </div>
	  </ng-template>
  </form>
`
})

export class DockerImageChooserComponent implements OnInit, OnChanges, OnDestroy  {

	@Input()
	public title: string

	@Input()
	public id: string

	@Input()
	public reference: string

	@Input()
	public dockerImages: DockerImage[]

	@Input()
	public value: DockerImage

	@Input()
	public preferredVersion: string

	@Input()
	public disabled: boolean = false

	@Input()
	public allowPull: string

	@Input()
	public allowBuild: string

	@Input()
	public allowLatest: boolean

	@Input()
	public allowEmptyContainer: boolean

	@Input()
	public float: string

	@Input()
	public parentFormGroup: FormGroup

	@Input()
	public hints: Map<any, string>

	@Input()
	public currentBuild: string

	@Input()
	public builds: string[]

	@Output()
	public selectedImage: EventEmitter<DockerImage> = new EventEmitter()

	@Output()
	public buildCommands: EventEmitter<BuildCommand[]> = new EventEmitter()

	public filteredImages: Observable<DockerImage[]>

	public formGroup: FormGroup
	public imageCtrl: FormControl
	public imageVersionCtrl: FormControl
	public availableVersions: DockerImage[]

	public buildRefCtrl: FormControl

	public imageControlLabel: string
	public imageVersionControlLabel: string
	public buildRefCtrlLabel: string

	public selectedTabIndex: number = 0

	private _ignoreChanges: boolean = false
  	private _priorDisabled: boolean = null

	public constructor(private _formBuilder: FormBuilder, private _dockerService: DockerService, private _configService: ConfigurationService, private _snackBar: MatSnackBar) {
	}

	public ngOnInit() {

		if (this.value) {
			this.imageCtrl = new FormControl(this.value.name(), Validators.required)
			this.imageVersionCtrl = new FormControl(this.preferredVersion)
		} else {
			this.imageCtrl = new FormControl(null, Validators.required)
			this.imageVersionCtrl = new FormControl()
			this.availableVersions = []
		}

		this.buildRefCtrl = new FormControl(this.currentBuild)

    	this.imageControlLabel = "dk_" + (this.id ? this.id : this.title)
    	this.imageVersionControlLabel = this.imageControlLabel + "_v"
		this.buildRefCtrlLabel = this.imageControlLabel + "_b"

    	if (this.parentFormGroup)
      		this.formGroup = this.parentFormGroup
    	else
      		this.formGroup = this._formBuilder.group({})

    	if (!this.disabled) {

      		this.addRequiredControl()
    	} else {

      		this.filteredImages = of(this.dockerImages)
		}

    	this.imageCtrl.valueChanges.subscribe((v) => {

      		if (!this._ignoreChanges) {

        		// if image changed, set version to latest by default

          		this._ignoreChanges = true

          		let image: DockerImage = this.imageFor(this.imageCtrl.value)

          		if (image) {
            		image = image.latestVersion().copy()

            		this.imageVersionCtrl.setValue(image.version(), {emitEvent: false})
            		this.setAvailableVersions()
          		} else {
            		image = new DockerImage(this.imageCtrl.value)

            		this.value = image
            		this.imageVersionCtrl.setValue(null, {emitEvent: false})
            		this.availableVersions = []
          		}

          		this.imageCtrl.markAsPristine()
          		this._ignoreChanges = false

          		this.flagChange(image)
        	}
    	})

    	this.imageVersionCtrl.valueChanges.subscribe((v) => {

      		if (!this._ignoreChanges) {

          		// chosen a different version

          		this.preferredVersion = this.imageVersionCtrl.value

          		let image = this.imageFor(this.imageCtrl.value, this.imageVersionCtrl.value, this.allowPull === 'true')

		  		if (this.preferredVersion === 'latest') {
			  		if (!image) {
				  		image = this.imageFor(this.imageCtrl.value).copy()
				  		image.setVersion('latest')
			  		} else if (this.preferredVersion === 'latest') {
				  		image.setVersion('latest')
			  		}
		  		} else if (!image) {
			  		image = this.imageFor(this.imageCtrl.value).copy()
			  		image.setVersion(this.preferredVersion)
		  		}

		  		this.flagChange(image)
          		this.imageVersionCtrl.markAsPristine()
      		}
    	})

		this.buildRefCtrl.valueChanges.subscribe((v) => {

			this._configService.build(v).subscribe((build) => {
				if (build != null) {
					let image = build.targetImage
					image.buildTemplate = v
					this.imageCtrl.setValue(image.name(), {onlySelf: true, emitEvent: false})
					this.imageVersionCtrl.setValue(image.version(), {onlySelf: true, emitEvent: false})

					this.flagChange(image)
					this.buildRefCtrl.markAsPristine()
				}
			})
		})

    	this.setAvailableVersions()

		if (this.value && this.value.dockerFile) {
			this.selectedTabIndex = 2
		} else if (this.currentBuild) {
			this.selectedTabIndex = 1
		}
  	}

	public ngOnDestroy() {

		this.removeRequiredControl()
	}

	public ngOnChanges() {

		if (this._ignoreChanges || !this.formGroup)
			return

		if (this.imageCtrl && this.value && (this.value.name() != this.imageCtrl.value || this.value.version() != this.imageVersionCtrl.value)) {

			this._setValue()
		}

		if (this._priorDisabled == null || this.disabled != this._priorDisabled) {
		  this._priorDisabled = this.disabled

      if (this.disabled)
        this.removeRequiredControl()
      else
        this.addRequiredControl()
	    }
	}

	public baseIdentifier(suffix: string): string {

	  if (this.id)
	    return "docker.image.chooser."  + suffix + "." + this.id
	  else if (this.title)
	    return "docker.image.chooser." + suffix + "."  + this.title.toLowerCase().replace(/\s/g, "-")
	  else
	    return "docker.image.chooser." + suffix + "._."
  }

	public styleForImageItem(image: DockerImage): any {

		let style: any = {}

		if (!image.id) {
			style['color'] = "red"
		}

		return style
	}

	public hint(): string {

		if (this.hints && this.hints.get(this.imageCtrl.value)) {
			return this.hints.get(this.imageCtrl.value)
		} else {
			return null
		}
	}

	public showRepoLabel() {

		return this.value && this.value.repository() && !this.value.repository().startsWith(this.value.name())
	}

	public readOnlyImageName(): string {

		if (this.value)
			return this.value.name()
		else
			return null
	}

	public readOnlyVersion(): string {

		if (this.value)
			return this.value.version()
		else
			return null
	}

	public dockerFileUploaded(response: any) {

		console.log("uploaded " + response.filename + ", hint: " + response.hint)

		this.value = new DockerImage(response.hint)
		this.value.dockerFile = response.filename
		this.flagChange(this.value, response.buildCommands)
	}

	public removeDockerFile() {

		if (this.value) {
			this.value.dockerFile = null
			this.flagChange(this.value)
		}
	}

	public showPullButton(): boolean {

		return (this.allowPull && this.imageCtrl.value && this.imageFor(this.imageCtrl.value, this.imageVersionCtrl.value, false) == null)
	}

	public showVersionSelector(): boolean {

		return (this.imageCtrl.value && this.availableVersions.length > 0)
	}

	public pullImage(event: any) {

		this._snackBar.open('Pulling package', 'Dismiss')

		this._dockerService.pullImage(this.value.tag()).subscribe((d) => {

			if (d) {
				this.setImageFor(d)
				this.value = d
				this._setValue()
				this._snackBar.dismiss()
			} else {
				this._snackBar.open('Pull failed', 'Argh', {duration: 3000})
			}
		})
	}

	private flagChange(image: DockerImage, buildCommands?: BuildCommand[]) {

		if (image) {
			this.selectedImage.emit(image)

			if (buildCommands && this.buildCommands) {
				this.buildCommands.emit(buildCommands)
			}
		} else if (this.allowEmptyContainer) {
			this.selectedImage.emit(new DockerImage(this.imageCtrl.value))
		}
	}

	private addRequiredControl() {

		this.formGroup.setControl(this.imageControlLabel, this.imageCtrl)
		this.formGroup.setControl(this.imageVersionControlLabel, this.imageVersionCtrl)
		this.formGroup.setControl(this.buildRefCtrlLabel, this.buildRefCtrl)

		const ct = this.formGroup.controls

    	const fc = this.formGroup.controls[this.imageControlLabel]

    	this.filteredImages = fc.valueChanges
      		.pipe(
        		startWith(''),
        		map(value => this._filter(value)))
	}

	private removeRequiredControl() {

		this._ignoreChanges = true

		this.imageCtrl.setValue(null, {emitEvent: false})
		this.imageVersionCtrl.setValue(null, {emitEvent: false})

		this._ignoreChanges = false

		this.formGroup.removeControl(this.imageControlLabel)
		this.formGroup.removeControl(this.imageControlLabel)
	}

	private setAvailableVersions(): DockerImage[] {

      if (this.imageCtrl.value) {

      	let versions = []
        let image: DockerImage = this.imageFor(this.imageCtrl.value)
        let latest: DockerImage = null

        if (image == null) {
        	image = this.value
        }

       	if (image) {

       		if (this.allowLatest) {
        		if (image)
        			latest = image.copy()
        		else
        			latest = new DockerImage()

        		latest.setVersion("latest")
        	}

        	if (image.availableVersions && image.availableVersions.length > 0) {

           		image.availableVersions.forEach((v) => {
             		versions.push(v)
           		})
        	} else {

           		versions = [image]
       		}

       		if (latest)
        		versions.splice(0, 0, latest)
        }

        this.availableVersions = versions
      }
      else {

      	this.availableVersions = []
      }

      return this.availableVersions
    }

    private _filter(value: string): DockerImage[] {

      if (value && typeof value == 'string') {
        return this.dockerImages.filter(option => value.length == null || value.length == 0 || option.name().toLowerCase().includes(value.toLowerCase()))
      } else {
        return this.dockerImages
      }
    }

    private _setValue() {

    	this._ignoreChanges = true

    	if (this.value) {

    		this.imageCtrl.setValue(this.value.name(), {emitEvent: false})
			this.setAvailableVersions()
			this.imageVersionCtrl.setValue(this.value.version(), {emitEvent: false})
    	} else {
    		this.imageCtrl.setValue(null, {emitEvent: false})
    		this.imageVersionCtrl.setValue(null, {emitEvent: false})
    		this.availableVersions = []
    	}

		this._ignoreChanges = false
    }

    private imageFor(name: string, version?: string, allowOtherVersions?: boolean): DockerImage {

      var found: DockerImage = null

      for (var i=0; i < this.dockerImages.length; i++) {

        if (this.dockerImages[i].name() == name) {

			var x: DockerImage = this.dockerImages[i]

			if (!version || x.version() == version) {
				// exact match

				found = x
				break
			} else if (!allowOtherVersions) {

				// don't allow version if not in list

				for (let z=0; z < x.availableVersions.length; z++) {
					if (x.availableVersions[z].version() == version) {
						found = x.availableVersions[z]
						break
					}
				}
			}
        }

		if (found) {
			break
		}
      }

      return found
    }

	private setImageFor(image: DockerImage): void {

		var foundName: boolean = false

		for (var i=0; i < this.dockerImages.length; i++) {

			if (this.dockerImages[i].name() == image.name()) {

				foundName = true

				var x: DockerImage = this.dockerImages[i]
				var foundVersion: boolean = false
				for (let z=0; z < x.availableVersions.length; z++) {
					if (x.availableVersions[z].version() == image.version()) {
						foundVersion = true
						break
					}
				}

				if (!foundVersion) {
					x.availableVersions.push(image)
				}

				break
			}
		}

		if (!foundName) {
			this.dockerImages.push(image)
			if (image.availableVersions.length == 0) {
				this.availableVersions.push(image)
			}
		}
	}
}
