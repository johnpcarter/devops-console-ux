import { Component, OnInit, ViewChild, ComponentFactoryResolver,
				ComponentRef, Inject }   			  from '@angular/core'
import { DomSanitizer }                               from '@angular/platform-browser'
import { ActivatedRoute }							  from '@angular/router'
import {FormBuilder, FormGroup, FormControl } 		  from '@angular/forms'
import { SelectionModel }                             from '@angular/cdk/collections'
import { Observable }                                 from 'rxjs'
import { map, startWith }                             from 'rxjs/operators'

import { trim }                                       from 'jquery'

import { MatDialog, MAT_DIALOG_DATA }           	  from '@angular/material/dialog'
import { MatButton }                                  from '@angular/material/button'

import { DockerImage, VersionType } 				  from '../models/docker-image'
import { BuildCommand, Builder } from '../models/build'
import { Installer } from '../models/Installer'
import { APIDefinition }                              from '../models/wm-package-info'

import { ResourceService }                            from '../services/resources.service'
import { BuildImageChooseDirective, PropertiesChangedOwner,
			BuilderProperties, BuilderComponent } from './elements/build-image-choose.directive'
import { DockerService } 				              from '../services/docker.service'
import { ConfigurationService }                       from '../services/configuration.service'

import { BuildExeComponent }                          from './build-exe.component'
import { MicroServiceBuilderComponent }               from './plugins/micro-service-builder.component'

import { Settings, Values }                            from '../settings'
import {SimpleNameComponent} from './elements/simple-name.component';

@Component({
  selector: 'build-solution',
  templateUrl: '../templates/build-image.html',
  styleUrls: ['../templates/build-image.css']
})

export class BuildImageComponent implements OnInit, PropertiesChangedOwner {

    public selectedImage: DockerImage
    public currentBuild: Builder
    public isLinearStepper: boolean = true

  // tslint:disable-next-line:indent
    public baseImages: DockerImage[] = []
    public customImages: DockerImage[] = []
    public licenceFiles: string[] = []
    public builds: string[] = []
    public comments: string = ''

    public baseImageFormGroup: FormGroup
  	public builderFormGroup: FormGroup
  	public propertiesFormGroup: FormGroup
    public commandsFormGroup: FormGroup
  	public targetImageFormGroup: FormGroup
  	public commitFormGroup: FormGroup

    public buildCtrl: FormControl
    public baseImageTypeCtrl: FormControl
    public baseImageCtrl: FormControl
    public targetRepoCtrl: FormControl
  	public targetImageCtrl: FormControl
  	public targetVersionCtrl: FormControl
    public dedicatedRepoCtrl: FormControl
    public versionTypeCtrl: FormControl
  	public licCtrl: FormControl
  	public commentsCtrl: FormControl
    public buildNameCtrl: FormControl
    public downloadCtrl: FormControl
    public buildUserCtrl: FormControl
    public entryUserCtrl: FormControl

    public pushCtrl: FormControl

    public buildTemplateName: string

    public selectionModel: SelectionModel<APIDefinition> = new SelectionModel()

  	public builderDisplayableEntries: string[]
  	public builderDisplayableProperties: Map<string, BuilderProperties[]>

    public isBuilding: boolean = false
  	public downloadRef: string = null

    public apiDisplayedColumns: string[] = ['select', 'name', 'description']
    public versionTypes: string[] = ['major', 'minor', 'patch']
    public settingsLoaded: boolean
    public userTypes: string[] = ['sagadmin', 'root']

    public filteredCustomImages: Observable<DockerImage[]>

  	@ViewChild(BuildImageChooseDirective) builder: BuildImageChooseDirective
  	@ViewChild('buildButton', {read: MatButton}) buildButton: MatButton
    @ViewChild('saveButton', {read: MatButton}) saveButton: MatButton

  	private _ignoreValuesChange: boolean = false
    private _id: string = null
    private _values: Values = null

    private _customBuilderComponent: BuilderComponent

    public constructor(private _inboundRouter: ActivatedRoute, private _settings: Settings, private _dockerService: DockerService, private _dialog: MatDialog,
                       private _formBuilder: FormBuilder, private componentFactoryResolver: ComponentFactoryResolver,
                       private _resources: ResourceService, private _configService: ConfigurationService,
                       private _sanitizer: DomSanitizer) {

        let sub = this._inboundRouter.params.subscribe(params => {

          this._id = params['id']
        })

        this._settings.values().subscribe((v) => {

            this._values = v

            this._dockerService.baseImages(true).subscribe((d) => {
                this.baseImages = d
                this.settingsLoaded = true

                /*if (this._id)
                    this.baseImageSelected(this.imageFor(this._id))

                this.baseImageTypeCtrl.setValue(this.currentBuild.sourceImage.type, {onlySelf: true})*/
            })

            this._dockerService.customImages(true).subscribe((d) => {

              //this.customImages = d
              d.forEach((i) => {
                this.customImages.push(i)
              })

              this.filteredCustomImages = this.targetImageCtrl.valueChanges
              .pipe(
                  startWith(''),
                  map(value => this._filter(value))
              )
          })

          this.licenceFiles = []

          this._resources.resourcesForType("licenses").subscribe((p) => {
            this.licenceFiles = []
             p.forEach((f) => {
              this.licenceFiles.push(f.name)
            })
          })

          this._configService.builds().subscribe((b) => {
              this.builds = b

              if (this._id != null) {
                  this.buildCtrl.setValue(this._id)
                  this.setTemplate(this._id)
              }
          })

          this._settings.setCurrentPage("image")
      })

      this.currentBuild = new Builder()
  }

	public ngOnInit() {

        this.baseImageCtrl = new FormControl()
        this.buildCtrl = new FormControl()
        this.baseImageTypeCtrl = new FormControl()
        this.targetImageCtrl = new FormControl()
  		this.licCtrl = new FormControl()
  		this.commentsCtrl = new FormControl()
        this.pushCtrl = new FormControl()

        this.targetVersionCtrl = new FormControl("0.0.1")
        this.versionTypeCtrl = new FormControl("minor")
        this.dedicatedRepoCtrl = new FormControl()
        this.targetRepoCtrl = new FormControl()
        this.buildNameCtrl = new FormControl()
        this.downloadCtrl = new FormControl(true)
        this.buildUserCtrl = new FormControl("sagadmin")
        this.entryUserCtrl = new FormControl("sagadmin")

        this.baseImageFormGroup = this._formBuilder.group({
            baseImageCtrl: this.baseImageCtrl,
            baseImageTypeCtrl: this.baseImageTypeCtrl,
            buildCtrl: this.buildCtrl
        })

      this.builderFormGroup = this._formBuilder.group({})

    	this.propertiesFormGroup = this._formBuilder.group({
          licCtrl: this.licCtrl,
          buildUserCtrl: this.buildUserCtrl,
          entryUserCtrl: this.entryUserCtrl
    	})

    	this.targetImageFormGroup = this._formBuilder.group({
            targetImageCtrl: this.targetImageCtrl,
      		targetVersionCtrl: this.targetVersionCtrl,
            targetRepoCtrl: this.targetRepoCtrl,
            dedicatedRepoCtrl: this.dedicatedRepoCtrl,
            versionTypeCtrl: this.versionTypeCtrl
    	})

    	this.commitFormGroup = this._formBuilder.group({
      		commentsCtrl: this.commentsCtrl,
            buildNameCtrl: this.buildNameCtrl,
            downloadCtrl: this.downloadCtrl,
            pushCtrl: this.pushCtrl
    	})

      this.commandsFormGroup = this._formBuilder.group({})

    	this.baseImageFormGroup.valueChanges.subscribe(values =>
    	{
        if (this._ignoreValuesChange)
    			return

        if (this.buildCtrl.dirty) {
          this.buildCtrl.markAsPristine()
          this.setTemplate(this.buildCtrl.value)
        }

        if (this.baseImageTypeCtrl.dirty) {
          this.baseImageTypeCtrl.markAsPristine()
          this.setBuilderComponent(this.baseImageTypeCtrl.value)
          this.currentBuild.sourceImage.type = this.baseImageTypeCtrl.value
          this.currentBuild.targetImage.type = this.baseImageCtrl.value

          this.refactorBuildCommands()
          this._save()
        }
    	})

    	this.propertiesFormGroup.valueChanges.subscribe(values => {

    		if (this._ignoreValuesChange)
    			return

        if (this.licCtrl.dirty) {
          this.licCtrl.markAsPristine()
          this.setLicenseFile(this.licCtrl.value)
          this._save()
        } else if (this.buildUserCtrl.dirty) {
           this.buildUserCtrl.markAsPristine()
           this.currentBuild.buildUser = this.buildUserCtrl.value
           this._save()
        } else if (this.entryUserCtrl.dirty) {
           this.entryUserCtrl.markAsPristine()
           this.currentBuild.entryUser = this.entryUserCtrl.value
           this._save()
        }
    	})

    	this.targetImageFormGroup.valueChanges.subscribe(values =>
    	{
    		if (this._ignoreValuesChange)
    			return

        if (this.targetRepoCtrl.dirty && this.currentBuild.targetImage.name()) {

          this.targetRepoCtrl.markAsPristine()

          if (this.currentBuild.targetImage) {
            this.currentBuild.targetImage.setRepository(this.targetRepoCtrl.value)
          } else {
            this.currentBuild.targetImage = new DockerImage()
            this.currentBuild.targetImage.setRepository(this.targetRepoCtrl.value)
          }

          this._save()
        } else if (this.targetImageCtrl.dirty) {

            this.targetImageCtrl.markAsPristine()

            if (!this.currentBuild.targetImage || (this.targetImageCtrl.value != null && this.targetImageCtrl.value != this.currentBuild.targetImage)) {

              this.updateTargetImage(true)

              // this._save()  performed in async step of above
            } else {
                this.currentBuild.targetImage.setDedicatedRepository(this.dedicatedRepoCtrl.value)
                this.currentBuild.targetImage.setName(this.targetImageCtrl.value.name())

             this._save()
           }

           this.targetImageCtrl.markAsPristine()
        } else if (this.targetRepoCtrl.dirty) {

            this.targetRepoCtrl.markAsPristine()

            this.updateTargetImage(true)
            // this._save()  performed in async step of above

        } else if (this.dedicatedRepoCtrl.dirty) {

          this.dedicatedRepoCtrl.disable({emitEvent: false})
          this.dedicatedRepoCtrl.markAsPristine()

          this.currentBuild.targetImage.setDedicatedRepository(this.dedicatedRepoCtrl.value)

          this._save(true).subscribe((success) => {
            this.dedicatedRepoCtrl.enable({emitEvent: false})
          })

        } else if (this.targetVersionCtrl.dirty) {

            this.currentBuild.targetImage.setVersion(this.targetVersionCtrl.value)

            this._save()

            this.targetVersionCtrl.markAsPristine()

        } else if (this.versionTypeCtrl.dirty) {

          this.versionTypeCtrl.disable({emitEvent: false})

          this.setNextVersion(this.targetImageCtrl.value.uniqueName()).subscribe ((success) => {
            this.versionTypeCtrl.enable({emitEvent: false})
          })

          this.versionTypeCtrl.markAsPristine()
        }
    	})

    	this.commitFormGroup.valueChanges.subscribe(values => {

    		if (this._ignoreValuesChange)
    			return

    		if (this.commentsCtrl.dirty) {
    			this.comments = this.commentsCtrl.value.replace(/[\n\r]/g, '')
        }

        if (this.buildNameCtrl.dirty) {
          this.buildTemplateName = trim(this.buildNameCtrl.value.replace(/[\n\r]/g, ''))
        }

        if (this.downloadCtrl.dirty) {
          this.downloadCtrl.markAsPristine()
          this.downloadRef = null
        }
    	})
    }

    public productCodeLabel(): string {

      if (this.currentBuild && this.currentBuild.sourceImage && this.currentBuild.sourceImage.name())
        return "Base: " + this.currentBuild.sourceImage.name()
      else
        return "Base Image"
    }

    public currentBaseImage(): DockerImage {

      if (this.currentBuild.sourceImage) {
        return this.currentBuild.sourceImage
      } else {
        return null
      }
    }

    public baseImageSelected(image: DockerImage) {

      if (image) {

        this._ignoreValuesChange = true
        this.baseImageCtrl.setValue(image.name())
        this._ignoreValuesChange = false

        this.currentBuild.sourceImage = image.copy()
        this.setBuilderComponent(image.type, image.tag())

        this._save()
      }
    }

    public availableVersions(): DockerImage[] {

      if (this.currentBuild) {
        if (this.currentBuild.sourceImage.availableVersions.length > 0) {
           let versions = [this.currentBuild.sourceImage]

           this.currentBuild.sourceImage.availableVersions.forEach((v) => {
             versions.push(v)
           })

           return versions
        } else {
           return [this.currentBuild.sourceImage]
        }
      }
      else {
        return []
      }
    }

    public imageName(image: DockerImage) {

      if (image)
        return image.name()
      else
        return null
    }

    public isExistingTemplate(): boolean {

      return this.indexOfTemplate(this.currentBuild.name) != -1
    }

    public addTemplate(event: any) {

      this.currentBuild.name = this.buildCtrl.value

      this._configService.uploadBuild(this.currentBuild).subscribe((success) => {

        this.builds.push(this.currentBuild.name)
      })
    }

    public saveTemplate() {

      this.currentBuild.name = this.buildTemplateName

      this.saveButton.disabled = true

      this._ignoreValuesChange = true
      this.buildCtrl.setValue(this.currentBuild.name)
      this._ignoreValuesChange = false

      this._save()
    }

    public copyTemplate(event) {

        let dialogRef = this._dialog.open(SimpleNameComponent, {
            width: "600px",
            height: "150px",
            data: { title: "Name of new template" },
        })

        dialogRef.afterClosed().subscribe(result => {

            if (result) {

                this.currentBuild.name = result
                this.buildCtrl.setValue(result, {onlySelf: true, emitEvent: false})

                this._configService.uploadBuild(this.currentBuild).subscribe((success) => {

                    this.builds.push(this.currentBuild.name)
                })
            }
        })
    }

    public deleteTemplate(event) {

        const name = this.buildCtrl.value

        this._configService.deleteBuild(this.currentBuild.name).subscribe((success) => {
            this.builds.splice(this.indexOfTemplate(this.currentBuild.name), 1)
            this.buildCtrl.setValue("", {onlySelf: true, emitEvent: false})
            this.currentBuild = new Builder()
      })
    }

    public downloadConfiguration(): void {

        this._configService.downloadBuild(this.buildCtrl.value)
    }

    public labelForGoButton(): string {

      if (this.downloadCtrl.value)
        return "  Build   "
      else
        return "  Download  "
    }

    public labelForPreparingButton(): string {

      if (this.downloadCtrl.value)
        return "Building..."
      else
        return "Preparing..."
    }

    private clearTemplate() {

      this.currentBuild = new Builder()

      this.buildCtrl.setValue(null, {emitEvent: false})
      this.buildNameCtrl.setValue("", {emitEvent: false})
      this.baseImageTypeCtrl.setValue("", {emitEvent: false})
      this.baseImageCtrl.setValue("", {emitEvent: false})
      this.targetRepoCtrl.setValue("", {emitEvent: false})
      this.targetRepoCtrl.setValue("", {emitEvent: false})
      this.targetImageCtrl.setValue("", {emitEvent: false})
      this.targetVersionCtrl.setValue("", {emitEvent: false})
      this.dedicatedRepoCtrl.setValue("", {emitEvent: false})
      this.versionTypeCtrl.setValue("", {emitEvent: false})
      this.licCtrl.setValue("", {emitEvent: false})
      this.commentsCtrl.setValue("", {emitEvent: false})
      this.buildNameCtrl.setValue("", {emitEvent: false})
      this.downloadCtrl.setValue("", {emitEvent: false})
      this.buildUserCtrl.setValue("", {emitEvent: false})
      this.entryUserCtrl.setValue("", {emitEvent: false})

      this.builderFormGroup = this._formBuilder.group({})
      this._customBuilderComponent.formGroup = this.builderFormGroup
      this.isLinearStepper = true
    }

    private setTemplate(name: string) {

      this.buildNameCtrl.setValue(name, {emitEvent: false})

      if (this.indexOfTemplate(name) == -1)
        return

      if (name) {

        this.currentBuild = new Builder()

        this._configService.build(name).subscribe((build) => {

            build.name = name
            this.currentBuild = build
            this.isLinearStepper = false

            this._ignoreValuesChange = true

          // refresh current build with latest deployment set changes
            this.currentBuild.deployments.forEach((d) => {
                this._configService.deploymentSet(d.id).subscribe((nd) => {

                    d.name = nd.name
                    d.apis = nd.apis

              // keep current target dir as this is set at build time, NOT in the deployment set
                    let t = d.source[0].targetDir
                    d.source = nd.source
                    d.source[0].gitURI = this._values.completeGitUri()
                    d.source[0].targetDir = t
                })
            })

            if (this.currentBuild.targetImage.repository()) {
                this.targetRepoCtrl.setValue(this.currentBuild.targetImage.repository(), {emitEvent: false})
                this.dedicatedRepoCtrl.setValue(this.currentBuild.targetImage.dedicatedRepository(), {emitEvent: false})
            } else {
                this.dedicatedRepoCtrl.setValue(false, {emitEvent: false})
            }

            if (this.currentBuild.targetImage.name()) {
                this.baseImageCtrl.setValue(build.sourceImage.name())
                this.baseImageTypeCtrl.setValue(build.sourceImage.type, {onlySelf: true})

                this.targetImageCtrl.setValue(this.currentBuild.targetImage)
                this.updateTargetImage(false)
            }

            let licFiles: BuildCommand[] = this.currentBuild.fileForType("licenses")
            this.licCtrl.setValue(licFiles.length > 0 ? licFiles[0].source.replace(/\-/g, " ") : null)

            this.buildUserCtrl.setValue(this.currentBuild.buildUser ? this.currentBuild.buildUser : "sagadmin")
            this.entryUserCtrl.setValue(this.currentBuild.entryUser ? this.currentBuild.entryUser : this.currentBuild.buildUser)

            this.buildNameCtrl.setValue(this.currentBuild.name)

            this.setBuilderComponent(this.currentBuild.sourceImage.type, this.currentBuild.sourceImage.tag())

            if (this.currentTargetVersionExists())
                this.setNextVersion(this.targetImageCtrl.value.uniqueName())
            else
                this._setCtrlVersion(this.currentBuild.targetImage.version())

            this._ignoreValuesChange = false
        })
      } else {

          this.currentBuild = new Builder()
          this.buildTemplateName = ""
      }
    }

    private currentTargetVersionExists(): boolean {

        if (this.targetImageCtrl.value) {

          let img: DockerImage = this.imageFor(this.currentBuild.targetImage.name())

          return img && img.exists()

        } else {
          return false
        }
    }

    public commandsUpdated(event: any) {

      this._save()
    }

    private _filter(value: any): DockerImage[] {

      if (value) {

        if (typeof value === 'string') {

          const filterValue = value.toLowerCase()
          return this.customImages.filter(option => filterValue.length == 0 || option.name().toLowerCase().includes(filterValue))
        } else {
          return [value as DockerImage]
        }

      } else {
        return this.customImages
      }
    }

    private setLicenseFile(lic: string) {

      this._customBuilderComponent.setLicenseFile(lic)
    }

    private updateTargetImage(save: boolean) {

      if (typeof this.targetImageCtrl.value == 'string') {

        // user manually entered name of image

        if (!this.targetRepoCtrl.value || this.targetRepoCtrl.value == "") {
            this.dedicatedRepoCtrl.setValue(true, {emitEvent: false})
          }

          let img: DockerImage = this.imageFor(this.targetImageCtrl.value)

          if (img && (!this.targetRepoCtrl.value || this.targetRepoCtrl.value == img.repository())) {

            // referenced existing image

              this.currentBuild.targetImage = DockerImage.make(img)
          }
          else {

            // new image build from scratch

              this.currentBuild.targetImage = new DockerImage()
              this.currentBuild.targetImage.setName(this.targetImageCtrl.value)
              this.currentBuild.targetImage.setRepository(this.targetRepoCtrl.value)
              this.currentBuild.targetImage.setVersion(this.targetVersionCtrl.value)
            }

      } else if (this.targetImageCtrl.value != null) {
          this.currentBuild.targetImage = this.targetImageCtrl.value.copy()

          if (this.currentBuild.targetImage) {

            this._ignoreValuesChange = true
            this.targetRepoCtrl.setValue(this.currentBuild.targetImage.repository())
            this.targetVersionCtrl.setValue(this.currentBuild.targetImage.version())
            this.dedicatedRepoCtrl.setValue(this.currentBuild.targetImage.dedicatedRepository())
            this._ignoreValuesChange = false
          }
      } else {
          this.currentBuild.targetImage.setRepository(this.targetRepoCtrl.value)
          this.currentBuild.targetImage.setName('')
      }

      this.setNextVersion(this.currentBuild.targetImage.uniqueName()).subscribe( (success) => {
          if (save) {
              this._save()
          }
      })
    }

    private nextVersion():string {

      return this.targetVersionCtrl.value
    }

    private setNextVersion(name: string): Observable<Boolean> {

      return this._dockerService.versions(name).pipe(map((images) => {

        if (images.length > 0) {

          let nextVersion: string = images[0].getNextVersion(this.determineVersionType())
          this._setCtrlVersion(nextVersion)
          return true
        } else {

          if (this.determineVersionType() == VersionType.patch)
            this._setCtrlVersion("0.0.1")
          else if (this.determineVersionType() == VersionType.minor)
            this._setCtrlVersion("0.1")
          else if (this.determineVersionType() == VersionType.major)
            this._setCtrlVersion("1.0")

          return false
        }
      }))
    }

    private _setCtrlVersion(value: string) {

      this._ignoreValuesChange = true
      this.targetVersionCtrl.setValue(value)
      this._ignoreValuesChange = false
    }

    private _isSaving: Boolean = false

    private _save(observe?: Boolean): Observable<Boolean> {

      if (!this.currentBuild.name || this._isSaving)
        return

      this._isSaving = true

      if (observe) {
        return this._configService.uploadBuild(this.currentBuild).pipe(map((success) => {
          this._isSaving = false
          return success
        }))
      } else {
        this._configService.uploadBuild(this.currentBuild).subscribe((success) => {
          this._isSaving = false
        })

        return null
      }
    }

    private indexOfTemplate(name): number {

      var found: number = -1

      for (var i=0; i < this.builds.length; i++) {

        if (this.builds[i] == name) {
          found = i
          break
        }
      }

      return found
    }

    public minVersion(imageName: string): number {

      return 1
    }

    public propertiesFor(entry: string): BuilderProperties[] {

    	return this.builderDisplayableProperties.get(entry)
    }

    public builderDisplayableKeys(): any[] {

      let builderDisplayableKeys = null

      if (this.builderDisplayableProperties && this.builderDisplayableProperties.size > 0)
      {
        builderDisplayableKeys = []
        let it: IterableIterator<string> = this.builderDisplayableProperties.keys()
        let result: IteratorResult<string>

        this.builderDisplayableEntries = []

        while(!(result=it.next()).done) {
          this.builderDisplayableEntries.push(result.value)
        }

        let first: BuilderProperties[] = this.builderDisplayableProperties.get(this.builderDisplayableProperties.keys().next().value)

        first.forEach((a) => {
          builderDisplayableKeys.push(a.key)
        })
      }

      return builderDisplayableKeys
    }

    private imageFor(name: string) {

      var found: DockerImage = null

      for (var i=0; i < this.customImages.length; i++) {
        if (this.customImages[i].name() == name || this.customImages[i].id == name) {
           found = this.customImages[i]
           break
        }
      }

      if (!found) {
        for (var i=0; i < this.baseImages.length; i++) {
          if (this.baseImages[i].name() == name || this.baseImages[i].id == name) {
            found = this.baseImages[i]
            break
          }
        }
      }

      return found
    }

    private setBuilderComponent(type: string, tag?: string) {

      if (!type && !tag)
        return

      this.builderFormGroup = this._formBuilder.group({})

    	let componentFactory = null

      if (type != null) {
        if (type.toLowerCase().indexOf('is') != -1 || type.toLowerCase().indexOf('msr') != -1 || type.toLowerCase().indexOf('b2b') != -1 || type == "MicroService Runtime" || type == "Micro Service Runtime")
          componentFactory = this.componentFactoryResolver.resolveComponentFactory(MicroServiceBuilderComponent)
          //	else if (type.toLowerCase().indexOf('apimg') != -1)
        //		componentFactory = this.componentFactoryResolver.resolveComponentFactory(ApiMicroGatewayInstallerComponent)
        else
          return
      } else {
        if (tag.indexOf("microservicesruntime")) {
          componentFactory = this.componentFactoryResolver.resolveComponentFactory(MicroServiceBuilderComponent)
        }
      }

	    if (this.builder) {
	      let viewContainerRef = this.builder.viewContainerRef
	      viewContainerRef.clear()

        let customBuilderComponentRef: ComponentRef<BuilderComponent> = viewContainerRef.createComponent(componentFactory)
        customBuilderComponentRef.instance.owner = this
        customBuilderComponentRef.instance.formGroup = this.builderFormGroup

        this._customBuilderComponent = customBuilderComponentRef.instance
	    }
  	}

    public initialProperties(): any {

      return this.currentBuild
    }

    public propertiesChangedInBuilder(type: string, displayableProperties: Map<string, BuilderProperties[]>, values: any) {

      this.currentBuild.deploymentType = type

      if (displayableProperties) {
        this.builderDisplayableProperties = displayableProperties
      }

      if (values) {
        this.currentBuild = values
        this._save()
      }
    }

    public targetName(): string {

      if (this.currentBuild && this.currentBuild.targetImage) {
        return this.currentBuild.targetImage.name()
      } else {
        return ""
      }
    }

    public sourceTag(): string {

      return this.currentBuild.sourceImage.tag()
    }

    public targetTag(): string {

      let tag: string = null

      if (this.targetImageCtrl.value) {

        let name: string = null

        if (typeof this.targetImageCtrl.value == 'string')
           name = this.targetImageCtrl.value
        else
          name = this.targetImageCtrl.value.name()

        if (this.targetRepoCtrl.value)
          tag = this.targetRepoCtrl.value + (this.dedicatedRepoCtrl.value ? "/" : ":") + name
        else
          tag = name

        if (this.dedicatedRepoCtrl.value) {

          tag += ":" + this.targetVersionCtrl.value
        } else {

          tag += "-" + this.targetVersionCtrl.value
        }
      }

      return tag
    }

    private refactorBuildCommands() {

	    if (this.currentBuild.deployments != null) {
        this.currentBuild.deployments.forEach( (d, i) => {
          if (d.source[0].targetDir.indexOf('IntegrationServer') != -1) {

            if (this.currentBuild.sourceImage.type == 'msr' && d.source[0].targetDir.indexOf('instances/default') != -1) {
              // update path for MSR

              d.source[0].targetDir = '/opt/softwareag/IntegrationServer' + d.source[0].targetDir.substr(d.source[0].targetDir.indexOf('instances/default') + 17)

            } else if ((this.currentBuild.sourceImage.type == 'is' || this.currentBuild.sourceImage.type == 'b2b') && d.source[0].targetDir.indexOf("instances/default") == -1) {
              // update path IS

              d.source[0].targetDir = '/opt/softwareag/IntegrationServer/instances/default' + d.source[0].targetDir.substr(d.source[0].targetDir.indexOf('IntegrationServer') + 17)
            }
          }
        })
      }

      this.currentBuild.buildCommands.forEach( (b) => {
        if (b.target != null && b.target.indexOf('IntegrationServer') != -1) {
          if (this.currentBuild.sourceImage.type == 'msr' && b.target.indexOf('instances/default') != -1) {
          // update path for MSR

            b.target = '/opt/softwareag/IntegrationServer' + b.target.substr(b.target.indexOf('instances/default') + 17)

          } else if ((this.currentBuild.sourceImage.type == 'is' || this.currentBuild.sourceImage.type == 'b2b') && b.fileType != 'properties' && b.target != '/opt/softwareag/IntegrationServer/updates' && b.target.indexOf("instances/default") == -1) {
          // update path IS

            b.target = '/opt/softwareag/IntegrationServer/instances/default' + b.target.substr(b.target.indexOf('IntegrationServer') + 17)
          }
        }
      })
    }

    public downloadLicence(event) {

      let file: BuildCommand[] = this.currentBuild.fileForType("licenses")

      if (file.length > 0)
        this._resources.downloadResourceViaBrowser("licenses", file[0].source)
    }

    public licenseFileAdded(response: any) {

        this._resources.resourcesForType("licenses").subscribe((p) => {
          this.licenceFiles = []
           p.forEach((f) => {
            this.licenceFiles.push(f.name)
          })
        })
    }

    public build() {

        this.buildButton.disabled = true
        let name = this.currentBuild.sourceImage.name()

        if (this.currentBuild.sourceImage.repository() != null)
            name = this.currentBuild.sourceImage.repository() + "/" + this.currentBuild.sourceImage.name()

        this.currentBuild.targetImage.setVersion(this.targetVersionCtrl.value)

        if (!this.downloadCtrl.value) {

            this.isBuilding = true

            this._dockerService.downloadBuild(this.currentBuild, "" + this.nextVersion(), this.comments).subscribe(result => {

                this.isBuilding = false

                if (!result) {
                    window.alert("Build failed, refer to server log for more information")
                } else {
                    this.downloadRef = result
                    window.alert("Build Successful, with image id " + result)
                }

                this._save()
            })
        } else {

        // build on server

            let dialogRef = this._dialog.open(BuildExeComponent, {
                width: "80%",
                height: "80%",
                data: { build: this.currentBuild, version: this.nextVersion(), comments: this.comments, push: this.pushCtrl.value },
            })

            dialogRef.afterClosed().subscribe(result => {

                this.buildButton.disabled = false
                this.isBuilding = false

                if (result) {
                    this._save()
                }
            })
        }
    }

    public downloadNow(fileRef: string) {

        window.open("/rad/jc.devops:api/docker/build/" + fileRef)
    }

    private determineVersionType(): VersionType {

      if (this.versionTypeCtrl.value == 'major')
        return VersionType.major
      else if (this.versionTypeCtrl.value == 'patch')
        return VersionType.patch
      else
        return VersionType.minor
    }

    public installerTemplateLoaded(template: Installer) {
	    // ignore
    }
}
