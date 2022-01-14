import { Component, EventEmitter, OnInit, OnChanges,
		OnDestroy, Input, Output }   					from '@angular/core'

import { FormBuilder, FormGroup, FormControl,
		                  Validators } 			  		from '@angular/forms'

import { DockerImage } 								   	from '../../models/docker-image'
import { DockerService }								from '../../services/docker.service'

import {Observable, of }                  				from 'rxjs'
import { map, startWith }                 				from 'rxjs/operators'

@Component({
  selector: 'docker-image-chooser',
  template: `
  <form [formGroup]="formGroup">
	  <label *ngIf="title">{{title}}</label>
	  <div *ngIf="!disabled;else disabledDiv"style="display:flex; flex-direction: row; width:100%; align-items: center">
	    <mat-form-field style="min-width: 350px" [floatLabel]="title ? 'never' : (float ? 'float' : 'auto')">
	    	<input [id]="baseIdentifier('input')" matInput placeholder="Docker Image template" [formControlName]="imageControlLabel" [matAutocomplete]="auto" oninput="this.value = this.value.toLowerCase()">
	    	<mat-hint *ngIf="showRepoLabel()" align="start"><strong>{{value.repository()}}</strong> </mat-hint>
	    	<mat-hint *ngIf="hint()" align="start">{{hint()}}</mat-hint>
      		<mat-autocomplete #auto="matAutocomplete">
        		<mat-option *ngFor="let image of filteredImages | async" [value]="image.name()" [ngStyle]="styleForImageItem(image)">
          			{{image.name()}}
        		</mat-option>
    		</mat-autocomplete>
    		<button [id]="baseIdentifier('button')" matSuffix *ngIf="showPullButton()" mat-flat-button (click)="pullImage($event)" style="margin-left: 5px; margin-top: -15px" matTooltip="Pull image from remote repository, include both registry and version e.g. registry/image:version"> <fa-icon class="icon" [icon]="['fas', 'plus-square']" style="color: red"></fa-icon> </button>
	    </mat-form-field>
	    <mat-form-field *ngIf="showVersionSelector()" style="width: 100px; margin-left: 10px" floatLabel="never">
	        <mat-select [id]="baseIdentifier('version')" placeholder="Version" [formControlName]="imageVersionControlLabel" [disabled]="disabled">
	          <mat-option *ngFor="let image of availableVersions" [value]="image.version()">
	            {{image.version()}}
	          </mat-option>
	        </mat-select>
	    </mat-form-field>
	  </div>
	  <ng-template #disabledDiv>
	  	<div>
		  	<mat-form-field style="min-width: 350px" [floatLabel]="title ? 'never' : float ? float : 'auto'">
		  		<input [id]="baseIdentifier('input')" matInput placeholder="Docker Image template" [value]="readOnlyImageName()" readonly="true" oninput="this.value = this.value.toLowerCase()">
		  		<mat-hint *ngIf="showRepoLabel()" align="start"><strong>{{value.repository()}}</strong> </mat-hint>
		  	</mat-form-field>
		  	<mat-form-field *ngIf="showVersionSelector()" style="width: 100px; margin-left: 10px" floatLabel="never">
	       		<input [id]="baseIdentifier('version')" matInput [value]="readOnlyVersion()" readonly="true">
	    	</mat-form-field>
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
	public dockerImages: DockerImage[]

	@Input()
	public value: DockerImage

	@Input()
	public preferredVersion: string

	@Input()
	public disabled: boolean = false

	@Input()
	public allowPull: boolean

	@Input()
	public allowLatest: boolean

	@Input()
	public allowEmptyContainer: boolean

	@Input()
	public float: string

	@Input()
	public required: FormGroup

	@Input()
	public hints: Map<any, string>

	@Output()
	public selectedImage: EventEmitter<DockerImage> = new EventEmitter()

	public filteredImages: Observable<DockerImage[]>

	public formGroup: FormGroup
	public imageCtrl: FormControl
	public imageVersionCtrl: FormControl
	public availableVersions: DockerImage[]

	public imageControlLabel: string
	public imageVersionControlLabel: string

	private _ignoreChanges: boolean = false
  private _priorDisabled: boolean = null

	public constructor(private _formBuilder: FormBuilder, private _dockerService: DockerService) {

		this.imageCtrl = new FormControl(null, Validators.required)
		this.imageVersionCtrl = new FormControl()
	}

	public ngOnInit() {

    this.imageControlLabel = "dk_" + (this.id ? this.id : this.title)
    this.imageVersionControlLabel = this.imageControlLabel + "_v"

    if (this.required)
      this.formGroup = this.required
    else
      this.formGroup = this._formBuilder.group({})

    this._setValue(true)

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

            this.imageVersionCtrl.setValue(image.version())
            this.setAvailableVersions()
          } else {
            image = new DockerImage(this.imageCtrl.value)

            this.value = image
            this.imageVersionCtrl.setValue(null)
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

          let image = this.imageFor(this.imageCtrl.value, this.imageVersionCtrl.value)

          if (!image && this.preferredVersion === 'latest') {
            image = this.imageFor(this.imageCtrl.value).copy()
            image.setVersion('latest')
          } else if (this.preferredVersion === 'latest') {
            image.setVersion('latest')
          }

          this.imageVersionCtrl.markAsPristine()

          this.flagChange(image)
      }
    })

    this.setAvailableVersions()
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

	private flagChange(image: DockerImage) {

		if (image) {
			this.selectedImage.emit(image)
		} else if (this.allowEmptyContainer) {
			this.selectedImage.emit(new DockerImage(this.imageCtrl.value))
		}
	}

	private addRequiredControl() {

		this.formGroup.setControl(this.imageControlLabel, this.imageCtrl)
		this.formGroup.setControl(this.imageVersionControlLabel, this.imageVersionCtrl)

		const ct = this.formGroup.controls

    const fc = this.formGroup.controls[this.imageControlLabel]

    this.filteredImages = fc.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value)))
	}

	private removeRequiredControl() {

		this._ignoreChanges = true

		this.imageCtrl.setValue(null)
		this.imageVersionCtrl.setValue(null)

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

    public showPullButton(): boolean {

    	return (this.allowPull && this.imageCtrl.value && this.imageFor(this.imageCtrl.value) == null)
    }

    public showVersionSelector(): boolean {

    	return (this.imageCtrl.value && this.availableVersions.length > 0)
    }

    public pullImage(event: any) {

    	this._dockerService.pullImage(this.value.tag()).subscribe((d) => {

    		this.dockerImages.push(d)
    		this.value = d
    		this._setValue()
    	})
    }

    private _setValue(setup?: boolean) {

    	this._ignoreChanges = true

    	if (this.value) {

    		this.imageCtrl.setValue(this.value.name())
			this.setAvailableVersions()

			if (setup && this.preferredVersion)
				this.imageVersionCtrl.setValue(this.preferredVersion)
			else
				this.imageVersionCtrl.setValue(this.value.version())
    	} else {
    		this.imageCtrl.setValue(null)
    		this.imageVersionCtrl.setValue(null)
    		this.availableVersions = []
    	}

		this._ignoreChanges = false
    }

    private imageFor(name: string, version?: string): DockerImage {

      var found: DockerImage = null

      for (var i=0; i < this.dockerImages.length; i++) {

        if (this.dockerImages[i].name() == name) {

          found = this.dockerImages[i]

          if  (version && found.version() != version) {

            for (var z=0; z < found.availableVersions.length; z++) {
              if (found.availableVersions[z].version() == version) {
                found = found.availableVersions[z]
                break
              }
            }
          }
        }
      }

      return found
    }
}
