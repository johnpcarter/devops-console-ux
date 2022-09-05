import { Component, ChangeDetectorRef, OnInit, Input,
                                           ViewChild }  from '@angular/core'

import { MatButton }                                    from '@angular/material/button'

import {MatSnackBar}                                    from '@angular/material/snack-bar'


import { K8sDeploymentDefinition }                      from '../../models/k8s-deployment-definition'
import { K8sService }                                   from '../../services/k8s.service'

import { ActionsComponent }                             from './runtime-actions.directive'

@Component({
  selector: 'jc-runtime-scale',
  templateUrl: '../../templates/k8s/runtime-scale.html'
})

export class RuntimeScaleComponent implements OnInit, ActionsComponent {

  @Input()
  public selectedDeployment: K8sDeploymentDefinition

  @Input()
  public selectedEnvironment: string

  public podsCount: number = 1
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

    this._k8sService.scalePods(this.selectedDeployment, +this.podsCount, this.selectedEnvironment).subscribe((result) => {

      if (result)
        this._snackBar.open("Update Successful", "Dismiss", {
          duration: 2000,
        })
      else
         this._snackBar.open("Update failed", "Dismiss", {
          duration: 2000,
        })
    })
  }
}
