import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core'
import {FormBuilder, FormControl, FormGroup} from '@angular/forms'

import {MatTable} from '@angular/material/table'

import { BuildCommand } from '../models/build'
import { DisplayType } from '../models/display-type'

import { ResourceService } from '../services/resources.service'

import * as $ from 'jquery'


@Component({
  selector: 'build-commands',
  templateUrl: '../templates/build-commands.html'
})

export class BuildCommandsComponent implements OnInit, OnChanges {

	@Input()
	public form: FormGroup

	@Input()
	public reference: string

	@Input()
	public commands: BuildCommand[]

	@Input()
	public showHiddenOption: boolean = true

	@Input()
	public edit: boolean

	@Output()
	public commandsChanged: EventEmitter<BuildCommand[]> = new EventEmitter()

	public showHiddenCommands: boolean = false

	public _displayedArgColumnsEdit: string[] = ["cmdEdit", "typeEdit", "srcEdit", "srcEditUpload", "tgtEdit", "descriptionEdit", 'move', "remove"]
	public _displayedArgColumnsEditMin: string[] = ["cmdEdit", "typeEdit", "srcEdit", "srcEditUpload", "tgtEdit"]

	public _displayedArgColumnsReadOnly: string[] = ["cmd", "src", "srcEditUpload", "tgt", "description", "srcDownload"]
	public _displayedArgColumnsReadOnlyMin: string[] = ["cmd", "src", "srcDownload"]

	public commandTypes = ["copy", "add", "run", "entrypoint"]
	public fileTypes = ["licenses", "properties", "source", "config", "resource"]

	public editMode: boolean = false

	public resourceFiles: string[]
	public licenseFiles: string[]
	public propertyFiles: string[]

	private _panelStatus: Map<string,boolean>
	private _ignoreChanges: boolean = false
	private _hasChanged: boolean = false

	@ViewChild('commandsTable', {read: MatTable}) table: MatTable<BuildCommand>

	public constructor(private _formBuilder: FormBuilder,  private _resources: ResourceService) {

		this.form = _formBuilder.group({})

		this.resourceFiles = []
		this.licenseFiles = []
		this.propertyFiles = []

		this._resources.resourcesForType("other").subscribe((p) => {

          this.resourceFiles = []
          p.forEach((f) => {
            this.resourceFiles.push(f.filename)
          })
		})

		this._resources.resourcesForType("properties").subscribe((p) => {

          this.propertyFiles = []
          p.forEach((f) => {
            this.propertyFiles.push(f.name.replace(/\s+/g, "-"))
          })
		})

		this._resources.resourcesForType("licenses").subscribe((p) => {

          this.licenseFiles = []
          p.forEach((f) => {
            this.licenseFiles.push(f.name.replace(/\s+/g, "-"))
          })
		})
	}

	public ngOnInit() {

		if (this.edit != null) {
			this.editMode = this.edit
		}

		this._panelStatus = new Map()
	}

	public ngOnChanges() {

		if (this.edit != null) {
			this.editMode = this.edit
		}
	}

	public toggleShowHideCommands() {
		this.showHiddenCommands = !this.showHiddenCommands
	}

	public filteredCommands(): BuildCommand[] {

		if (this.showHiddenCommands) {
			return this.commands
		} else {

			let fc: BuildCommand[] = []

			this.commands.forEach((c) => {
				if (c.display != DisplayType.hidden) {
					fc.push(c)
				}
			})

			return fc
		}
	}

	public flagChanges() {

		this._hasChanged = true
		this.commandsChanged.emit(this.commands)
	}

	public displayedColumns() {

		 let wide: boolean = false

      if ($('#commands-table').width() > 950)
        wide = true

	    if (this.editMode) {
	    	return wide ? this._displayedArgColumnsEdit : this._displayedArgColumnsEditMin
	    } else {
	    	return wide ? this._displayedArgColumnsReadOnly : this._displayedArgColumnsReadOnlyMin
	    }
	}

	public flagEdit(event: any) {

		this.editMode = !this.editMode

		event.stopPropagation()
	}

	public sourceWithoutReference(name: string): string {
		if (this.reference && name.startsWith(this.reference)) {
			return name.substring(this.reference.length+1)
		} else {
			return name
		}
	}
	public availableFiles(command: BuildCommand): string[] {

		if (command.fileType == 'resource') {

			if (command.source && this.resourceFiles.indexOf(command.source) == -1) {
				let r: string[] = [command.source].concat(this.resourceFiles)

				return r
			} else {
				return this.resourceFiles
			}
		} else if (command.fileType == 'properties') {
			return this.propertyFiles
		} else  {
			return this.licenseFiles
		}
	}

	public styleForSourceOption(command: BuildCommand): any {

		if (this.isFileMissing(command)) {
			return {color: "red"}
		} else {
			return {}
		}
	}

	public styleForDownloadButton(command: BuildCommand): any {

		if (this.isFileMissing(command)) {
			return {'background-color': 'lightgray', 'color': 'gray'}
		} else {
			return {'background-color': 'lightblue', 'color': 'white'}
		}
	}
	public isFileMissing(command: BuildCommand): any {

		if (command.fileType == 'resource') {
			if (command.source) {
				return this.resourceFiles.indexOf(this.resourceFileName(command.source)) === -1

			} else {
				return true
			}
		} else {
			return false
		}
	}

	public elementType(type: string): string {

		if (type == "resource")
			return "other"
		else
			return type
	}

	public downloadFile(type: string, name: string) {

		console.log("type is " + type + ", and " + this.reference)

		if (type == 'other') {
			name = this.resourceFileName(name)
		}

		this._resources.downloadResourceViaBrowser(type, name)
	}

	public fileUploaded(element: BuildCommand, response: any) {

		let filename = response.filename
		let fileList: string[]

    // update appropriate list with new file

		if (element.fileType == 'resource') {
			fileList = this.resourceFiles
		} else if (element.fileType == 'properties') {
			fileList = this.propertyFiles
		} else  {
			fileList = this.licenseFiles
		}

		// does it already exist, i.e. did we replace existing file

		let matched: number = -1
		for (var i = 0; i < fileList.length; i++) {

			if (fileList[i].endsWith(filename)) {
				matched = i
				break
			}
		}

		// no, it's new add it to the end of the list

		if (matched === -1) {
			matched = fileList.length
			fileList.push(filename.substring(filename.lastIndexOf("/")+1))
		}

		// force control to uploaded value

		if (this.edit) {
			element.source = fileList[matched]
			let ctrl: FormControl = this.controlForPanelElement("source", element, fileList[matched])

			if (ctrl)
				ctrl.setValue(fileList[matched])
		}

		this.table.renderRows()

		this.flagChanges()
	}

	public resourceFileName(filename: string): string {

		const index = filename.lastIndexOf("/")

		if (index != -1) {
			filename = filename.substring(index+1)
		}

		if (this.reference && !filename.startsWith(this.reference)) {
			filename = this.reference + "-" + filename
		}

		console.log("filename is " + filename)

		return filename
	}

	public commandTypeChanged(element: any) {

		this.updateElementWithControlValue("commandType", element)

		this.table.renderRows()
	}

	public fileTypeChanged(element: any) {

		this.updateElementWithControlValue("fileType", element)

		this.table.renderRows()
	}

	public addRow(event: any) {

		let arg: BuildCommand = new BuildCommand()
		arg.commandType = "file"
		arg.fileType = "resource"

		this.commands.push(arg)
		this.table.renderRows()

		event.stopPropagation()
	}

	public removeRow(element: BuildCommand) {

		let found = -1

		for (let i=0; i < this.commands.length; i++) {

			if (this.commands[i] == element) {
				found = i
			}
		}

		if (found != -1) {
			this.form.removeControl("fileType:" + found)
		  	this.form.removeControl("commandType:" + found)
		  	this.form.removeControl("source:" + found)
      		this.form.removeControl("target:" + found)
      		this.form.removeControl("description:" + found)

			this.commands.splice(found, 1)
			this.table.renderRows()

			this.flagChanges()
		}
	}

	public moveUp(command: BuildCommand) {

		// find position of current row

		let found = -1

		for (let i=0; i < this.commands.length; i++) {

			if (this.commands[i] == command) {
				found = i
			}
		}

		if (found != -1 && found > 0) {

			this.commands.splice(found, 1)
			this.commands.splice(found - 1, 0, command)

			this.table.renderRows()
			this.flagChanges()
		}
	}

	public moveDown(command: BuildCommand) {

		// find position of current row

		let found = -1

		for (let i=0; i < this.commands.length; i++) {

			if (this.commands[i] == command) {
				found = i
			}
		}

		if (found != -1 && found < this.commands.length) {

			this.commands.splice(found, 1)
			this.commands.splice(found + 1, 0, command)

			this.table.renderRows()
			this.flagChanges()
		}
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

	public controlForPanelElement(key: string, element: any, value: string): FormControl {

		let ctrl: FormControl = null

		if (!element.position)
			element.position = this.indexOfElement(element)

		let name: string = key + ":" + element.position

		if (this.form.controls[name]) {
			ctrl = <FormControl> this.form.controls[name]

			if (this._ignoreChanges && value) {
				if (this.reference) {
					ctrl.setValue(this.reference + "-" + value)
				} else {
					ctrl.setValue(value)
				}
			}
		} else {
			ctrl = new FormControl(value)
			this.form.addControl(name, ctrl)
		}

		return ctrl
	}

	private indexOfElement(element: any): number {

		let list: any[] = this.commands
		var found: number = 0

		for (var i = 0; i < list.length; i++) {

			if (list[i] == element) {
				found = i
				break
			}
		}

		return found
	}
}
