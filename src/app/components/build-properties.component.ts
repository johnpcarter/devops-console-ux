import { Component, OnInit }   							from '@angular/core'
import { FormBuilder, FormControl, FormGroup } 			from '@angular/forms'
import {ActivatedRoute, Router} from '@angular/router';

import { MatDialog } 									from '@angular/material/dialog';
import {MatSnackBar, MatSnackBarRef, TextOnlySnackBar} from '@angular/material/snack-bar';

import { ConfigurationService } 			 			from '../services/configuration.service'
import { ResourceService } 								from '../services/resources.service'
import { Property } 									from '../models/properties'
import { JdbcConnection, ServiceQueueDestType } 		from '../models/audit-properties';
import { ARTProperties } 								from '../models/art-properties'
import { SimpleNameComponent} 							from './elements/simple-name.component';
import { SimpleConfirmationComponent } 					from './elements/simple-confirmation.component';
import {Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {BuildCommand} from '../models/build';

@Component({
  selector: 'build-package',
  templateUrl: '../templates/build-properties.html'
})

export class BuildPropertiesComponent implements OnInit {

	public form: FormGroup
	public propsCtrl: FormControl
	public auditDestCtrl: FormControl
	public internalDestCtrl: FormControl
	public centralUserCtrl: FormControl
	public adaptersCtrl: FormControl
	public xrefCtrl: FormControl

	public propertyFiles: Observable<string[]>

	public currentFile: string = null
	public extendedProperties: Property[] = []
	public otherProperties: Property[] = []
	public globalProperties: Property[] = []

	public availableExtendedSettings: string[] = []

	public jdbcAliases: string[]
	public jdbcConnections: Map<string, JdbcConnection>

	public artAliases: string[]
	public artConnections: Map<string, ARTProperties>

	private _snackbarRef: MatSnackBarRef<TextOnlySnackBar>
	private _propertyFiles: string[] = []

	public constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _formBuilder: FormBuilder, private _runSetsService: ConfigurationService, private _resources: ResourceService, private _dialog: MatDialog, private _snackbar: MatSnackBar) {

		this._propertyFiles = []

		this._resources.resourcesForType("properties").subscribe((p) => {

			this._propertyFiles = []
			p.forEach((f) => {
				this._propertyFiles.push(f.name)
			})

			this.propertyFiles = of(this._propertyFiles)

			this._activatedRoute.paramMap.subscribe(params => {

				let ref = params.get('id')

				if (ref) {
					this.propsCtrl.setValue(ref, {onlySelf: true, emitEvent: false})
					this.loadPropertiesFile(ref)
				}
			})
		})
	}

	public ngOnInit() {

		this.propsCtrl = new FormControl()
		this.auditDestCtrl = new FormControl("default")
		this.internalDestCtrl = new FormControl("default")
		this.centralUserCtrl = new FormControl("default")
		this.adaptersCtrl = new FormControl("default")
		this.xrefCtrl = new FormControl("default")

		this.form = this._formBuilder.group({
			propsCtrl: this.propsCtrl,
			auditDestCtrl: this.auditDestCtrl,
			centralUserCtrl: this.centralUserCtrl,
			internalDestCtrl: this.internalDestCtrl,
			adaptersCtrl: this.adaptersCtrl,
			xrefCtrl: this.xrefCtrl
		})

		this.propertyFiles = this.propsCtrl.valueChanges.pipe(startWith(''), map(value => this._filterPropFile(value)))

		this.form.valueChanges.subscribe(values => {

			if (this.propsCtrl.dirty) {
				this.propsCtrl.markAsPristine()
				this.loadPropertiesFile(this.propsCtrl.value)
			} else if (this.auditDestCtrl.dirty) {
				this.auditDestCtrl.markAsPristine()
				this.saveProperties()
			}
		})

		this._resources.getServerSettings().subscribe((data) => {

			for (const key in data) {
				this.availableExtendedSettings.push(key)
			}
		})
	}

	public isExistingPropertyFile(): boolean {

		let found: boolean = false

		for (let i = 0; i < this._propertyFiles.length; i++) {
			if (this._propertyFiles[i] == this.propsCtrl.value) {
				found = true
				break
			}
		}

		return found
	}

	public downloadProperties(event) {

		this._resources.downloadResourceViaBrowser("properties", this.propsCtrl.value)
	}

	public propertiesFileAdded(filename: string) {

		this._resources.resourcesForType("properties").subscribe((p) => {

			this._propertyFiles = []
			p.forEach((f) => {
				this._propertyFiles.push(f.name)

				if (f.filename == filename) {
					let lst = this.propsCtrl.value.push(f.name)

					this.propsCtrl.setValue(lst)
				}
			})

			this.loadPropertiesFile(this.propsCtrl.value)
		})
	}

	public jdbcPropertiesDidChange(jdbcAlias: string, $event: Property[]) {

		console.log("got an update")

		this.jdbcConnections.set(jdbcAlias, JdbcConnection.make(this.mergeProperties($event, this.jdbcConnections.get(jdbcAlias).toProperties())).get(jdbcAlias))
		this.saveProperties()
	}

	public artPropertiesDidChange(artAlias: string, $event: Property[]) {

		console.log("got an update")

		this.artConnections.set(artAlias, ARTProperties.make(this.mergeProperties($event, this.artConnections.get(artAlias).toProperties())).get(artAlias))
		this.saveProperties()
	}

	public propertiesDidChange($event: Property[]) {

		this.saveProperties()
	}

	public addPropertiesFile(event: any) {

		this.clear()

		if (this.propsCtrl.value) {
			this.currentFile = this.propsCtrl.value
			this.jdbcConnections = new Map<string,JdbcConnection>()
			this.artConnections = new Map<string,ARTProperties>()
			this.jdbcAliases = []
			this.artAliases = []
			this.extendedProperties = []
			this.otherProperties = []
			this.globalProperties = []

			this.setRecommendedSettings()

			this.saveProperties()
		}
	}

	public deletePropertiesFile(event: any) {

		this._snackbarRef = this._snackbar.open('deleting property file ' + this.propsCtrl.value);

		this._resources.deleteResource("properties", this.propsCtrl.value).subscribe((success) => {

			this._snackbarRef.dismiss()
			if (success) {
				this._propertyFiles.splice(this._propertyFiles.indexOf(this.propsCtrl.value), 1)
				this.clear(true)
			} else {
				this._snackbar.open('Failed to delete file ' + this.propsCtrl.value, 'Sorry', {duration: 3000})
			}
		})
	}

	public addJDBCPool() {

		const dialogRef = this._dialog.open(SimpleNameComponent, {
			data: {title: 'Please specify a name for your new JDBC pool'},
		})

		dialogRef.afterClosed().subscribe(name => {

			if (name) {
				let pool = new JdbcConnection()
				pool.jdbcAlias = name
				this.jdbcConnections.set(name, pool)
				this.jdbcAliases.push(name)

				this.saveProperties()
			}
		})
	}

	public deleteJDBCPool(alias: string) {

		const dialogRef = this._dialog.open(SimpleConfirmationComponent, {
			data: {title: 'Confirm Deletion', subTitle: 'Are you sure you want to delete the JDBC pool ' + alias + ' ?'},
		})

		dialogRef.afterClosed().subscribe(okay => {

			if (okay) {
				let index = this.jdbcAliases.indexOf(alias)

				if (index != -1)
					this.jdbcAliases.splice(index,1)

				this.jdbcConnections.delete(alias)

				this.saveProperties()
			}
		})
	}

	public addArtConnection() {

		const dialogRef = this._dialog.open(SimpleNameComponent, {
			data: {title: 'Please specify the name of the adapter connection to override'},
		})

		dialogRef.afterClosed().subscribe(name => {

			if (name) {
				let pool = new ARTProperties()
				pool.name = name
				this.artConnections.set(name, pool)
				this.artAliases.push(name)

				this.saveProperties()
			}
		})
	}

	public deleteArtConnection(alias: string) {

		const dialogRef = this._dialog.open(SimpleConfirmationComponent, {
			data: {title: 'Confirm Deletion', subTitle: 'Are you sure you want to remove the overrides for the connection ' + alias + ' ?'},
		})

		dialogRef.afterClosed().subscribe(okay => {

			if (okay) {
				let index = this.artAliases.indexOf(alias)

				if (index != -1)
					this.artAliases.splice(index,1)

				this.artConnections.delete(alias)

				this.saveProperties()
			}
		})
	}

	public clear(clearPropsFileCtrl?: boolean) {

		if (clearPropsFileCtrl)
			this.propsCtrl.setValue(null, {onlySelf: true, emitEvent: false})

		this.currentFile = null
		this.artAliases = null
		this.artConnections = new Map<string, ARTProperties>()
		this.jdbcAliases = null
		this.jdbcConnections = new Map<string, JdbcConnection>()

		this.extendedProperties = []
		this.otherProperties = []
		this.globalProperties = []

		this.auditDestCtrl.setValue("default", {onlySelf: true, emitEvent: false})
		this.internalDestCtrl.setValue("default", {onlySelf: true, emitEvent: false})
		this.adaptersCtrl.setValue("default", {onlySelf: true, emitEvent: false})
		this.centralUserCtrl.setValue("default", {onlySelf: true, emitEvent: false})
		this.xrefCtrl.setValue("default", {onlySelf: true, emitEvent: false})
	}

	public hasRecommendedSettings() {

		if (this.currentFile) {
			return this.isPropertyPresent("user.Administrator.password", this.otherProperties)
				&& this.isPropertyPresent("settings.watt.server.port", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.net.localhost", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.publish.useCSQ", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.saveConfigFiles", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.saveConfigFiles", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.audit.logFilesToKeep", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.serverlogFilesToKeep", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.server.stats.logFilesToKeep", this.extendedProperties)
				&& this.isPropertyPresent("settings.watt.debug.level", this.extendedProperties)
				&& this.isPropertyPresent("watt.server.pipeline.processor", this.extendedProperties)
				&& this.isPropertyPresent("consul.default.host", this.extendedProperties)
				&& this.isPropertyPresent("consul.default.port", this.extendedProperties)
				&& this.isPropertyPresent("consul.default.user", this.extendedProperties)
				&& this.isPropertyPresent("consul.default.password", this.extendedProperties)

		} else {
			return true
		}
	}

	public setRecommendedSettings(saveChanges?: boolean) {

		this.addPropertyIfNotPresent(new Property("user.Administrator.password", '$env{admin_password}', "Administrator password"), this.otherProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.server.port", "$env{admin_port}", "Administration http port"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.net.localhost", "", "Override pod container name with whatever you specify here, useful in a containerized environment where you want to specify a service endpoint rather than a pod for resubmission"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.server.publish.useCSQ", "false", "disables local caching for outbound messages, which is not recommended when running as a pod due to risk of data loss"), this.extendedProperties)

		this.addPropertyIfNotPresent(new Property("settings.watt.server.saveConfigFiles", "false", "avoids creating backup files for config changes"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.server.audit.logFilesToKeep", "1", "don't keep archive files"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.server.serverlogFilesToKeep", "1", "don't keep archive files"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.server.stats.logFilesToKeep", "1", "don't keep archive files"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("settings.watt.debug.level", "Warn", "Set logging level to warning only"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("watt.server.pipeline.processor", "false", "Disables pipeline save/restore debug options"), this.extendedProperties)

		this.addPropertyIfNotPresent(new Property("consul.default.host", "$env{consul_host}", "host name of Consul service registry to use"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("consul.default.port", "$env{consul_port}", "Disables pipeline save/restore debug options"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("consul.default.user", "$env{consul_user}", "Disables pipeline save/restore debug options"), this.extendedProperties)
		this.addPropertyIfNotPresent(new Property("consul.default.password", "$env{consul_password}", "Disables pipeline save/restore debug options"), this.extendedProperties)

		this.extendedProperties = this.copyList(this.extendedProperties)
		this.otherProperties = this.copyList(this.otherProperties)

		if (saveChanges)
			this.saveProperties()
	}

	private loadPropertiesFile(filename: string) {

		this.clear()

		this._resources.getResourceContent("properties", this.propsCtrl.value).subscribe((data) => {
			if (data && data.properties) {

				this.currentFile = this.propsCtrl.value

				this.otherProperties = []

				this.jdbcConnections = JdbcConnection.make(data.properties)
				this.artConnections = ARTProperties.make(data.properties)

				this.jdbcAliases = []
				this.jdbcConnections.forEach((value: JdbcConnection, key: string) => {
					this.jdbcAliases.push(key)
				})

				this.artAliases = []
				this.artConnections.forEach((value: ARTProperties, key: string) => {
					this.artAliases.push(key)
				})

				data.properties.forEach((kv) => {

					if (kv.key == JdbcConnection.JDBC_FUNC_ISCOREAUDIT) {
						this.auditDestCtrl.setValue(kv.value, {onlySelf: true, emitEvent: false})
					} else if (kv.key == JdbcConnection.JDBC_FUNC_CENTRALUSERS) {
						this.centralUserCtrl.setValue(kv.value, {onlySelf: true, emitEvent: false})
					} else if (kv.key == JdbcConnection.JDBC_FUNC_ADAPTERS) {
						this.adaptersCtrl.setValue(kv.value, {onlySelf: true, emitEvent: false})
					} else if (kv.key == JdbcConnection.JDBC_FUNC_ISINTERNAL) {
						this.internalDestCtrl.setValue(kv.value, {onlySelf: true, emitEvent: false})
					} else if (kv.key == JdbcConnection.JDBC_FUNC_XREF) {
						this.xrefCtrl.setValue(kv.value, {onlySelf: true, emitEvent: false})
					} else if (kv.key.startsWith('settings.')) {
						this.extendedProperties.push(Property.make(kv))
					} else if (kv.key.startsWith('globalvariable.')) {
						this.globalProperties.push(Property.make(kv))
					} else if (!kv.key.startsWith(ARTProperties.PREFIX) && !kv.key.startsWith(JdbcConnection.JDBC_PREFIX)) {
						this.otherProperties.push(Property.make(kv))
					}
				})
			}
		})
	}

	private saveProperties() {

		if (this.currentFile == null)
			return

		// only proceed if recognized file

		let props: Property[] = []

		this.jdbcConnections.forEach((p) => {
			let vals = p.toProperties()

			vals.forEach((v) => {
				props.push(v.keyValuePair(JdbcConnection.JDBC_PREFIX + p.jdbcAlias + "."))
			})
		})

		this.artConnections.forEach((a) => {
			let vals = a.toProperties()

			vals.forEach((v) => {
				props.push(v.keyValuePair(ARTProperties.PREFIX + a.name + "."))
			})
		})

		this.otherProperties.forEach((o) => {
			props.push(o.keyValuePair())
		})

		this.extendedProperties.forEach((o) => {
			props.push(o.keyValuePair('settings.'))
		})

		this.globalProperties.forEach((o) => {
			props.push(o.keyValuePair('globalvariable.'))
		})
		if (this.auditDestCtrl.value && this.auditDestCtrl.value != 'default') {
			props.push(new Property(JdbcConnection.JDBC_FUNC_ISCOREAUDIT, this.auditDestCtrl.value))
			props.push(new Property(JdbcConnection.JDBC_SERVICEQUEUE_DEST, ServiceQueueDestType.ServiceDBDest))
		}

		if (this.internalDestCtrl.value && this.internalDestCtrl.value != 'default') {
			props.push(new Property(JdbcConnection.JDBC_FUNC_ISINTERNAL, this.internalDestCtrl.value))
		}

		if (this.adaptersCtrl.value && this.adaptersCtrl.value != 'default') {
			props.push(new Property(JdbcConnection.JDBC_FUNC_ADAPTERS, this.adaptersCtrl.value))
		}

		if (this.centralUserCtrl.value && this.centralUserCtrl.value != 'default') {
			props.push(new Property(JdbcConnection.JDBC_FUNC_CENTRALUSERS, this.centralUserCtrl.value))
		}

		if (this.xrefCtrl.value && this.xrefCtrl.value != 'default') {
			props.push(new Property(JdbcConnection.JDBC_FUNC_XREF, this.xrefCtrl.value))
		}

		this.savePropertiesFile(props)
	}

	private addPropertyIfNotPresent(property: Property, list: Property[]): Property[] {

		if (!this.isPropertyPresent(property.key, list)) {
			list.push(property)
		}

		return list
	}

	private isPropertyPresent(key: string, list: Property[]): boolean {

		let found: boolean = false

		for (let i=0; i<list.length; i++) {
			if (list[i].key == key) {
				found = true
				break
			}
		}

		return found
	}

	private mergeProperties(newProps: Property[], props: Property[]): Property[] {

		let found: boolean = false

		for(let i=0; i < newProps.length; i++) {
			let p = newProps[i]

			for (let z=0; z < props.length; z++) {
				let o = props[z]

				if (o.key == p.key) {
					props[z] = p
					found = true
					break
				}
			}

			if (!found) {
				props.push(p)
			}
		}

		return props
	}

	private savePropertiesFile(props: Property[]) {

		let data: string = ""

		props.forEach((p) => {
			if (p.value)
				data += p.key + "=" + p.value + "\n"
		})

		this._resources.uploadResource("properties", this.propsCtrl.value, "text/plain", new Blob([data])).subscribe((success) => {

			//this._snackbarRef.dismiss()

			if (success) {

			} else {
				this._snackbarRef = this._snackbar.open('save failed for ' + this.propsCtrl.value);

			}
		})
	}

	private _filterPropFile(filter: string) {

		const filterValue = filter.toLowerCase()
		return this._propertyFiles.filter(option => filterValue.length == 0 || option.toLowerCase().includes(filterValue))
	}

	private copyList(list: Property[]): Property[] {
		let out: Property[] = []

		list.forEach((p) => {
			out.push(p)
		})

		return out
	}
}
