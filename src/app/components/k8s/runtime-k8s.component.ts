import { Component, OnInit }   						from '@angular/core'

import { MatDialog } 								from '@angular/material/dialog'

import { K8sService }                       	  	from '../../services/k8s.service'

import { Settings, Values } 						from '../../settings'
import { SimpleNameComponent } 						from '../elements/simple-name.component'

@Component({
  selector: 'runtime',
  templateUrl: '../../templates/k8s/runtime-k8s.html',
  styleUrls: ['../../templates/k8s/runtime-k8s.css']
})

export class RuntimeK8sComponent implements OnInit {

	public namespace: string
    public namespaces: string[]

    public k8sDashboardUrl: string

	public constructor(private _settings: Settings, private _k8sService: K8sService, private _dialog: MatDialog) {

		this._settings.values().subscribe((v) => {

			if (v.k8sNamespace)
				this.namespace = v.k8sNamespace

			if (v.k8sUrl && v.k8sUrl != 'xx') {
				let i: number = this.k8sDashboardUrl.indexOf(":")
				this.k8sDashboardUrl = this.k8sDashboardUrl.substring(0, i+1) + "8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy"
			} else {
				this.k8sDashboardUrl = "http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
			}

			this.getNamespaces(v)

		    this._settings.setCurrentPage("k8s")
		})
	}

	public ngOnInit() {

	}

	public getNamespaces(v: Values) {

		this._k8sService.namespaces(v.k8sUrl.replace('localhost', window.location.hostname), v.k8sToken).subscribe((names) => {

			if (names == null) {

				// report failure
				this.requestTokenUpdate()
			} else {

				this.namespaces = names

				if (!this.namespace)
					this.namespace = this.namespaces[0]
			}
		})
	}

	public dashboard(): string {

		if (this.namespace)
			return this.k8sDashboardUrl + "?namespace=default#/pod?namespace="+this.namespace
		else
			return this.k8sDashboardUrl + "?namespace=default#/pod"

	}

	public namespaceSelectionChanged() {
		this._settings.setCurrentNamespace(this.namespace)
	}

	public requestTokenUpdate() {
		const dialogRef = this._dialog.open(SimpleNameComponent, {width: "80%",
			data: {title: 'Enter a valid Bearer Token to access your kubernetes environment', type: 'password', hint: 'e.g. kubectl -n kubernetes-dashboard create token admin-user', description: 'token'}
		})

		dialogRef.afterClosed().subscribe(name => {

			if (name) {
				this._settings.values().subscribe((v) => {

					v.k8sToken = name
					this._settings.saveChanges(v)

					this.getNamespaces(v)
				})
			}
		})
	}
}
