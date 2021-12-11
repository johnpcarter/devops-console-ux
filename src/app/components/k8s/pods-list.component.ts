import { Component, ChangeDetectorRef, OnInit, OnChanges, OnDestroy, 
            ViewChild, Output, Input, EventEmitter }              from '@angular/core'
import { Router }                                                 from '@angular/router'

import { MatTable }                                               from '@angular/material/table'

import { Settings }                                               from '../../settings'
import { LivePods, LivePodsCount }                                from '../../support/live-pods'
import { K8sPod, PodStatus }                                      from '../../models/k8s-pod'
import { K8sDeployment }                                          from '../../models/k8s-deployment'
import { K8sService }                                             from '../../services/k8s.service'

const PODS_LIST_REFRESH_INTERVAL = 5000

@Component({
  selector: 'jc-pods',
  templateUrl: '../../templates/k8s/pods-list.html'
})

export class PodsListComponent implements OnInit, OnChanges, OnDestroy {

	public _displayedColumnsBase: string[] = ['Name', 'Containers', 'Created', "Status", "Actions"]
  
    @Input()
    public namespace: string

    @Input()
    public appId: string

    @Input()
    public showActions: boolean = true

    @Output()
    public podCountChanged: EventEmitter<LivePodsCount> = new EventEmitter()

    private _podsSource: LivePods

    @ViewChild('podsTable', {read: MatTable}) table: MatTable<any>

    public constructor(private _router: Router, private _settings: Settings, private _podService: K8sService) {

    }

    public ngOnInit() {

      if (!this.showActions)
        this._displayedColumnsBase.pop()

            console.log("initing up for " + this.appId)

      this.start();   
    }

    public ngOnChanges() {

      if (this._podsSource && this.appId != this._podsSource.appId) {

        this._podsSource.stop()
        this.start()
      }
    }

    public ngOnDestroy() {

            console.log("destroying for" + this.appId)

      this._podsSource.stop()
    }

    public start() {

      console.log("starting up for " + this.appId)

      this._podsSource = new LivePods(this.namespace, this.appId, PODS_LIST_REFRESH_INTERVAL, this._podService)
      this._podsSource.refreshPods().subscribe((podsCount) => {
        this.podCountChanged.emit(podsCount)
      })

    }

    public dataSource(): K8sPod[] {

      let ret: any = this._podsSource.dataSource()

      let next: K8sPod[] = ret.data

      let ref: PodsListComponent = this

      if (ret.hasChanged) {
        setTimeout(() => {
          ref.table.renderRows()
        }, 10)
      }

      return next
    }

    public displayedColumns(): string[] {

       return this._displayedColumnsBase
    }

    public styleForRunningPods(image: K8sPod): any {

      let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '10px'
      style['padding'] = '5px'


      return style
    }

    public styleForAction(image: K8sPod): string {

      let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '10px'
      style['padding'] = '5px'
      style['color'] = "white"

      return style
    }

    public styleForStatus(pod: K8sPod): any {

       let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '5px'
      style['padding'] = '10px'
      style['color'] = "white"

      if (pod.status == PodStatus.Pending) {
        style['background-color'] = 'yellow'
        style['color'] = 'black'
      }
      else if (pod.status == PodStatus.Starting) {
        style['background-color'] = 'orange'
      }
      else if (pod.status == PodStatus.Running) {
        style['background-color'] = 'green'
      }
      else if (pod.status == PodStatus.Stopping) {
        style['background-color'] = 'orange'
      }
      else if (pod.status == PodStatus.Removed) {
        style['background-color'] = 'gray'
      }
      else {
        style['background-color'] = 'pink'
      }

      return style
    }

    public containerSummary(pod: K8sPod): string[] {

      let labels: string[] = []

      pod.containers.forEach((c) => {

        labels.push(c.imageRef + " (" + c.status + ")")
      })

      return labels
    }

    public localizedStatus(label: String): any {

      if (label)
        return label
      else
        return "unknown"
    }

    public iconForAction(image: K8sDeployment): string {

        return "cloud-upload-alt"
    }

    public labelForAction(image: K8sDeployment): string {

        return "Deploy"
    }

    public executeAction(image: K8sDeployment) {

      K8sDeployment.currentDeployment = image
      
      this._router.navigate(['/solution' ], { skipLocationChange: false })
    }
}