import {Component, OnInit} from '@angular/core'

import {ActivatedRoute, Router} from '@angular/router'
import {FormBuilder} from '@angular/forms'

import {MatDialog} from '@angular/material/dialog'

import {Settings} from '../settings'

import {ResourceService} from '../services/resources.service'

import { DockerService } from '../services/docker.service'
import { ConfigurationService } from '../services/configuration.service'
import { TestTraceService } from '../services/test-trace.service'
import { TestSuite, TestSuiteResults } from '../models/test-suite'
import { Container } from '../models/container'
import { RunSet } from '../models/project'
import { TestStatus } from '../models/docker-image'

@Component({
  selector: 'test-run',
  templateUrl: '../templates/test-run.html',
  styleUrls: ['../templates/test-run.css']
})

export class TestRunComponent implements OnInit {

  public runName: string = ""
  public runSets: string[] = []

  public liveTests: TestSuiteResults[] = []
  public displayedColumns: string[] = ["name", "errors", "failures", "total", "percent"]

  public busy: boolean = false
  private run: RunSet

  public status: TestStatus = TestStatus.unknown

	public constructor(private _router: Router, private _inboundRouter: ActivatedRoute, private _settings: Settings, private _dockerService: DockerService, private _dialog: MatDialog,

		private _formBuilder: FormBuilder, private _resources: ResourceService, private _configService: ConfigurationService, private _testService: TestTraceService) {

	      this.runSets = []
        this._configService.runSets().subscribe((p) => {
          this.runSets = p
        })

        let sub = this._inboundRouter.params.subscribe(params => {

          if (params['id']) {
            this.runName = params['id']
          } else {
            this.runName = this._settings.currentRuntime
          }

          if (this.runName) {
            this.runTimeTemplateSelected(null)
          }

          this._settings.setCurrentPage('test', this.runName)
        })
	}

	ngOnInit(): void {
  }

  public runTimeTemplateSelected(event: any) {

	  this._testService.testCasesInContainer(this.runName).subscribe((r) => {
	    this._settings.currentRuntime = this.runName
	    this.liveTests = r
	    if (this.liveTests.length == 0) {
	      this._testService.testStatus(this.runName).subscribe((r) => {
	        this.status = r
        })
      }
    })

	  this._configService.runSet(this.runName).subscribe((r) => {
	    this.run = r
    })
  }

  public classForElement(element: TestSuite): string {

	  if (this.percentage(element)) {
	    return "test-todo"
    } else if (this.percentage(element) == 100) {
	    return "test-ok"
    } else if (this.percentage(element) > 49) {
	    return "test-failing"
    } else {
	    return "test-ko"
    }
	}

  public percentage(element: TestSuite): Number {

	  if (element.total > 0) {
	    return ((+element.total - (+element.errors + +element.failures)) / +element.total) * 100
    } else {
	    return -1
    }
  }

  public imageName(wrapper: TestSuiteResults): string {

	  var c : Container = this.run.containerInDeploymentFor(wrapper.name)

	  return c.image
  }

  public latestVersionForContainer(r: TestSuiteResults): any {

	  var container : Container = this.run.containerInDeploymentFor(r.name)

		let wrapper = {label: null}

		if (container.image.endsWith("latest") || container.image.endsWith("lts")) {

			let useDedicatedRepo: boolean = false

			if (this.run) {
				this.run.builds.forEach((b) => {
					if (b.targetImage.name() == container.imageName()) {
						useDedicatedRepo = b.targetImage.dedicatedRepository()
					}
				})
			}

			this._dockerService.image(container.uniqueName(useDedicatedRepo)).subscribe((d) => {

				if (d != null) {
					wrapper.label = " (" + d.version() + ")"
				}
			})
		}

		return wrapper
	}

	public haveTests(): boolean {

		return this.status != TestStatus.none
	}

	public todoTests(): boolean {

		return this.status == TestStatus.todo
	}

	public runTestCases(containerName: string) {
	  this.status = TestStatus.running
    this.busy = true
	  this._testService.run(this.runName, containerName).subscribe((r) => {
	    this.busy = false
    })
  }

	public archiveTestCasesToDevopsConsole(containerName: string) {

	  this.busy = true
	  this._testService.transferTestCasesFromContainer(this.runName, containerName).subscribe( (r) => {
	    this.busy = false
    })
  }

  public linkToContainer(wrapper: TestSuiteResults): string {

	  var c : Container = this.run.containerInDeploymentFor(wrapper.name)
	  var port: string = "5555"

	  c.environmentSettings().ports.forEach((p) => {
	    if (p.type == "http")
        port = p.external
    })

	  return "http://localhost:" + port + "/JcTestRunner"
  }
}
