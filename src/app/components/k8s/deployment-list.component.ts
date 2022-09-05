import {Component, OnInit, OnChanges, Input, ViewChild} from '@angular/core';
import { Router }                                                 from '@angular/router'
import { animate, state, style, transition, trigger }             from '@angular/animations'

import { MatSlideToggleChange }                                   from '@angular/material/slide-toggle'
import { MatSnackBar }                                            from '@angular/material/snack-bar'
import { MatTable }                                               from '@angular/material/table'

import { Settings }                                               from '../../settings'
import { K8sDeployment, DeploymentStatus }                        from '../../models/k8s-deployment'
import { K8sDeploymentDefinition }                                from '../../models/k8s-deployment-definition'

import { K8sService }                                             from '../../services/k8s.service'
import { ConfigurationService }                                   from '../../services/configuration.service'


@Component({
  selector: 'jc-k8s-deployments',
  templateUrl: '../../templates/k8s/deployment-list.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})

export class DeploymentListComponent implements OnInit, OnChanges {

  public _displayedColumnsBase: string[] = ['Name', 'Description', 'Last Updated', 'version', 'Status']
  public _displayedColumnsActive: string[] = ["enable", 'Name', 'Replicas', 'Pods', 'Description', 'Status', "expand", "remove"]

    @Input()
    public namespace: string

    @Input()
    public runningOnly: boolean

    public dataSource: any[]

  @ViewChild('deploymentsTable') deploymentsTable: MatTable<any>

  isExpansionDetailRow = (i: number, row: Object) => row.hasOwnProperty('detailRow')
    expandedElement: any

    private _lastFetch: string

    public constructor(private _router: Router, private _snackBar: MatSnackBar, private _settings: Settings, private _k8sService: K8sService, private _configService: ConfigurationService) {

    }

    public ngOnInit() {

      this.refresh()
    }

    public ngOnChanges() {

      this.refresh()
    }

    public refresh() {

      if (this._lastFetch != this.namespace) {
        this._refresh()
      }
    }

    public displayedColumns(): string[] {

      if (this.runningOnly)
        return this._displayedColumnsActive
      else
        return this._displayedColumnsBase
    }

    public isDeploymentSuspened(row: K8sDeployment): boolean {

      return (row && row.replicas == 0)
    }

    public enableOrDisableDeployment(event: MatSlideToggleChange, row: K8sDeployment) {

      if (event.checked) {

        this._configService.runSet(row.deploymentId).subscribe((result) => {
          if (result) {
            let replicas: number = row.replicasBeforeSuspend

            this._scaleDeployment(row, replicas > 0 ? replicas : 1)
          } else {
            this._snackBar.open("Activation failed", "Dismiss", {duration: 3000})
          }
        })
      } else {
        row.replicasBeforeSuspend = row.replicas
        this._scaleDeployment(row, 0)
      }

    }

    public deleteDeployment(deployment: K8sDeployment) {

      this._snackBar.open("Deleting deployment")

      this._k8sService.deleteDeployment(deployment, this._settings.currentEnvironment).subscribe((result) => {
        if (result) {
          this._snackBar.open("Deleted successfully", "Hooray!", {duration: 2000})

          for (let i = 0; i < this.dataSource.length; i++) {

            if (this.dataSource[i].name == deployment.name || (this.dataSource[i].element && this.dataSource[i].element.name == deployment.name)) {
              this.dataSource.splice(i, 1)
              i -= 1
            }
          }

          this.deploymentsTable.renderRows()

        } else {
          this._snackBar.open("Delete failed", "Dismiss", {duration: 3000})
        }
      })
    }
    public showExpandedAreaForRow(row: any) {

      if (this.expandedElement == row)
        this.expandedElement = null
      else
        this.expandedElement = row
    }

    public isExpanded(row: any): string {

      if (row.element == this.expandedElement)
        return 'expanded'
      else
        return 'collapsed'
    }

    public updatePodCount(event: any) {

      this.dataSource.forEach((d) => {

        if (d.name == event.appId && !d.detailRow) {
          console.log("got pod event for " + event.appId + ", " + event.running + ", " + event.other)

          d.updatePodCount(d.replicas, event.ready, event.available, event.unavailable)
        }
      })
    }

    public podCount(deployment: K8sDeployment): number {

      return deployment.readyReplicas || 0
    }

    public styleForPodCount(deployment: K8sDeployment): any {

      let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '3px'
      style['padding'] = '10px'
      style['color'] = 'white'

      let count: number = this.podCount(deployment)

      if (count == 0)
        style['background-color'] = 'red'
      else if (count == 1)
        style['background-color'] = 'blue'
      else
        style['background-color'] = 'green'

      return style
    }

    public styleForStatus(deployment: K8sDeployment): string {

      let style: any = {}

      style['text-align'] = 'center'
      style['border-radius'] = '3px'
      style['padding'] = '10px'
      style['color'] = 'black'

      if (deployment.status == DeploymentStatus.unknown)
        style['background-color'] = 'rgb(150, 150, 150)'
      else if (deployment.status == DeploymentStatus.running)
        style['background-color'] = 'green'
      else if (deployment.status == DeploymentStatus.suspended || deployment.status == DeploymentStatus.updating)
        style['background-color'] = 'orange'
      else if (deployment.status == DeploymentStatus.unavailable)
        style['background-color'] = 'red'

      return style
    }

    public scalePerformance(deployment: K8sDeployment) {

      K8sDeployment.currentDeployment = <K8sDeployment> deployment

      this._router.navigate(['/k8s/scale' ], { skipLocationChange: false })
    }

    public updateVersion(deployment: K8sDeployment) {

      K8sDeployment.currentDeployment = <K8sDeployment> deployment

      this._router.navigate(['/k8s/update' ], { skipLocationChange: false })
    }

    public showActions(deployment: K8sDeploymentDefinition) {

      if (this.runningOnly)
        K8sDeployment.currentDeployment = <K8sDeployment> deployment
      else
        K8sDeploymentDefinition.currentDeployment = deployment

      this._router.navigate(['/k8s' ], { skipLocationChange: false })
    }

    private _scaleDeployment(deployment: K8sDeployment, count: number) {

      this._k8sService.scalePods(deployment, count, this._settings.currentEnvironment).subscribe((result) => {

        let type: string = count == 0 ? "Activation" : "Suspend"

        if (result) {

          this._refresh()
          deployment.replicasBeforeSuspend = deployment.replicas
          deployment.replicas = count
          this._snackBar.open(type + " succeeded", "Dismiss", { duration: 2000})

        } else {
          this._snackBar.open(type + " failed", "Dismiss", { duration: 2000})
        }
      })
    }

    private _refresh() {

      this._k8sService.deployments(this.namespace, this._settings.currentEnvironment, true).subscribe((d) => {
          this._lastFetch = this.namespace
          this.dataSource = []

           d.forEach((dp) => {

             this.dataSource.push(dp, {element: dp, detailRow: true})
           })
      })
    }
}
