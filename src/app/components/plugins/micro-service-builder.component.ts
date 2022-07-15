import {Component, OnInit} from '@angular/core'
import {Router} from '@angular/router'

import {FormControl, FormGroup} from '@angular/forms'

import {BuilderComponent, BuilderProperties, PropertiesChangedOwner} from '../elements/build-image-choose.directive'

import {APIDefinition} from '../../models/wm-package-info'
import {ConfigurationService} from '../../services/configuration.service'
import {ResourceService} from '../../services/resources.service'
import {until} from 'protractor';
import {BuildCommand, Builder, DeploymentSet} from '../../models/build';
import {DisplayType} from '../../models/display-type';

@Component({
  selector: 'jc-msc-configure',
  templateUrl: '../../templates/plugins/msc-configure.html'
})

export class MicroServiceBuilderComponent implements BuilderComponent, OnInit {

	public owner: PropertiesChangedOwner
	public formGroup: FormGroup

	public setsCtrl: FormControl
    public propsCtrl: FormControl
    public includeACLsCtrl: FormControl
    public atLeastOneDeploymentSetSelected: boolean
    public includeWmIOCtrl: FormControl

	public propertyFiles: string[] = []
    public deploymentSets: string[]

    public currentBuild: Builder

	public buildProperties: any[] = []

	private _ignoreValuesChange: boolean

	public constructor(private _router: Router, private _runSetsService: ConfigurationService, private _resources: ResourceService) {

		this.propertyFiles = []

		this._resources.resourcesForType("properties").subscribe((p) => {

            this.propertyFiles = []
            p.forEach((f) => {
              this.propertyFiles.push(f.name)
            })
        })

		this._runSetsService.deploymentSets().subscribe((d) => {
			this.deploymentSets = d
		})

		this.buildProperties.push({id: "1", name: "default", value: ""})
	}

	public ngOnInit() {

		this.currentBuild = this.owner.initialProperties()
        this._checkIfAtLeastOneDeploySetSelected()

	    let selected: string[] = []

	    if (this.currentBuild.deployments) {
		  	this.currentBuild.deployments.forEach((d) => {

				  selected.push(d.name)
				  this.setDeploymentDescriptionForOwner(d, new Map<string, BuilderProperties[]>())
		    })
	    }

		this.setsCtrl = new FormControl(selected)

		let propsFiles: BuildCommand[] = this.currentBuild.fileForType("properties")

		let propNames: string[] = []
        propsFiles.forEach((p) => {
            let n = p.source
            n = n.replace(/-/g, " ")
            propNames.push(n)
        })

		this.propsCtrl = new FormControl(propNames)

        let aclFiles: BuildCommand[] = this.currentBuild.fileForType("config", "acllist.cnf")
        let wmIOFiles: BuildCommand[] = this.currentBuild.fileForType("config","integrationlive")

        this.includeACLsCtrl = new FormControl(aclFiles.length > 0 ? true : false)
        this.includeWmIOCtrl = new FormControl(wmIOFiles.length > 0 ? true : false)

		this.formGroup.addControl("sets", this.setsCtrl)
		this.formGroup.addControl("propsCtrl", this.propsCtrl)
		this.formGroup.addControl("includeACLsCtrl", this.includeACLsCtrl)
        this.formGroup.addControl("includeWmIOCtrl", this.includeWmIOCtrl)

		this.formGroup.valueChanges.subscribe(values => {

    		if (this._ignoreValuesChange)
    			return

    		if (this.setsCtrl.dirty) {
    			this.firePropertiesChanged(this.setsCtrl.value)
    			this.setsCtrl.markAsPristine()

                let ref: MicroServiceBuilderComponent = this
                setTimeout(() => {
                    ref._checkIfAtLeastOneDeploySetSelected()
                    }, 100)
    		}

    		if (this.propsCtrl.dirty) {
                this.setPropertiesFile(this.propsCtrl.value)
    			this.firePropertiesChanged(this.setsCtrl.value)
                this.propsCtrl.markAsPristine()
    		}

    		if (this.includeACLsCtrl.dirty) {
          		this.setAclFiles(this.includeACLsCtrl.value)
                this.firePropertiesChanged(this.setsCtrl.value)
          		this.includeACLsCtrl.markAsPristine()
    		}

    		if (this.includeWmIOCtrl.dirty) {
                this.addCloudSettings(this.includeWmIOCtrl.value)
    		    this.includeWmIOCtrl.markAsPristine()
    		    this.firePropertiesChanged(this.setsCtrl.value)
            }
    	})
	}

  public setLicenseFile(license: string) {

    let files: BuildCommand[] = this.currentBuild.fileWithDescription("licenses", "Product Type")

      if (files.length == 0) {
        let file = new BuildCommand()
        file.commandType = "file"
        file.buildTarget = "build"
        file.fileType = "licenses"
        file.description = "Product License"

        if (this.currentBuild.sourceImage.type == 'is') {
          file.target = "/opt/softwareag/IntegrationServer/instances/default/config/licenseKey.xml"
        } else {
          file.target = "/opt/softwareag/IntegrationServer/config/licenseKey.xml"
        }

        file.display = DisplayType.hidden

        //ensures that the build-components view gets updated
        this.currentBuild.buildCommands = Object.assign([], this.currentBuild.buildCommands)
        this.currentBuild.buildCommands.push(file)

        files.push(file)
      }

      let file = files[0]
      file.source = license.replace(/\s/g, "-")
  }

  public haveSets(): boolean {

    return this.deploymentSets && this.deploymentSets.length > 0
  }

  public openPropertyEditor() {
    this._router.navigate(['/build/properties', {id: this.propsCtrl.value}])
  }

  public goSourcePage() {

    this._router.navigate(['/package'])
  }

  public downloadProperties(event) {

      let files: BuildCommand[] = this.currentBuild.fileForType("properties")

      files.forEach((f) => {
        this._resources.downloadResourceViaBrowser("properties", f.source)
      })
  }

  public propertiesFileAdded(response: any) {

      let filename: string = response.filename
      this._resources.resourcesForType("properties").subscribe((p) => {

          this.propertyFiles = []
          p.forEach((f) => {
            this.propertyFiles.push(f.name)

            if (f.filename == filename) {
              let lst = this.propsCtrl.value.push(f.name)

              this.propsCtrl.setValue(lst)
            }
          })

          this.setPropertiesFile(this.propsCtrl.value)
          this.firePropertiesChanged(this.setsCtrl.value)
        })
    }

	public packages(set: DeploymentSet): string[] {

        var packages: string[] = []

        set.source[0].repositories.forEach( (r) => {
            if (r.include != null && r.include.length > 0) {
                r.include.forEach((p) => {
                    packages.push(p)
                })
            } else {
                packages.push(r.name)
            }
        })

        return packages
	}

	public apis(set: DeploymentSet): APIDefinition[] {

		return set.apis
	}

  private _checkIfAtLeastOneDeploySetSelected() {

      if (this.currentBuild) {

        this.atLeastOneDeploymentSetSelected = this.currentBuild.deployments && this.currentBuild.deployments.length > 0
      } else {
        this.atLeastOneDeploymentSetSelected = false
      }
  }

  private addCloudSettings(include: boolean) {

        this.currentBuild.buildCommands = Object.assign([], this.currentBuild.buildCommands)

        let files: BuildCommand[] = this.currentBuild.fileForType("config", "integrationlive")

	    if (files.length == 0 && include) {

            let file = new BuildCommand()

            file.commandType = "file"
            file.buildTarget = "build"
            file.fileType = "config"
            file.description = "webmethods.io"
            file.source = "integrationlive"

            if (this.currentBuild.sourceImage.type == 'is') {
              file.target = "/opt/softwareag/IntegrationServer/instances/default/config/integrationlive"
            } else {
              file.target = "/opt/softwareag/IntegrationServer/config/integrationlive"
            }

            file.display = DisplayType.hidden
            this.currentBuild.buildCommands.push(file)

        } else if (!include) {
          this.currentBuild.buildCommands.splice(this.currentBuild.buildCommands.indexOf(files[0]), 1)
        }
    }

	private setPropertiesFile(props: string[]) {

        this.currentBuild.buildCommands = Object.assign([], this.currentBuild.buildCommands)

        // first remove all existing properties

        let removeIndex: number = -1
        do {
            removeIndex = -1
            let i: number = 0
            for (let command of this.currentBuild.buildCommands) {
                if (command.fileType === 'properties') {
                    removeIndex = i
                    break
                }

                i += 1
            }

            if (removeIndex != -1) {
                this.currentBuild.buildCommands.splice(removeIndex, 1)
            }
        } while (removeIndex != -1)

        // add back all selected property files

        props.forEach((p) => {
            let file = new BuildCommand()
            file.commandType = "file"
            file.fileType = "properties"
            file.description = "Micro Service Properties Field"
            file.display = DisplayType.hidden

            file.source = p.replace(/\s/g, "-")

            if (this.currentBuild.sourceImage.type == 'is') {

                if (file.source.startsWith('_')) {
                    let envName = file.source.substring(1, file.source.lastIndexOf("_"))
                    file.target = "/opt/softwareag/IntegrationServer/instances/default/env/" + envName + "/application.properties"
                } else {
                    file.target = "/opt/softwareag/IntegrationServer/instances/default/application.properties"
                }
            } else {
                if (file.source.startsWith('_')) {
                    let envName = file.source.substring(1, file.source.lastIndexOf("_"))
                    file.target = "/opt/softwareag/IntegrationServer/env/" + envName + "/application.properties"
                } else {
                    file.target = "/opt/softwareag/IntegrationServer/application.properties"
                }
            }

        //ensures that the build-components view gets updated
            this.currentBuild.buildCommands = Object.assign([], this.currentBuild.buildCommands)
            this.currentBuild.buildCommands.push(file)
      })
    }

    private setAclFiles(set: boolean) {

      //ensures that the build-components view gets updated
      this.currentBuild.buildCommands = Object.assign([], this.currentBuild.buildCommands)

      let acls: BuildCommand[] = this.currentBuild.fileForType("config", "acllist.cnf")

      if (set && acls.length == 0) {
          // add

          let acl = new BuildCommand()
          acl.buildTarget = "build"
          acl.commandType = "file"
          acl.fileType = "config"
          acl.description = "ACL Definitions to be merged"
          acl.source = "acllist.cnf"
          acl.target = "/tmp"
          acl.display = DisplayType.hidden

          this.currentBuild.buildCommands.push(acl)

          let sm: BuildCommand = new BuildCommand()
          sm.buildTarget = "build"
          sm.commandType = "file"
          sm.fileType = "config"
          sm.description = "ACL mappings to be merged"
          sm.source = "aclmap_sm.cnf"
          sm.target = "/tmp"
          sm.display = DisplayType.hidden

          this.currentBuild.buildCommands.push(sm)

          let xss: BuildCommand = new BuildCommand()
          xss.commandType = "file"
          xss.buildTarget = "build"
          xss.fileType = "support"
          xss.description = "script to merge acllist.cnf and aclmap_sm.cnf"
          xss.source = "merge-values.sh"
          xss.target = "/tmp"
          xss.display = DisplayType.hidden
          this.currentBuild.buildCommands.push(xss)

          let xr: BuildCommand = new BuildCommand()
          xr.commandType = "run"
          xr.buildTarget = "build"
          xr.description = "merge for acl services assignments"
          xr.source = "merge acls"
          xr.target = "/tmp/merge-values.sh acllist.cnf aclmap_sm.cnf"
          xr.display = DisplayType.hidden

          this.currentBuild.buildCommands.push(xr)

          acls.push(acl)

      } else if (!set && acls.length != 0) {
        //  remove

        this.currentBuild.removeFileForType("config", "acllist.cnf")
        this.currentBuild.removeFileForType("config", "aclmap_sm.cnf")

        this.currentBuild.removeFileForType("support", "merge-values.sh")
        this.currentBuild.removeFileForType(null, "merge acls")
      }
    }

	private firePropertiesChanged(sets: string[]) {

	  let props: Map<string, BuilderProperties[]> = new Map()

		let selectedSets: DeploymentSet[] = []

		sets.forEach((s) => {

			this._runSetsService.deploymentSet(s).subscribe((d) => {

                if (this.currentBuild.sourceImage.type == 'is') {
                    d.source[0].targetDir = "/opt/softwareag/IntegrationServer/instances/default/packages"
                } else {
                    d.source[0].targetDir = "/opt/softwareag/IntegrationServer/packages"
                }

                selectedSets.push(d)
                this.setDeploymentDescriptionForOwner(d, props, selectedSets)
			})
		})

		this.currentBuild.deployments = selectedSets
	}

	private setDeploymentDescriptionForOwner(d: DeploymentSet, props: Map<string, BuilderProperties[]>, selectedSets?: any) {

		let l: BuilderProperties[] = []
		let ref: string[] = []

		if (d.source && d.source[0].repositories) {
            d.source[0].repositories.forEach((r) => {

                if (r.include != null && r.include.length > 1) {

                    r.include.forEach((s) => {
                        ref.push(s)
                    })
                } else {
                    ref.push(r.name)
                }
            })
		}

		let apis: string[] = []

		if (d.apis) {
			d.apis.forEach((a) => {
				apis.push(a.name)
			})
		}

		l.push(new BuilderProperties("Contains", ref))
		l.push(new BuilderProperties("APIS", apis))

		props.set("Deployment Set - " + d.name, l)

		this.owner.propertiesChangedInBuilder("msc", props, this.currentBuild)
	}

    refreshBuildCommands(show: boolean) {
  }
}
