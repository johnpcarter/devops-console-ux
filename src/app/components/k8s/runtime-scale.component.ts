import { Component, ChangeDetectorRef, OnInit, Input,
                                           ViewChild }  from '@angular/core'
import { Router }                                       from '@angular/router'

import { MatSelect }                                    from '@angular/material/select'
import { MatButton }                                    from '@angular/material/button'

import {MatSnackBar}                                    from '@angular/material/snack-bar'

import { Settings }                                     from '../../settings'

import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'
import { K8sDeployment }                                from '../../models/k8s-deployment'
import { K8sService }                                   from '../../services/k8s.service'

import { ActionsComponent }                             from './runtime-actions.directive'

@Component({
  selector: 'jc-runtime-scale',
  templateUrl: '../../templates/k8s/runtime-scale.html'
})

export class RuntimeScaleComponent implements OnInit, ActionsComponent {

  @Input()
  public selectedDeployment: K8sDeploymentDefinition

  public podsCount: number = 5
  public haveChanges: boolean = false

  @ViewChild('updateButton', {read: MatButton}) updateButton: MatButton

  public constructor(private _snackBar: MatSnackBar, private _k8sService: K8sService) {

  }

  public ngOnInit() {

    this.podsCount = this.selectedDeployment.replicas
  }

  public podCountChange(event: any) {

    if (this.updateButton)
      this.updateButton.disabled = false

    this.haveChanges = this.podsCount != this.selectedDeployment.replicas
  }

  public update(event: any) {

    this.updateButton.disabled = true

    this._k8sService.scalePods(this.selectedDeployment, +this.podsCount).subscribe((result) => {

      if (result)
        this._snackBar.open("Update Succesful", "Dismiss", {
          duration: 2000,
        })
      else
         this._snackBar.open("Update failed", "Dismiss", {
          duration: 2000,
        })
    })
  }
}
