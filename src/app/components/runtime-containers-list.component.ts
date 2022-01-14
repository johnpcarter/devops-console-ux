import {Component, Input, OnDestroy, OnInit, OnChanges, ViewChild, Output, EventEmitter} from '@angular/core'
import {DomSanitizer} from '@angular/platform-browser'
import {Router} from '@angular/router'

import { MatDialog } from '@angular/material/dialog'
import { MatTable } from '@angular/material/table'

import { Container, Port} from '../models/container';
import {TestStatus} from '../models/docker-image'
import {ConfigurationService} from '../services/configuration.service'
import {DockerService} from '../services/docker.service'
import {TestTraceService} from '../services/test-trace.service'

import {Settings} from '../settings'
import {BuildExeComponent} from './build-exe.component'

import * as $ from 'jquery'

@Component({
  selector: 'runtime-containers-list',
  templateUrl: '../templates/runtime-containers-list.html',
  styleUrls: ['../templates/runtime-containers.css']
})

export class RuntimeContainersListComponent implements OnInit, OnChanges, OnDestroy {

	public _displayedColumns: string[] = ["id", "image", "created", "state", "status", "ports", "name", "testStatus", "remove"]
	public _displayedColumns_known: string[] = ["id", "image", "created", "state", "status", "ports", "name", "remove"]
	public _displayedColumnsMin: string[] = ["id", "image", "state", "status", "remove"]

  @Input()
  public selectedDeploymentName: string

  @Input()
  public containers: Container[]

  @Output()
  public stopContainerEvent: EventEmitter<Container> = new EventEmitter()

	public run: boolean = false

	@ViewChild('table', {read: MatTable})
	private _table: MatTable<Container>
	private _host: string

	public constructor(private _router: Router, private _settings: Settings, private _configService: ConfigurationService, private _dialog: MatDialog,
		private _dockerService: DockerService, private _testMgr: TestTraceService, private _sanitizer: DomSanitizer) {
	}

	public ngOnInit() {

	  this._settings.values().subscribe((s) => {
      if (s.dockerHost)
        this._host = s.dockerHost.substring(0, s.dockerHost.indexOf(":"))
      else
        this._host = "localhost"

      if (this._host == 'host.docker.internal')
        this._host = 'localhost'

      this._settings.setCurrentPage('deploy')
    })

    this.deploymentSelectionChanged(true)
	}

	public ngOnChanges() {

	  this.deploymentSelectionChanged()
  }

  public ngOnDestroy() {

	}

	public displayedColumns(): string[] {

		let wide: boolean = false

		if ($('#runtime-table').width() > 1200)
		  wide = true

		if (wide) {
		  if (this.selectedDeploymentName != "All Containers")
		    return this._displayedColumns
		  else
		    return this._displayedColumnsMin
		} else {
		  return this._displayedColumnsMin
		}
	}

	public deploymentSelectionChanged(onInit?: boolean) {

    if (!onInit && this._table) {
      this._table.renderRows()
    }
	}

	public showTestResults(container: Container) {

	  this._router.navigate(['/test', {id: this.selectedDeploymentName }])
	}

	public containerLog(container: Container) {

		if (container.state != 'missing') {

			let dialogRef = this._dialog.open(BuildExeComponent, {
		      width: "80%",
		      height: "80%",
		      data: {containerId: container.id, containerName: container.imageName() },
		    })

		    dialogRef.afterClosed().subscribe(result => {

		    })
		}
	}

	public addDeploymentSet() {
		this._router.navigate(['/run'])
	}

	public edit() {

		this._router.navigate(['/run', this.selectedDeploymentName])
	}

	public stopContainer(container: Container) {

		this.stopContainerEvent.emit(container)
	}

	public isContainerRunning(container: Container): boolean {

		return !container.id.startsWith("??")
	}

	public refForElement(element: Container): string {

		if (element && element.id) {
			if (element.id.length > 6)
				return element.id.substring(0, 6)
			else
				return element.id
		} else {
			return null
		}
	}

	public haveTests(element: Container): boolean {

		return element.testStatus != null && element.testStatus != TestStatus.none
	}

	public todoTests(element: Container): boolean {

		return element.testStatus == TestStatus.todo
	}

	public runningTests(element: Container): boolean {

		return element.testStatus == TestStatus.todo
	}

	public failedTests(element: Container): boolean {

		return element.testStatus == TestStatus.failed
	}

	public passedTests(element: Container): boolean {

		return element.testStatus == TestStatus.completed
	}

	public colorForTestStatus(element: Container): string {

	  if (element.testStatus == TestStatus.completed) {
	    return "primary"
    } else if (element.testStatus == TestStatus.failed) {
	    return "warn"
    } else if (element.testStatus == TestStatus.todo) {
	    return "accent"
    } else if (element.testStatus == TestStatus.running) {
	    return "run"
    } else {
	    return "gray"
    }
  }

  public ports(container: Container): Port[] {

	  return container.environmentSettings(this._settings.currentEnvironment).ports
  }

	public formatPort(port: Port) {

		if (port.external != port.internal)
			return port.external + ":" + port.internal
		else
			return port.external
	}

	public imageName(container: Container): String {

	  if (container.image === 'EXTERNAL') {
      return '-'
    } else if ( container.runningVersion == null || container.image.endsWith(container.runningVersion)) {
      return container.image
    } else {
	    return container.image + ' (' + container.runningVersion + ')'
    }
  }

	public openPage(container: Container, port: Port, page?: string) {

		if (port.type != 'http' && port.type != 'https')
			return

		var url: string = port.type + "://" + (this._host ? this._host : "localhost") + ":" + port.external + "/" + (page ? page : "")

		window.open(url, container.name)
	}

	public colorForPort(container: Container, port: Port) {

		if (container.state == "missing") {
			return "gray"
		} else {

			if (port.type == "http")
				return "primary"
			else if (port.type == "https")
				return "accent"
			else
				return "gray"
		}
	}

	public colorForState(container: Container) {

		if (container.state == "missing") {
			return "gray"
		}
		else if (container.state != "running") {

			return "warn"
		} else {

			if (container.status && container.status.indexOf("unhealthy") != -1)
				return "accent"
			else if (container.status && container.status.indexOf("starting") != -1)
				return "accent"
			else
				return "primary"
		}
	}

	public testLabelFor(container: Container): string {

		let s: string = ""

		if (container.testStatus == TestStatus.none)
			s = "No test cases defined"
		else if (container.testStatus == TestStatus.passed)
			s = "All test cases pased successfully"
		if (container.testStatus == TestStatus.failed)
			s = "Some test cases failed"
		if (container.testStatus == TestStatus.running)
			s = "Test Cases are running"
		if (container.testStatus == TestStatus.todo)
			s = "Test cases defined, but not yet run"

		return s
	}
}
