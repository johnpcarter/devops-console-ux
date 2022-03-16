import { Component, ChangeDetectorRef, ViewChild,
			OnInit, OnDestroy, ComponentFactoryResolver }   	  	  from '@angular/core'

import {ActivatedRoute, Router}                               from '@angular/router'

import {Observable}                                           from 'rxjs'
import { map, startWith }                                     from 'rxjs/operators'

import {FormBuilder, FormGroup, FormControl,
								Validators} 			          	                from '@angular/forms'

import { MatDialog }	  				         	                    from '@angular/material/dialog'

import { Settings }                                   	      from '../settings'

import { BuildImageChooseDirective, PropertiesChangedOwner,
      BuilderProperties, BuilderComponent }                   from './elements/build-image-choose.directive'

import { DockerImage, VersionType } 								          from '../models/docker-image'
import { ResourceService }                                    from '../services/resources.service'

import { MicroServiceInstallerComponent }				          	  from './plugins/micro-service-installer.component'
import { DockerService } 				          	      	      	  from '../services/docker.service'
import { ConfigurationService }                    		    		from '../services/configuration.service'
import { ContainerTemplates }							          	        from '../support/container.templates'
import { BuildExeComponent }                                  from './build-exe.component'
import { InstallerComponent }                                 from './plugins/installer.component'
import { Installer } from '../models/Installer'

@Component({
  selector: 'build-install',
  templateUrl: '../templates/build-install.html',
  styleUrls: ['../templates/build-install.css']
})

export class BuildInstallComponent implements OnInit, PropertiesChangedOwner {

  public productCodesVisible: string[] = ["msr", "um", "apigw", "apimg", "apipr", "mws", "centrasite", "tc", "mysqldb"]

  public setupOkay: boolean = false
  public isLinearStepper: boolean = true
  public isInstalling: boolean = false
  public downloadRef: string = null
  public settingsLoaded: boolean = false

  public installerTypeFormGroup: FormGroup
  public installCtrl: FormControl
  public osTypeCtrl: FormControl
  public osTypeVersionCtrl: FormControl
  public otherOsTypeCtrl: FormControl
  public prodCtrl: FormControl

  public installerImageFormGroup: FormGroup
  public targetRepoCtrl: FormControl
  public targetImageCtrl: FormControl
  public targetVersionCtrl: FormControl
  public dedicatedRepoCtrl: FormControl

  public wmImageCtrl: FormControl
  public keepWmImageCtrl: FormControl

  public propertiesFormGroup: FormGroup
  public licCtrl: FormControl
  public portCtrl: FormControl

  public productPropertiesFormGroup: FormGroup

  public summaryFormGroup: FormGroup
  public updateCtrl: FormControl
  public userCtrl: FormControl
  public passwordCtrl: FormControl
  public userUpdateCtrl: FormControl
  public passwordEncryptedCtrl: FormControl

  public commentsCtrl: FormControl
  public downloadCtrl: FormControl
  public installerNameCtrl: FormControl

  public currentBaseImage: DockerImage
  public currentInstaller: Installer
  public filteredImages: Observable<DockerImage[]>
  public baseImages: DockerImage[] = []
  //public customImages: DockerImage[] = []
  public installs: string[] = []
  public licenceFiles: string[] = []
  public wmImages: any[] = []

  public builderDisplayableEntries: string[]
  public builderDisplayableProperties: Map<string, BuilderProperties[]>

  private _showHiddenBuildCommands: boolean = false

  private _templateSetOnFirstPage: boolean = false
  private _isTemplate: boolean = false
  private _ignoreValuesChange: boolean = false

  private _customBuilderComponent: BuilderComponent

  @ViewChild(BuildImageChooseDirective) builder: BuildImageChooseDirective

	public constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _settings: Settings, private _dockerService: DockerService, private _dialog: MatDialog,
		private _formBuilder: FormBuilder, private _resources: ResourceService, private _configService: ConfigurationService, private componentFactoryResolver: ComponentFactoryResolver) {

    this.installCtrl = new FormControl()
    this.prodCtrl = new FormControl()
    this.osTypeCtrl = new FormControl("centos")
    this.osTypeVersionCtrl = new FormControl("latest")

    this.otherOsTypeCtrl = new FormControl()
    this.wmImageCtrl = new FormControl()
    this.keepWmImageCtrl = new FormControl()
    this.targetRepoCtrl = new FormControl()
    this.targetImageCtrl = new FormControl()
    this.targetVersionCtrl = new FormControl()
    this.dedicatedRepoCtrl = new FormControl()

    this.licCtrl = new FormControl()
    this.portCtrl = new FormControl()
    this.commentsCtrl = new FormControl()
    this.downloadCtrl = new FormControl(true)
    this.updateCtrl = new FormControl(false)
    this.userCtrl = new FormControl()
    this.passwordCtrl = new FormControl()
    this.userUpdateCtrl = new FormControl()
    this.passwordEncryptedCtrl = new FormControl()
    this.installerNameCtrl = new FormControl()

    this.installerTypeFormGroup = _formBuilder.group({
      installCtrl: this.installCtrl,
      prodCtrl: this.prodCtrl,
    })

    this.installerImageFormGroup = _formBuilder.group({
      wmImageCtrl: this.wmImageCtrl,
      keepWmImageCtrl: this.keepWmImageCtrl,
      osTypeCtrl: this.osTypeCtrl,
      osTypeVersionCtrl: this.osTypeVersionCtrl,
      otherOsTypeCtrl: this.otherOsTypeCtrl,
      targetRepoCtrl: this.targetRepoCtrl,
      targetImageCtrl: this.targetImageCtrl,
      targetVersionCtrl: this.targetVersionCtrl,
      dedicatedRepoCtrl: this.dedicatedRepoCtrl
    })

    this.propertiesFormGroup = this._formBuilder.group({
      licCtrl: this.licCtrl,
      portCtrl: this.portCtrl,
    })

    this.productPropertiesFormGroup = this._formBuilder.group({

    })

    this.summaryFormGroup = this._formBuilder.group({
      commentsCtrl: this.commentsCtrl,
      downloadCtrl: this.downloadCtrl,
      updateCtrl: this.updateCtrl,
      installerNameCtrl: this.installerNameCtrl
    })

    this._settings.values().subscribe((settings) => {
      this.settingsLoaded = true

      console.log("setttings loaded for build image " + settings.dockerHost)

     /* if (settings.empowerUserId) {
        this._ignoreValuesChange = false
        this.userCtrl.setValue(settings.empowerUserId)
        this.userCtrl.disable()

        this.userUpdateCtrl.setValue(settings.empowerUserId)
        this.userUpdateCtrl.disable()
        this._ignoreValuesChange = false
      }

      if (settings.empowerPassword) {
        this._ignoreValuesChange = false
        this.passwordCtrl.setValue(settings.empowerPassword)
        this.passwordCtrl.disable()
        this._ignoreValuesChange = false
      }

      if (settings.empowerEncryptedPassword) {
        this._ignoreValuesChange = false
        this.passwordEncryptedCtrl.setValue(settings.empowerEncryptedPassword)
        this.passwordEncryptedCtrl.disable()
        this._ignoreValuesChange = false
      }*/

      this._dockerService.baseImages(true).subscribe((d) => {
            this.baseImages = d

            this.filteredImages = this.targetImageCtrl.valueChanges
            .pipe(
              startWith(''),
              map(value => this._filter(value))
            )
      })

      /*this._dockerService.customImages(false, settings.dockerHost).subscribe((d) => {
        this.customImages = d
      });*/

      this._configService.installs().subscribe((b) => {
            this.installs = b
      })

      this._resources.resourcesForType("licenses").subscribe((p) => {
        this.licenceFiles = []
         p.forEach((f) => {
          this.licenceFiles.push(f.name)
        })

        this._settings.setCurrentPage("install")
      })

      this._resources.resourcesForType("installer-images").subscribe((files) => {

        this.wmImages = []
        this.wmImages.push({"filename": "Download"})

        if (files) {
          files.forEach((f) => {
            this.wmImages.push(f)
          })
        }
      })
    })

    this._activatedRoute.paramMap.subscribe(params => {
        this.installCtrl.setValue(params.get('id'))
    })

    this.currentInstaller = new Installer()
	}

	public ngOnInit() {

    this.installerTypeFormGroup.valueChanges.subscribe(values =>
      {
        if (this._ignoreValuesChange)
          return

        if (this.installCtrl.dirty) {
          this.setTemplateFromFirstPage(this.installCtrl.value)
          this.installCtrl.markAsPristine()
        }

        if (this.prodCtrl.dirty) {

          this.currentInstaller.productType = this.prodCtrl.value
          if (this.prodCtrl.value)
            this.setProductType(this.prodCtrl.value)

          this.prodCtrl.markAsPristine()
          this._save()
        }
      })

      this.installerImageFormGroup.valueChanges.subscribe(values =>
      {
        if (this._ignoreValuesChange)
          return

        if (this.wmImageCtrl.dirty) {

          this.wmImageCtrl.markAsPristine()

          let prevValue:string = this.currentInstaller.wmInstallerImage
          this.currentInstaller.wmInstallerImage = this.wmImageCtrl.value

          if (this.wmImageCtrl.value == 'Download')
            this.addUserPasswordControls()
          else if (this.wmImageCtrl.value != 'Download' && prevValue == 'Download')
            this.removeUserPasswordControls()

          this._save()
        }

        if (this.osTypeCtrl.dirty) {

          if (this.osTypeCtrl.value != "other")
            this.currentInstaller.sourceImageTag = this.osTypeCtrl.value + ":" + (this.osTypeVersionCtrl.value ? this.osTypeVersionCtrl.value : "latest")
          else
            this.currentInstaller.sourceImageTag = this.otherOsTypeCtrl.value + ":" + (this.osTypeVersionCtrl.value ? this.osTypeVersionCtrl.value : "latest")

          this.osTypeCtrl.markAsPristine()
          this._save()
        }

        if (this.otherOsTypeCtrl.dirty) {

          this.currentInstaller.sourceImageTag = this.otherOsTypeCtrl.value + ":" + (this.osTypeVersionCtrl.value ? this.osTypeVersionCtrl.value : "latest")

          this.otherOsTypeCtrl.markAsPristine()
          this._save()
        }

        if (this.osTypeVersionCtrl.dirty) {

          if (this.osTypeCtrl.value != "other")
            this.currentInstaller.sourceImageTag = this.osTypeCtrl.value + ":" + (this.osTypeVersionCtrl.value ? this.osTypeVersionCtrl.value : "latest")
          else
            this.currentInstaller.sourceImageTag = this.otherOsTypeCtrl.value + ":" + (this.osTypeVersionCtrl.value ? this.osTypeVersionCtrl.value : "latest")

          this.osTypeVersionCtrl.markAsPristine()
          this._save()
        }

        if (this.userCtrl.dirty) {
          this._ignoreValuesChange = true
          this.userUpdateCtrl.setValue(this.userCtrl.value)
          this.enableControl(this.userUpdateCtrl, false)
          this._ignoreValuesChange = false
        }

        if (this.targetRepoCtrl.dirty) {

          console.log("Setting target repo name")

          if (this.targetImageCtrl.value) {
            this.updateTargetImage()
          } else if (this.currentInstaller.targetImage) {
            this.currentInstaller.targetImage.setRepository(this.targetRepoCtrl.value)
          } else {
            this.currentInstaller.targetImage = new DockerImage()
            this.currentInstaller.targetImage.setRepository(this.targetRepoCtrl.value)
          }

          this._save()

          this.targetRepoCtrl.markAsPristine()
        } else if (this.targetImageCtrl.dirty) {

          // update version to next available version for selected

          console.log("Setting target image name")

          if (this.targetImageCtrl.value) {
                this.updateTargetImage()
                this._save()
          }

          this.targetImageCtrl.markAsPristine()

        } else if (this.targetVersionCtrl.dirty) {

          console.log("Setting target version")

          this.targetVersionCtrl.markAsPristine()

          if (DockerImage.isVersionNumber(this.targetVersionCtrl.value)) {
            this.currentInstaller.targetImage.setVersion(this.targetVersionCtrl.value)
            this._save()
          } else {
            this._setCtrlVersion(this.currentInstaller.targetImage.version())
          }
        } else if (this.dedicatedRepoCtrl.dirty) {

          this.dedicatedRepoCtrl.markAsPristine()

          this.currentInstaller.targetImage.setDedicatedRepository(this.dedicatedRepoCtrl.value)
          this._save()
        }
      })

      this.propertiesFormGroup.valueChanges.subscribe(values => {

        if ( this._ignoreValuesChange)
          return

        if (this.licCtrl.dirty) {
          this.setLicenseFile(this.licCtrl.value)
          this.licCtrl.markAsPending
          this._save()
        }

        if (this.portCtrl.dirty) {
          this.currentInstaller.primaryPort = this.portCtrl.value
          this.portCtrl.markAsPending
          this._save()
        }
      })

      this.summaryFormGroup.valueChanges.subscribe(values => {

        if ( this._ignoreValuesChange)
          return

        if (this.updateCtrl.dirty) {
          this.currentInstaller.includeUpdate = "" + this.updateCtrl.value

          if (this.updateCtrl.value) {
           this.addUpdateUserPasswordControls()
          } else {
            this.removeUpdateUserPasswordControls()
          }

          this.updateCtrl.markAsPristine()
          this._save()
        }

        if (this.downloadCtrl.dirty) {
          this.downloadCtrl.markAsPristine()
          this.downloadRef = null
        }
      })
	}

	private _filter(value: string): DockerImage[] {

	  console.log("value is " + value)

	  if (value == null || value.length == 0) {
	      return this.baseImages
    } else {
	      return this.baseImages.filter(option => option.name().toLowerCase().includes(value))
    }
  }

  public installationType(): string {

    if (this.currentInstaller && this.currentInstaller.productType != null) {
      return ContainerTemplates.productCodeLabel(this.currentInstaller.productType)
    } else {
      return "Installation Type"
    }
  }

  public productLabelForCode(code: string): string {

    let label: string = ContainerTemplates.productCodeLabel(code)

    if (label && this.productCodesVisible.indexOf(code) == -1)
      this.productCodesVisible.push(code)

    return label
  }

  public tabChanged(event: any) {

    if (this.isLinearStepper && event.previouslySelectedIndex == 2) {
    }
  }

  public templateEstablished(): boolean {

    return this._templateSetOnFirstPage
  }

	public isExistingTemplate(): boolean {

    return this._isTemplate
  }

  public addTemplate(event) {

    this._templateSetOnFirstPage = true
    this._isTemplate = true
    this.currentInstaller.name = this.installCtrl.value

    this._configService.uploadInstall(this.currentInstaller).subscribe((success) => {

      if (!this.installs)
        this.installs = []

      this.installs.push(this.currentInstaller.name)
    })

  }

  public deleteTemplate(event) {

    this._templateSetOnFirstPage = false
    this._isTemplate = false

    this._configService.deleteInstall(this.currentInstaller.name).subscribe((success) => {
        this.installs.splice(this.indexOfTemplate(this.currentInstaller.name), 1)
        this.currentInstaller = new Installer()
        this.installCtrl.setValue("", {onlySelf: true, emitEvent: false})
    })
  }

  public baseImageSelected(image: DockerImage) {

      if (image) {

        this.currentInstaller.targetImage = image.copy()

        this._save()
      }
  }

  public imageName(image: DockerImage) {

      if (image)
        return image.name()
      else
        return null
  }

  public wmImageFileAdded(response: any) {

    let filename:string = response.filename

    this._resources.resourcesForType("installer-images").subscribe((files) => {
        this.wmImages = []
        this.wmImages.push("Download")

        files.forEach((f) => {
          this.wmImages.push(f)

          if (f.filename == filename) {
            this.wmImageCtrl.setValue(f.name, {emitEvent: false})
          }
        })
      })
  }

  public licenseFileAdded(response: any) {

    let filename: string = response.filename

    this._resources.resourcesForType('licenses').subscribe((p) => {
          this.licenceFiles = []
           p.forEach((f) => {
            this.licenceFiles.push(f.name)

            if (f.filename == filename) {
              this.licCtrl.setValue(f.name, {emitEvent: false})
            }
          })
      })
  }

  public install() {

    this.isInstalling = true

    if (this.downloadCtrl.value) {
       // build on server

        let dialogRef = this._dialog.open(BuildExeComponent, {
          width: "80%",
          height: "80%",
          data: { installer: this.currentInstaller, comments: this.commentsCtrl.value, user: this.userCtrl.value, password: this.passwordCtrl.value, encryptedPassword: this.passwordEncryptedCtrl.value, archiveWmImage: this.keepWmImageCtrl.value},
        })

        dialogRef.afterClosed().subscribe(result => {
          this.isInstalling = false

          if (result) {

            if (this.keepWmImageCtrl.value) {
              this.currentInstaller.wmInstallerImage = result
            }

            this.currentInstaller.targetImage = this.currentInstaller.targetImage.copy()
            this._save()
            this._router.navigate(['/build'])
          }
        })
      } else {

        this._dockerService.downloadInstall(this.currentInstaller, this.commentsCtrl.value, this.userCtrl.value, this.passwordCtrl.value, this.passwordEncryptedCtrl.value).subscribe((ref) => {

          if (ref)
            this.downloadRef = ref
          else
            window.alert("Oops, download failed, refer to server log for more information!")

          this.isInstalling = false
        })
      }
  }

  public downloadNow(fileRef: string) {

        window.open("http://" + window.location.hostname +":5555/rad/jc.devops:api/docker/build/" + fileRef)
  }

  public labelForGoButton(): string {

    if (this.downloadCtrl.value)
      return "  Install   "
    else
      return "  Download  "
  }

  public labelForPreparingButton(): string {

    if (this.downloadCtrl.value)
      return "Installing..."
    else
      return "Preparing..."
  }

  public initialProperties(): any {

      return this.currentInstaller
  }

  public installerTemplateLoaded(template: Installer) {

	  this.portCtrl.setValue(this.currentInstaller.primaryPort)
	  this.updateTargetImageCtrl()
	  this.enableSagSpecificControls(template.isSAGProduct == "true")
	}

  public propertiesChangedInBuilder(type: string, displayableProperties: Map<string, BuilderProperties[]>, values: any) {

    if (displayableProperties) {
      let ref: BuildInstallComponent = this

      setTimeout(() => {
        ref.builderDisplayableProperties = displayableProperties
      })
    }

    if (values) {
      this._save()
    }
  }

  public saveTemplate() {

    this.currentInstaller.name = this.installerNameCtrl.value
    this._ignoreValuesChange = true
    this.installCtrl.setValue(this.currentInstaller.name)
    this._ignoreValuesChange = false

    this._isTemplate = true
    this._save(true)
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

  public propertiesFor(entry: string): BuilderProperties[] {

      return this.builderDisplayableProperties.get(entry)
  }

  public targetTag(): string {

      let tag: string = ""

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

          tag += ":" + (this.targetVersionCtrl.value ? this.targetVersionCtrl.value : "1")
        } else if (this.targetVersionCtrl.value) {

          tag += "-" + this.targetVersionCtrl.value
        }
      }

      return tag
  }

  public showHiddenCommands() {
	  this._showHiddenBuildCommands = !this._showHiddenBuildCommands

	  this._customBuilderComponent.refreshBuildCommands(this._showHiddenBuildCommands)
  }

  public showHideCommandAccent() {
	  if (!this._showHiddenBuildCommands)
	    return "gray"
	  else
	    return "accent"
  }

  public showHideCommandsLabel() {
	  if (!this._showHiddenBuildCommands)
	    return "Show Hidden Properties"
	  else
	    return "Hide Hidden Properties"
  }

  private _save(okay?: boolean) {

      if (!okay && !this._isTemplate)
        return

      if (!this.currentInstaller.name)
        return

      this._configService.uploadInstall(this.currentInstaller).subscribe((success) => {
        // do now't
      })
  }

  private setTemplateFromFirstPage(name: string) {

    this._templateSetOnFirstPage = true
    this.setTemplate(name)
  }

	private setTemplate(name: string) {

	    if (this.indexOfTemplate(name) != -1) {

        if (name) {

          // existing template, load it

          this._configService.install(name).subscribe((install) => {

            this.currentInstaller = install
            this.isLinearStepper = false
            this._isTemplate = true
            this.updateForms()
          })
        } else {

          this._isTemplate = false
      }
    }
    else {
    }
  }

  private updateForms() {

      this._ignoreValuesChange = true

      this.currentBaseImage = this.currentInstaller.targetImage

      this.installCtrl.setValue(this.currentInstaller.name)
      this.wmImageCtrl.setValue(this.currentInstaller.wmInstallerImage)

      if (this.currentInstaller.wmInstallerImage == 'Download')
        this.addUserPasswordControls()
      else
        this.removeUserPasswordControls()

      if (this.currentInstaller.targetImage.repository())
        this.targetRepoCtrl.setValue(this.repoNameWithoutImageName())

      if (this.targetRepoCtrl.value && this.targetRepoCtrl.value != "")
        this.dedicatedRepoCtrl.setValue(this.currentInstaller.targetImage.dedicatedRepository())
      else
        this.dedicatedRepoCtrl.setValue(true)

      this.updateTargetImageCtrl()

      this.prodCtrl.setValue(this.currentInstaller.productType)
      this.portCtrl.setValue(this.currentInstaller.primaryPort)

      if (this.currentInstaller.sourceImageTag) {
        let r: number = this.currentInstaller.sourceImageTag.lastIndexOf(":")

        if (r != -1) {
          let n: string = this.currentInstaller.sourceImageTag.substring(0, r)
          let v: string = this.currentInstaller.sourceImageTag.substring(r+1)

          this.osTypeCtrl.setValue(n)
          this.otherOsTypeCtrl.setValue(n)
          this.osTypeVersionCtrl.setValue(v)
        } else {
          this.osTypeCtrl.setValue(this.currentInstaller.sourceImageTag)
          this.otherOsTypeCtrl.setValue(this.currentInstaller.sourceImageTag)
        }
      }
      if (this.currentInstaller.licenseFile)
        this.licCtrl.setValue(this.currentInstaller.licenseFile.replace(/\-/g, " "))

      this.updateCtrl.setValue(this.currentInstaller.includeUpdate == "true" ? true : false)

      if (this.currentInstaller.includeUpdate == "true") {
        this.addUpdateUserPasswordControls()
      } else {
        this.removeUpdateUserPasswordControls()
      }

      this.installerNameCtrl.setValue(this.currentInstaller.name)

      if (this.currentInstaller.productType) {
        this.setProductType(this.currentInstaller.productType)
      }

      this._ignoreValuesChange = false
  }

  private updateTargetImageCtrl() {

    if (this.currentInstaller.targetImage.name()) {
        let img = this.imageFor(this.currentInstaller.targetImage.name())

        if (img == null) {
          img = DockerImage.build(this.currentInstaller.targetImage.repository(), this.currentInstaller.targetImage.name(), this.currentInstaller.targetImage.version(), this.dedicatedRepoCtrl.value)
        }

        this.targetImageCtrl.setValue(img)
        this.targetVersionCtrl.setValue(this.currentInstaller.targetImage.version())
        //this.updateTargetImage()
      }
  }

  private addUserPasswordControls() {

    this._ignoreValuesChange = true
    this.installerImageFormGroup.addControl("userCtrl", this.userCtrl)
    this.installerImageFormGroup.addControl("passwordCtrl", this.passwordCtrl)
    this._ignoreValuesChange = false

    let ref: BuildInstallComponent = this
    setTimeout(() => {
      ref.userCtrl.setValidators(Validators.required)
      ref.passwordCtrl.setValidators(Validators.required)
    }, 100)
  }

  private removeUserPasswordControls() {

    this._ignoreValuesChange = true
    this.installerImageFormGroup.removeControl("userCtrl")
    this.installerImageFormGroup.removeControl("passwordCtrl")

    this.enableControl(this.userUpdateCtrl, true)
    this._ignoreValuesChange = false

    let ref: BuildInstallComponent = this
    setTimeout(() => {
      ref.userCtrl.setValidators(null)
      ref.passwordCtrl.setValidators(null)
    }, 100)
  }

   private addUpdateUserPasswordControls() {

    this._ignoreValuesChange = true
    this.summaryFormGroup.addControl("userUpdateCtrl", this.userUpdateCtrl)
    this.summaryFormGroup.addControl("passwordEncryptedCtrl", this.passwordEncryptedCtrl)
    this._ignoreValuesChange = false

    let ref: BuildInstallComponent = this
    setTimeout(() => {
      ref.userUpdateCtrl.setValidators(Validators.required)
      ref.passwordEncryptedCtrl.setValidators(Validators.required)
    }, 100)
  }

  private removeUpdateUserPasswordControls() {

    this._ignoreValuesChange = true
    this.summaryFormGroup.removeControl("userUpdateCtrl")
    this.summaryFormGroup.removeControl("passwordEncryptedCtrl")
    this._ignoreValuesChange = false

    let ref: BuildInstallComponent = this
    setTimeout(() => {
      ref.userUpdateCtrl.setValidators(null)
      ref.passwordEncryptedCtrl.setValidators(null)
    }, 100)
  }

  private setProductType(type: string) {

    let componentFactory = null

    if (type.toLowerCase().startsWith('msr')) {

      if (!this.portCtrl.value) {
        this.portCtrl.setValue("5555")
        this.currentInstaller.primaryPort = "5555"
      }

      componentFactory = this.componentFactoryResolver.resolveComponentFactory(MicroServiceInstallerComponent)
    } else {
            componentFactory = this.componentFactoryResolver.resolveComponentFactory(InstallerComponent)
            this.currentInstaller.productType = type
    }

    if (this.builder) {
      let viewContainerRef = this.builder.viewContainerRef
      viewContainerRef.clear()

      let componentRef = viewContainerRef.createComponent(componentFactory)
      this._customBuilderComponent = <BuilderComponent> componentRef.instance

      this._customBuilderComponent.owner = this
      this._customBuilderComponent.formGroup = this.productPropertiesFormGroup
    }
   }

   private enableSagSpecificControls(active: boolean) {

	  if (active) {
	    this.wmImageCtrl.setValidators([Validators.required])
	    //this.licCtrl.setValidators([Validators.required])

    } else {
	    this.wmImageCtrl.clearValidators()
	    this.licCtrl.clearValidators()
    }

	  this.wmImageCtrl.updateValueAndValidity({emitEvent: false})
	  this.licCtrl.updateValueAndValidity({emitEvent: false})
   }

   private setLicenseFile(lic: string) {

	  this.currentInstaller.licenseFile = lic.replace(/\s/g, "-")
	  this._customBuilderComponent.setLicenseFile(lic)
	 }

   private updateTargetImage() {

      if (typeof this.targetImageCtrl.value == 'string') {

        // user manually entered name of image

          if (!this.targetRepoCtrl.value || this.targetRepoCtrl.value == "") {
            this.dedicatedRepoCtrl.setValue(true, {emitEvent: false})
          }

          console.log("Setting target image from string value " + this.targetImageCtrl.value)

          let img: DockerImage = this.imageFor(this.targetImageCtrl.value)

          if (img && (!this.targetRepoCtrl.value || this.targetRepoCtrl.value == img.repository())) {

            // existing referenced image
              this.currentInstaller.targetImage = DockerImage.make(img)
          }
          else {

              // build image from scratch

              //this.currentInstaller.targetImage = DockerImage.build(this.targetRepoCtrl.value, this.targetImageCtrl.value, this.targetVersionCtrl.value, this.dedicatedRepoCtrl.value)

              console.log("No referenced image, so setting from fresh")

              this.currentInstaller.targetImage = new DockerImage()
              this.currentInstaller.targetImage.setName(this.targetImageCtrl.value)
              this.currentInstaller.targetImage.setRepository(this.targetRepoCtrl.value)

              if (this.targetVersionCtrl.value) {
                this.currentInstaller.targetImage.setVersion(this.targetVersionCtrl.value)
              }
          }

      } else {

          console.log("Setting selected image " + this.targetImageCtrl.value.name)

          this.currentInstaller.targetImage = this.targetImageCtrl.value.copy()

          if (this.currentInstaller.targetImage) {

            this._ignoreValuesChange = true
            this.targetRepoCtrl.setValue(this.repoNameWithoutImageName(), {emitEvent: false})
            this.targetVersionCtrl.setValue(this.currentInstaller.targetImage.version(), {emitEvent: false})
            this.dedicatedRepoCtrl.setValue(this.currentInstaller.targetImage.dedicatedRepository(), {emitEvent: false})
            this._ignoreValuesChange = false
          }
      }

      this._dockerService.versions(this.currentInstaller.targetImage.uniqueName()).subscribe((images) => {

        if (images.length > 0) {

          let nextVersion: string = images[0].getNextVersion(VersionType.major)
          this._setCtrlVersion(nextVersion)
        } else if (this.targetVersionCtrl.value == "") {
          this._setCtrlVersion("1.0")
        }
      })
  }

  private _setCtrlVersion(value: string) {

      this._ignoreValuesChange = true

      this.targetVersionCtrl.setValue(value, {emitEvent: false})

      if (this.currentInstaller.targetImage) {
        this.currentInstaller.targetImage.setVersion(value)
      }

      this._ignoreValuesChange = false
  }

  private repoNameWithoutImageName(): string {

      let repo: string = this.currentInstaller.targetImage.repository()

      if (this.currentInstaller.targetImage.dedicatedRepository() && repo && this.currentInstaller.targetImage.name()) {

        repo = repo.substring(0, repo.indexOf(this.currentInstaller.targetImage.name())-1)
      }

      return repo
  }

  private imageFor(name: string) {

      var found: DockerImage = null

      for (var i=0; i < this.baseImages.length; i++) {
        if (this.baseImages[i].name() == name || this.baseImages[i].id == name) {
           found = this.baseImages[i]
           break
        }
      }

      return found
    }

  private indexOfTemplate(name): number {

    let found: number = -1

    if (this.installs) {

      for(var i = 0; i < this.installs.length; i++) {

        if (this.installs[i] == name) {
          found = i
          break
        }
      }
    }

    return found
  }

  private enableControl(control: FormControl, enable) {

    let ref: BuildInstallComponent = this

   // setTimeout(() => {
      ref._ignoreValuesChange = true
      if (enable) {
        if (control.disabled)
          control.enable()
      } else {
        if (control.enabled)
          control.disable()
      }
      ref._ignoreValuesChange = false
  //  }, 500)
  }
}
