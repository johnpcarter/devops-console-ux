import {Component, OnInit, ViewChild} from '@angular/core'

import {combineLatest} from 'rxjs'
import {FormControl, FormGroup, Validators} from '@angular/forms'

import {MatTable} from '@angular/material/table'

import {BuilderComponent, BuilderProperties, PropertiesChangedOwner} from '../elements/build-image-choose.directive'

import {ConfigurationService} from '../../services/configuration.service'
import {ResourceService} from '../../services/resources.service'
import {Installer} from '../../models/Installer';
import {BuildCommand} from '../../models/build';
import {ArgDisplayType, DisplayType} from '../../models/display-type';
import {Arg} from '../../models/container';

@Component({
  selector: 'jc-install',
  templateUrl: '../../templates/plugins/jc-install.html'
})

export class InstallerComponent implements BuilderComponent, OnInit {

    public formGroup: FormGroup
    public owner: PropertiesChangedOwner

    public install: Installer

    public commandTypes = ["file", "run"]

    public formLabels: string[] = ["description", "source", "target"]

    public args: any[] = []
    public buildCommands: BuildCommand[] = []

    private _allCommands: BuildCommand[] = []
    private _allArgs: Map<string, string> = new Map()
    private _displayTypes: Map<string, ArgDisplayType> = new Map()
    private _files: Map<string, string[]> = new Map()

    private _showHidden: boolean
    private _ignoreChanges: boolean = false

    @ViewChild('commandsTable', {read: MatTable}) commandsTable: MatTable<Arg>

    public constructor(private _configService: ConfigurationService, private _resources: ResourceService) {

      this._resources.resourcesForType("other").subscribe((p) => {

          let files: string[] = []
          p.forEach((f) => {
            files.push(f.filename)
          })

          this._files.set("resources", files)
      })

      this._resources.resourcesForType("properties").subscribe((p) => {

          let files: string[] = []
            p.forEach((f) => {
              files.push(f.name.replace(/\s+/g, "-"))
            })

            this._files.set("properties", files)
      })

      this._resources.resourcesForType("licenses").subscribe((p) => {

            let files: string[] = []
            p.forEach((f) => {
              files.push(f.name.replace(/\s+/g, "-"))
            })

            this._files.set("licenses", files)
      })

       this._resources.resourcesForType("product").subscribe((p) => {

            let files: string[] = []
            p.forEach((f) => {
              files.push(f.filename)
            })

            this._files.set("product", files)
       })

       this._resources.resourcesForType("resources").subscribe((p) => {

            let files: string[] = []

            if (p) {
              p.forEach((f) => {
                files.push(f.filename)
              })
            }

            this._files.set("resources", files)
       })
    }

    public ngOnInit(): void {

      this.install = this.owner.initialProperties()

      combineLatest(this._configService.installTemplate(this.install.productType),
                               this._configService.displayTypes()).subscribe(([r, t]) => {

          // merge template with install

          this.mergeInstallTemplate(r, t)

          this.owner.installerTemplateLoaded(r)

          this.flagChanges()
        }
      )
    }

    public setLicenseFile(license: string) {

      let files: BuildCommand[] = this.install.fileWithDescription("licenses", "Product License")

      if (files.length == 0) {
          let file = new BuildCommand()
          file.description = "Product License"
          file.commandType = "file"
          file.buildTarget = "install"
          file.fileType = "licenses"
          file.target = "/software/licenseKey.xml"
          file.display = DisplayType.hidden

          //ensures that the build-components view gets updated
          this.install.buildCommands = Object.assign([], this.install.buildCommands)
          this.install.buildCommands.push(file)

          files.push(file)

          this.refreshBuildCommands(false)
      }

      let file = files[0]

      file.source = license.replace(/\s/g, "-")

      // check other phases too

      this.install.buildCommands.forEach((b) => {
        if (b.fileType == 'licenses' && b.buildTarget != 'install') {
          b.source = file.source
        }
      })
    }

    public downloadFile(type: string, name: string) {

		  this._resources.downloadResourceViaBrowser(type, name)
	  }

	  public isEditable(command: BuildCommand): boolean {

        return command.display == DisplayType.editable
    }

    public availableFiles(type: string): string[] {

		  return this._files.get(type)
	  }

	  public fileUploaded(element: BuildCommand, filename: string) {

      let fileList: string[] = this._files.get(element.fileType)

      let matched: number = -1

      for (let i = 0; i < fileList.length; i++) {

        if (fileList[i].endsWith(filename)) {
          matched = i
          break
        }
      }

      if (matched == -1) {
        matched = fileList.length
        fileList.push(filename.substring(filename.lastIndexOf("/")+1))
      }

      element.source = fileList[matched]
      let ctrl: FormControl = this.controlForPanelElement("source", element, fileList[matched])

      if (ctrl)
        ctrl.setValue(fileList[matched])

      this.flagChanges()
	  }

	  public refreshArgs(show: boolean) {

      this.args = this._args(show)
    }

	  private _args(show: boolean): any[] {

      let args: any[] = []

      this._allArgs.forEach((v, k)=> {

          if (this._isRequired(k)) {

            let ctrl: FormControl = null
            let value = this.install.args.get(k) || v

            // only add control if valid combination

            if ((value != null && value.length > 0) || (this.displayInfo(k).display != DisplayType.hidden && this.displayInfo(k).display != DisplayType.readonly)) {
              if (!this.formGroup.contains(k)) {
                ctrl = new FormControl(this.translateValueForDropDown(value), this.displayInfo(k).required ? Validators.required : null)
                this.formGroup.addControl(k, ctrl)
              } else {
                ctrl = <FormControl>this.formGroup.controls[k]
              }

              args.push({label: k, control: ctrl})
              this.install.args.set(k, value)
            }
          } else if (this.formGroup.contains(k)) {
            this.formGroup.removeControl(k)
            this.install.args.delete(k)
          }
       })

      return args
    }

    private translateValueForDropDown(v: string): string {

       let value: string = null

       if (typeof v == 'boolean')
         value = v ? "yes" : "no"
       else if (v == "true" || v == "false")
         value = v == "true" ? "yes" : "no"
       else
         value = v

       return value
    }

    public refreshBuildCommands(show: boolean) {

      this._showHidden = show

      this.refreshArgs(this._showHidden)

      this._buildCommands(show)

      this.buildCommands = []
      this.install.buildCommands.forEach((b) => {
        if (show || b.display != DisplayType.hidden)
          this.buildCommands.push(b)
      })

      if (this.commandsTable)
        this.commandsTable.renderRows()
    }

    private _buildCommands(show: boolean) {

      this._allCommands.forEach((b) => {

        if (b.matchConditions(this.install.args)) {
          this._updateBuildCommand(b)
        } else {
          this._removeBuildCommand(b)
        }
      })
    }

    public updatedArgValue(arg: any) {

      if (arg.control.value == 'yes' || arg.control.value == 'no')
        this.install.args.set(arg.label, "" + (arg.control.value == "yes"))
      else
        this.install.args.set(arg.label, arg.control.value)

      this.refreshBuildCommands(this._showHidden)

      this.flagChanges()
    }

    public commandTypeChanged(element: any) {

		  this.updateElementWithControlValue("commandType", element)

		  //this.table.renderRows()
      this.flagChanges()
	  }

    public updateElementWithControlValue(key: string, element: any) {

		if (this._ignoreChanges)
			return

		element[key] = this.controlForPanelElement(key, element,  null).value

		if (key == "commandType") {
			if (element.commandType == "run")
				element.fileType = null
			else
				element.fileType = "resource"
		}

		this.flagChanges()
	}

  public displayType(name: string): string {
      let d: ArgDisplayType = this.displayInfo(name)

      if (d.display == DisplayType.editable)
        return "text"
      else
        return d.display.toString()
  }

	private _isRequired(name: string): boolean {

      return this.displayInfo(name).matchConditions(this.install.args)
  }

  public displayInfo(name: string): ArgDisplayType {

      let d: ArgDisplayType = this._displayTypes.get(name)

      if (!d)
        d = new ArgDisplayType(name)

      return d
  }

	public controlForPanelElement(key: string, element: any, value: string): FormControl {

		let ctrl: FormControl = null

		if (!element.position)
			element.position = this.indexOfElement(element)

		let name: string = key + ":" + element.position

		if (this.formGroup.controls[name]) {
			ctrl = <FormControl> this.formGroup.controls[name]

			if (this._ignoreChanges)
				ctrl.setValue(value)
		} else {
			ctrl = new FormControl(value, element.required ? Validators.required : null)
			this.formGroup.addControl(name, ctrl)
		}

		return ctrl
	}

	private _updateBuildCommand(b: BuildCommand) {

      let x: BuildCommand = null
      let i: number = 0
      while(x == null && i < this.install.buildCommands.length) {
        if (this.install.buildCommands[i].equals(b))
          x = this.install.buildCommands[i]

        i+= 1
      }

      if (x) {
        // do nowt

      } else {
        this.install.buildCommands.push(b)
      }
    }

    private _removeBuildCommand(b: BuildCommand) {

      let x: number = -1
      let i: number = 0
      while(x == -1 && i < this.install.buildCommands.length) {
        if (this.install.buildCommands[i].equals(b))
          x = i

        i+= 1
      }

      if (x != -1) {
        this.install.buildCommands.splice(x, 1)

      }
    }

	  private mergeInstallTemplate(r: Installer, types: ArgDisplayType[]) {

      this._allCommands = r.buildCommands

      if (!r.args || r.args.size > 0) {
        this._allArgs = r.args

        this._displayTypes.clear()
        types.forEach((a) => {

          if (a.display == DisplayType.yesno) {
            a = a.copy()
            a.display = DisplayType.dropdown
            a.choices = ["yes", "no"]

            this._displayTypes.set(a.name, a)
          } else {
            this._displayTypes.set(a.name, a)
          }
        })
     }

     if (r.primaryPort)
        this.install.primaryPort = r.primaryPort

      this.install.isSAGProduct = r.isSAGProduct

      if (r.entryPoint)
        this.install.entryPoint = r.entryPoint

      if (r.exitPoint)
        this.install.exitPoint = r.exitPoint

      if (r.healthCheck)
        this.install.healthCheck = r.healthCheck

       if (r.hostName)
        this.install.hostName = r.hostName

       if ((!this.install.sourceImageTag || this.install.sourceImageTag == "centos:latest") && r.sourceImageTag)
        this.install.sourceImageTag = r.sourceImageTag

      if (r.targetImage && !this.install.targetImage.tag())
        this.install.targetImage = r.targetImage

      // configure installer UI based on template & install

      this.refreshBuildCommands(this._showHidden)

      // remove build commands that don't belong

      for (let i=0; i < this.install.buildCommands.length; i++) {

        if (this.install.buildCommands[i].description != "Product License" && !this.matchBuild(this.install.buildCommands[i])) {
          this.install.buildCommands.splice(i, 1)
          i = -1; // reset loop counter
        }
      }
  }

	private flagChanges() {

		let features: Map<string, BuilderProperties[]> = new Map()

		let cmds: BuilderProperties[] = []
		let props: BuilderProperties[] = []

		let i:number = 0

		this.install.args.forEach((v, k) => {
		  if (this.displayInfo(k).display != DisplayType.hidden) {
		    if (v && i++ < 5)
		      props.push(new BuilderProperties("", [k, v]))
      }
    })

		i = 0
		this.install.buildCommands.forEach((b) => {
		  if (b.display == DisplayType.editable) {
		    if (b.source && i++ < 5)
		      cmds.push(new BuilderProperties("", [b.description, b.source]))
      }
    })

		features.set("Properties", props)
		features.set("commands", cmds)

		this.owner.propertiesChangedInBuilder(this.install.name, features, this.install)
	}

	private matchBuild(b: BuildCommand): boolean {

      let found: boolean = false

      for (let i = 0; i < this._allCommands.length; i++)  {
        if (this._allCommands[i].equals(b)) {
          found = true
          break
        }
      }

      return found
  }

	private indexOfElement(element: any): number {

		var found: number = -1

		for (let i = 0; i < this.install.buildCommands.length; i++) {

			if (this.install.buildCommands[i] == element || this.install.buildCommands[i].description === element) {
				found = i
				break
			}
		}

		return found
	}
}
