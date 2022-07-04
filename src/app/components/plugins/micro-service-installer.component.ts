import {Component, OnInit} from '@angular/core'

import {FormControl, FormGroup} from '@angular/forms'

import {BuilderComponent, BuilderProperties, PropertiesChangedOwner} from '../elements/build-image-choose.directive'
import {ConfigurationService} from '../../services/configuration.service'
import {ResourceService} from '../../services/resources.service'
import {Installer} from '../../models/Installer'
import {BuildCommand} from '../../models/build'
import {DisplayType} from '../../models/display-type'

@Component({
  selector: 'jc-msc-install',
  templateUrl: '../../templates/plugins/msc-install.html'
})

export class MicroServiceInstallerComponent implements BuilderComponent, OnInit {

  public features: string[] = ["JDBC Adapter", "Monitoring"]

	public formGroup: FormGroup
	public owner: PropertiesChangedOwner

	public propsCtrl: FormControl

	public currentInstaller: Installer
	public propertyFiles: string[] = []
    public featuresCtrl: FormControl
    public addMysqlDriverCtrl: FormControl

	private _ignoreValuesChange: boolean

	public constructor(private _runSetsService: ConfigurationService, private _resources: ResourceService) {

		this.propertyFiles = []

		this._resources.resourcesForType("properties").subscribe((p) => {

      this.propertyFiles = []
      p.forEach((f) => {
        this.propertyFiles.push(f.name)
      })
    })
	}

	public ngOnInit() {

		this.currentInstaller = this.owner.initialProperties()

    this.setDefaults()

		let propsFiles: BuildCommand[] = this.currentInstaller.fileForType("properties")

		this.propsCtrl = new FormControl(propsFiles.length > 0 ? propsFiles[0].source.replace(/-/g, " ") : null)
    this.featuresCtrl = new FormControl(this.determineFeatureAddOn())
    this.addMysqlDriverCtrl = new FormControl(this.currentInstaller.fileForType("support", "mysql-connector-java-5.1.47.jar") != null)
    //this.addMysqlDriverCtrl = new FormControl(this.currentInstaller.fileForType("support", "mysql-connector-java-8.0.13.jar") != null)

		this.formGroup.addControl("propsCtrl", this.propsCtrl)
    this.formGroup.addControl("featuresCtrl", this.featuresCtrl)
    this.formGroup.addControl("addMysqlDriverCtrl", this.addMysqlDriverCtrl)

		if (propsFiles.length > 0 || this.featuresCtrl.value)
			this.flagChanges(propsFiles.length > 0 ? propsFiles[0].source : null, this.featuresCtrl ? this.featuresCtrl.value : null)

		this.formGroup.valueChanges.subscribe(values => {

    		if (this._ignoreValuesChange)
    			return

    		if (this.propsCtrl.dirty) {
          this.setPropertiesFile(this.propsCtrl.value)
          this.propsCtrl.markAsPristine()
    		}

        if (this.featuresCtrl.dirty) {

          if (this.featuresCtrl.value == "JDBC Adapter") {
            this.currentInstaller.productType = "msr-jdbc"
          } else if (this.featuresCtrl.value == "Monitoring") {
            this.currentInstaller.productType = "msr-monitor"
          } else {
            this.currentInstaller.productType = "msr"
          }

          this.featuresCtrl.markAsPristine()
        }

        if (this.addMysqlDriverCtrl.dirty) {

          this.setMysqlDriverFile(this.addMysqlDriverCtrl.value)
          this.setMysqlTypeFile(this.addMysqlDriverCtrl.value)

          this.addMysqlDriverCtrl.markAsPristine()
        }

        this.flagChanges(this.propsCtrl.value, this.featuresCtrl.value)
    	})
	}

  public setLicenseFile(license: string) {

    let files: BuildCommand[] = this.currentInstaller.fileWithDescription("licenses", "Product License")

      if (files.length == 0) {
          let file = new BuildCommand()
          file.commandType = "file"
          file.buildTarget = "install"
          file.description = "Product License"
          file.fileType = "licenses"
          file.description = "License file"
          file.target = "/software/license.xml"
          file.display = DisplayType.hidden

          //ensures that the build-components view gets updated
          this.currentInstaller.buildCommands = Object.assign([], this.currentInstaller.buildCommands)

          this.currentInstaller.buildCommands.push(file)

          files.push(file)
      }

      files[0].source = license.replace(/\s/g, "-")
  }

  public refreshBuildCommands(show: boolean) {

  }

	public downloadProperties(event) {

      let files: BuildCommand[] = this.currentInstaller.fileForType("properties")

      if (files.length > 0)
        this._resources.downloadResourceViaBrowser("properties", files[0].source)
    }

	public propertiesFileAdded(response: any) {

        let filename: string = response.filename

        this._resources.resourcesForType("properties").subscribe((p) => {

          this.propertyFiles = []
          p.forEach((f) => {
            this.propertyFiles.push(f.name)

            if (f.filename == filename) {
              this.propsCtrl.setValue(f.name)
            }
          })
        })
  }

  private setDefaults() {

      let touchdbs: BuildCommand[] = this.currentInstaller.fileForType("touchdb")

      if (touchdbs.length == 0) {
          let touchdb = new BuildCommand()
          this.currentInstaller.buildCommands.push(touchdb)
          touchdbs.push(touchdb)
      }

      touchdbs[0].commandType = "run"
      touchdbs[0].buildTarget = "build"
      touchdbs[0].fileType = "touchdb"
      touchdbs[0].target = "mkdir /opt/softwareag/IntegrationServer/db"

      let touchcaches: BuildCommand[] = this.currentInstaller.fileForType("touchcache")

      if (touchcaches.length == 0) {
        let touchcache = new BuildCommand()
        this.currentInstaller.buildCommands.push(touchcache)
        touchcaches.push(touchcache)
      }

      touchcaches[0].commandType = "run"
      touchcaches[0].buildTarget = "build"
      touchcaches[0].fileType = "touchcache"
      touchcaches[0].target = "mkdir /opt/softwareag/IntegrationServer/cache"

      let globs: BuildCommand[] = this.currentInstaller.fileWithDescription("build", "globalVars")

      if (globs.length == 0) {
        let glob = new BuildCommand()
        glob.commandType = "file"
        glob.buildTarget = "build"
        glob.fileType = "support"
        glob.description = "globalVars"
        glob.source = "globalVariables.cnf"
        glob.target = "/opt/softwareag/IntegrationServer/config"

        this.currentInstaller.buildCommands.push(glob)
      }
  }

  private setMysqlDriverFile(include: boolean) {

      let files: BuildCommand[] = this.currentInstaller.fileForType("support", "mysql-connector-java-5.1.47.jar")
      //let file: BuildCommand = this.currentInstaller.fileForType("support", "mysql-connector-java-8.0.13.jar")

      if (files.length == 0 && include) {

        // add if not already in list

        let file = new BuildCommand()
        file.commandType = "file"
        file.buildTarget = "build"
        file.fileType = "support"
        file.description = "mySQL JDBC Driver"
        file.source = "mysql-connector-java-5.1.47.jar"
        //file.source = "mysql-connector-java-8.0.13.jar"

        file.target = "/opt/softwareag/IntegrationServer/lib/jars"
        file.display = DisplayType.hidden

        this.currentInstaller.buildCommands.push(file)

      } else if (files.length > 0 && !include) {

        // remove

        this.currentInstaller.buildCommands.splice(this.currentInstaller.buildCommands.indexOf(files[0]), 1)
      }
  }

   private setMysqlTypeFile(include: boolean) {

      let files: BuildCommand[] = this.currentInstaller.fileForType("support", "MySQLTypeMapping.xml")

      if (files.length == 0 && include) {

        // add if not already in list

        let file = new BuildCommand()
        file.commandType = "file"
        file.buildTarget = "build"
        file.fileType = "support"
        file.description = "misspelled mysql type file"
        file.source = "MySQLTypeMapping.xml"
        file.target = "/opt/softwareag/IntegrationServer/packages/WmJDBCAdapter/config"
        file.display = DisplayType.hidden

        this.currentInstaller.buildCommands.push(file)

        file = new BuildCommand()
        file.commandType = "file"
        file.buildTarget = "build"
        file.fileType = "support"
        file.description = "mispelled mysql keyword file"
        file.source = "MySQLKeywords.xml"
        file.target = "/opt/softwareag/IntegrationServer/packages/WmJDBCAdapter/config/Keywords"
        file.display = DisplayType.hidden

        this.currentInstaller.buildCommands.push(file)

      } else if (files.length > 0 && !include) {

        // remove

        this.currentInstaller.buildCommands.splice(this.currentInstaller.buildCommands.indexOf(files[0]), 1)
      }
  }

  private setPropertiesFile(props: string) {

      let files: BuildCommand[] = this.currentInstaller.fileForType("properties")

      if (files.length == 0 && props) {

        // add if not already in list

        let file = new BuildCommand()
        file.commandType = "file"
        file.buildTarget = "build"
        file.fileType = "properties"
        file.description = "Micro Service Properties Field"
        file.target = "/opt/softwareag/IntegrationServer/application.properties"
        file.display = DisplayType.hidden

        //ensures that the build-components view gets updated
        this.currentInstaller.buildCommands = Object.assign([], this.currentInstaller.buildCommands)

        this.currentInstaller.buildCommands.push(file)

        files.push(file)

      } else if (files.length > 0 && !props) {

        // remove

        this.currentInstaller.buildCommands.splice(this.currentInstaller.buildCommands.indexOf(files[0]), 1)
      }

      if (props) {

        files[0].source = props.replace(/\s/g, "-")

        if (!files[0].target)
          files[0].target = "/opt/softwareag/IntegrationServer/application.properties"
      }
  }

	private flagChanges(propsFile: string, addons: string) {

		let features: Map<string, BuilderProperties[]> = new Map()

    if (propsFile)
		  features.set("Properties", [new BuilderProperties("File", [propsFile])])

    if (addons == 'JDBC Adapter')
      features.set("Adapters", [new BuilderProperties("Adapters", ["JDBC"])])
    else if (addons == 'Monitoring')
      features.set("Adapters", [new BuilderProperties("Adapters", ["Monitoring"])])

		this.owner.propertiesChangedInBuilder("msc", features, this.currentInstaller)
	}

  private determineFeatureAddOn(): string {

    if (this.currentInstaller.productType == "msr-jdbc")
      return "JDBC Adapter"
    else  if (this.currentInstaller.productType == "msr-monitor")
      return "Monitoring"
    else
      return null
  }
}
