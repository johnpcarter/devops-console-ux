import { Component, ChangeDetectorRef, OnInit, OnDestroy,
          Input, Output, EventEmitter }                           from '@angular/core'
import { Router }                                                 from '@angular/router'
import { animate, state, style, transition, trigger }             from '@angular/animations'
import { DataSource }                                             from '@angular/cdk/collections'

import {FormBuilder, FormGroup, FormControl,
                Validators}                                       from '@angular/forms'

import { Observable, of, pipe }                                   from 'rxjs'
import { map }                                                    from 'rxjs/operators'

import { Settings }                                               from '../../settings'
import { Deployment }                                             from '../../models/project'


@Component({
  selector: 'k8s-props',
  templateUrl: '../../templates/k8s/service-properties.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})

export class ServicePropertiesComponent implements OnInit {

    @Input()
    public deployment: Deployment

    @Output()
    public serviceUpdated: EventEmitter<Deployment> = new EventEmitter()

    public serviceStates: string[] = ['Stateless', 'Stateful']
    public restartPolicies: string[] = ['Always', 'OnFailure', 'Never']
    public formGroup: FormGroup
    public appNameCtrl: FormControl
    public hostNameCtrl: FormControl
    public typeCtrl: FormControl
    public replicasCtrl: FormControl
    public serviceTypeCtrl: FormControl
    public requiresMonitoringCtrl: FormControl
    public requiresVersioningCtrl: FormControl
    public restartOnFailCtrl: FormControl
    public namespaceCtrl: FormControl

    public constructor(private _formBuilder: FormBuilder, private _router: Router, private _settings: Settings) {
          this.formGroup = this._formBuilder.group({})
    }

    public ngOnInit() {

      this.appNameCtrl = new FormControl(this.deployment.appName)
      this.hostNameCtrl = new FormControl(this.deployment.hostname)
      this.replicasCtrl = new FormControl(this.deployment.replicas || 1)
      this.serviceTypeCtrl = new FormControl(this.deployment.serviceType)
      this.namespaceCtrl = new FormControl(this.deployment.namespace)

      this.requiresMonitoringCtrl = new FormControl(this.deployment.requiresMonitoring == 'true' ? true : false)
      this.requiresVersioningCtrl = new FormControl(this.deployment.requiresVersioning == 'true' ? true : false)
      this.restartOnFailCtrl = new FormControl(this.deployment.restartPolicy || 'Always')

      this.formGroup.addControl("appNameCtrl", this.appNameCtrl)
      this.formGroup.addControl("hostNameCtrl", this.hostNameCtrl)
      this.formGroup.addControl("replicasCtrl", this.replicasCtrl)
      this.formGroup.addControl("serviceTypeCtrl", this.serviceTypeCtrl)
      this.formGroup.addControl("requiresMonitoringCtrl", this.requiresMonitoringCtrl)
      this.formGroup.addControl("requiresVersioningCtrl", this.requiresVersioningCtrl)
      this.formGroup.addControl("namespaceCtrl", this.namespaceCtrl)

      this.formGroup.addControl("restartOnFailCtrl", this.restartOnFailCtrl)

      this.formGroup.valueChanges.subscribe((v) => {

        if (this.appNameCtrl.dirty) {

          this.deployment.appName = this.appNameCtrl.value
          this.appNameCtrl.markAsPristine()
        }

        if (this.hostNameCtrl.dirty) {

          this.deployment.hostname = this.hostNameCtrl.value
          this.hostNameCtrl.markAsPristine()
        }

        if (this.replicasCtrl.dirty) {

          this.deployment.replicas = this.replicasCtrl.value
          this.replicasCtrl.markAsPristine()
        }

        if (this.serviceTypeCtrl.dirty) {

          this.deployment.serviceType = this.serviceTypeCtrl.value
          this.serviceTypeCtrl.markAsPristine()
        }

        if (this.restartOnFailCtrl.dirty) {

          this.deployment.restartPolicy = this.restartOnFailCtrl.value
          this.restartOnFailCtrl.markAsPristine()
        }

        if (this.requiresMonitoringCtrl.dirty) {

          this.deployment.requiresMonitoring = this.requiresMonitoringCtrl.value ? "true" : "false"
          this.requiresMonitoringCtrl.markAsPristine()
        }

        if (this.requiresVersioningCtrl.dirty) {

          this.deployment.requiresVersioning = this.requiresVersioningCtrl.value ? "true" : "false"
          this.requiresVersioningCtrl.markAsPristine()
        }

        if (this.namespaceCtrl.dirty) {
          this.deployment.namespace = this.namespaceCtrl.value
          this.namespaceCtrl.markAsPristine()
        }

        this.serviceUpdated.emit(this.deployment)
      })
    }

    public requiresMonitoringChanged(event) {

      this.deployment.requiresMonitoring = this.requiresMonitoringCtrl.value ? "true" : "false"
      this.requiresMonitoringCtrl.markAsPristine()
    }

  public requiresVersioningChanged(event) {

    this.deployment.requiresVersioning = this.requiresVersioningCtrl.value ? "true" : "false"
    this.serviceUpdated.emit(this.deployment)
  }
}
