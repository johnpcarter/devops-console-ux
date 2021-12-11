import {Component, OnInit }                     from '@angular/core'

import {ActivatedRoute, Router }                from '@angular/router'

import { Settings }                             from '../settings'
import { ConfigurationService }        		      from '../services/configuration.service'
import {TestSuite, TestSuiteResults} from '../models/test-suite'
import { TestTraceService }                     from '../services/test-trace.service'

@Component({
  selector: 'test-history',
  templateUrl: '../templates/test-history.html',
  styleUrls: ['../templates/test-history.css']
})

export class TestHistoryComponent implements OnInit {

	public runName: string = ""
  public runSets: string[] = []

  public tests: TestSuiteResults[] = []

  public displayedColumns: string[] = ["name", "errors", "failures", "total", "percent"]

	public constructor(private _router: Router, private _inboundRouter: ActivatedRoute, private _settings: Settings, private _configService: ConfigurationService, private _testService: TestTraceService) {

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

      this._settings.setCurrentPage('test/history', this.runName)
    })
	}

	public ngOnInit() {

	}

	public runTimeTemplateSelected(event: any) {

	  this._testService.archivedTestCases(this.runName).subscribe((r) => {
	    this.tests = r
	    this._settings.currentRuntime = this.runName
    })
  }

  public docLink(image: string, id: string): string {

	  return "/JcDevopsConsole/tests/" + this.runName.replace(/\s/g,'-') + "/" + image + "/" + id + "/results/html"
  }

  public classForElement(element: TestSuite): string {
	  if (this.percentage(element) == 100) {
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
	    return 0
    }
  }
}
