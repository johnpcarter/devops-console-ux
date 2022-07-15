import { Component, EventEmitter, Input, OnInit,
				Output, ViewChild } 				from '@angular/core'
import { FormBuilder, FormControl, FormGroup } 		from '@angular/forms'

import { MatTable } 								from '@angular/material/table'

import { ResourceService } 							from '../services/resources.service'
import { Property, PropertyValueType } 				from '../models/properties'

import { MatDialog } 								from '@angular/material/dialog'
import { ComboBoxComponent } 						from './elements/combo-box.component'

@Component({
  selector: 'jc-build-properties-table',
  templateUrl: '../templates/build-properties-table.html'
})

export class BuildPropertiesTableComponent implements OnInit {

	public form: FormGroup

	@Input()
	public prefixForKey: string

	@Input()
	public postfixForKey: string

	@Input()
	public properties: Property[]

	@Input()
	public availableKeys: string[]

	@Input()
	public readOnlyKey: boolean = false

	@Input()
	public allowDots: boolean = true

	@Output()
	public propertiesChanges: EventEmitter<Property[]> = new EventEmitter()

	public displayedColumns: string[] = ["key", "type", "value", "move", "remove"]

	public prefixForKeyBrief: string

	@ViewChild('propertiesTable', {read: MatTable})
	public table: MatTable<Property>

	//private _didReplaceDots: Set<String> = new Set()

	public constructor(private _formBuilder: FormBuilder,  private _resources: ResourceService, private _dialog: MatDialog) {

		this.form = this._formBuilder.group({})
	}

	public ngOnInit() {

		if (this.prefixForKey && this.prefixForKey.length > 15) {
			this.prefixForKeyBrief = this.prefixForKey.substring(0, 14) + "..."
		} else {
			this.prefixForKeyBrief = this.prefixForKey
		}
	}

	public flagChanges() {

		this.propertiesChanges.emit(this.properties)
	}

	public displayKey(value: string): string {

		if (!value || typeof value != 'string') {
			return value
		}

		if (this.prefixForKey && value.startsWith(this.prefixForKey)) {
			value = value.substring(this.prefixForKey.length)
		}

		if (this.postfixForKey && value.endsWith(this.postfixForKey)) {
			value = value.substring(0, value.length - this.postfixForKey.length)
		}

		if (value.indexOf('..') != -1) {
			value = value.replace(/\.\./g, '.')
		}
		return value
	}

	public formatKey(value: string): string {

		if (!value || typeof value != 'string') {
			return value
		}

		if (!this.allowDots) {
			value = value.replace(/\./g, '..')
		}

		if (this.prefixForKey) {
			value = this.prefixForKey + value
		}

		if (this.postfixForKey) {
			value = value + this.postfixForKey
		}

		return value
	}

	public filterKeys(filter: string): string[] {

		const filterValue = filter.toLowerCase()
		return this.availableKeys.filter(option => filterValue.length == 0 || option.toLowerCase().includes(filterValue))
	}

	public isEnvironmentVar(element) {
		return element.type == PropertyValueType.environment
	}

	public isSecretVar(element) {
		return element.type == PropertyValueType.secret
	}

	public filterAvailableKey(control: FormControl) {

		const dialogRef = this._dialog.open(ComboBoxComponent, {
			data: {title: 'Search extended settings', filter: control.value, values: this.availableKeys},
		})

		dialogRef.afterClosed().subscribe(value => {

			if (value) {
				control.setValue(value, {onlySelf: true, emitEvent: false})
				this.flagChanges()
			}
		})
	}

	public isKeywordValid(element: Property) {
		return element.key && element.key.length > 0
	}

	public controlForPanelElement(key: string, element: Property, value?: string): FormControl {

		let ctrl: FormControl = null

		let name: string = key + ":" + element.key   //this.indexOfElement(element) // element.position

		if (this.form.controls[name]) {
			ctrl = <FormControl> this.form.controls[name]
		} else {
			ctrl = new FormControl(this.displayKey(value))
			this.form.addControl(name, ctrl)
		}

		return ctrl
	}

	public updateElementWithControlValue(key: string, element: Property) {

		console.log("updating ctrl for " + name)

		if (key == 'type') {

			let type = this.controlForPanelElement('type', element).value

			switch (type) {
				case '1':
					element.type = PropertyValueType.environment
					break
				case '2':
					element.type = PropertyValueType.secret
					break
				default:
					element.type = PropertyValueType.constant
			}

			console.log("type for " + element.key + " is now " + element.type)

		} else if (key == 'key') {
			element[key] = this.formatKey(this.controlForPanelElement(key, element).value)
		} else {
			element[key] = this.controlForPanelElement(key, element).value
		}

		this.flagChanges()
	}

	public addRow() {

		let p: Property = new Property("" ,null)

		this.properties.push(p)
		this.table.renderRows()
	}

	public removeRow(element: Property) {

		let found = -1

		for (let i=0; i < this.properties.length; i++) {

			if (this.properties[i] == element) {
				found = i
			}
		}

		if (found != -1) {
			this.form.removeControl("key:" + found)
		  	this.form.removeControl("type:" + found)
		  	this.form.removeControl("value:" + found)

			this.properties.splice(found, 1)
			this.table.renderRows()

			this.flagChanges()
		}
	}

	public moveUp(p: Property) {

		// find position of current row

		let found = -1

		for (let i=0; i < this.properties.length; i++) {

			if (this.properties[i] == p) {
				found = i
			}
		}

		if (found != -1 && found > 0) {

			this.properties.splice(found, 1)
			this.properties.splice(found - 1, 0, p)

			this.table.renderRows()
			this.flagChanges()
		}
	}

	public moveDown(p: Property) {

		// find position of current row

		let found = -1

		for (let i=0; i < this.properties.length; i++) {

			if (this.properties[i] == p) {
				found = i
			}
		}

		if (found != -1 && found < this.properties.length) {

			this.properties.splice(found, 1)
			this.properties.splice(found + 1, 0, p)

			this.table.renderRows()
			this.flagChanges()
		}
	}

	/*private indexOfElement(element: Property): number {

		let list: Property[] = this.properties
		var found: number = 0

		for (var i = 0; i < list.length; i++) {

			if (list[i].key == element.key) {
				found = i
				break
			}
		}

		return found
	}*/
}
