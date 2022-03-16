import { Component, ChangeDetectorRef, OnInit }   	  from '@angular/core'

import { MediaMatcher }                               from '@angular/cdk/layout'

import { MatAccordion }                               from '@angular/material/expansion'

import { K8sService }                       		  from '../../services/k8s.service'

import { Settings }                                   from '../../settings'

@Component({
  selector: 'runtime',
  templateUrl: '../../templates/k8s/runtime-k8s.html',
  styleUrls: ['../../templates/k8s/runtime-k8s.css']
})

export class RuntimeK8sComponent implements OnInit {

	public namespace: string
    public namespaces: string[]

    public k8sDashboardUrl: string

	public constructor(private _settings: Settings, private _k8sService: K8sService) {

		this._settings.values().subscribe((v) => {

			if (v.k8sNamespace)
				this.namespace = v.k8sNamespace

			if (v.k8sUrl) {
				this.k8sDashboardUrl = v.k8sUrl.replace('localhost', window.location.hostname)

				let i: number = this.k8sDashboardUrl.lastIndexOf(":")
				this.k8sDashboardUrl = this.k8sDashboardUrl.substring(0, i+1) + "8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy"
			} else {
				this.k8sDashboardUrl = "https://host.docker.internal:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
			}

			this._k8sService.namespaces(v.k8sUrl.replace('localhost', window.location.hostname), v.k8sToken).subscribe((names) => {
		        this.namespaces = names

		        if (!this.namespace)
		        	this.namespace = this.namespaces[0]
		    })

		    this._settings.setCurrentPage("k8s")
		})
	}

	public ngOnInit() {

	}

	public namespaceSelectionChanged() {
		this._settings.setCurrentNamespace(this.namespace)
	}
}
