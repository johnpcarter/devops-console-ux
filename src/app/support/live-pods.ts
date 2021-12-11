import { Observable, Subscriber }       from 'rxjs'

import { K8sPod, PodStatus }            from '../models/k8s-pod'
import { K8sService }                 	from '../services/k8s.service'

export class LivePodsCount {

	constructor(public appId: string, public ready: number, public available: number, public unavailable: number) {

	}
}
export class LivePods {

	public appId: string

	private _dataSource: K8sPod[] = []
	private _hasChanges: boolean = false
	private _pleaseStop: boolean = false

	private _observer: Observable<LivePodsCount>

	public constructor(private _namespace: string, private _deploymentId: string, private _refreshInterval, private _k8sService: K8sService) {

		this.appId = _deploymentId
		
		this.fetchPods().subscribe((d) => {
          this._dataSource = d
        })

        // now schedule refresh

        //this.refreshPods()
	}

	public stop() {

		this._pleaseStop = true
	}

	public dataSource() {

		let ret: any =  {data: this._dataSource, hasChanged: this._hasChanges}
		this._hasChanges = false
		return ret
	}

	public refreshPods(): Observable<LivePodsCount> {

		return new Observable((observer) => {

			this._refreshPods(observer)
		})
	}

	private _refreshPods(observer: Subscriber<LivePodsCount>) {

		let ref: LivePods = this
		setTimeout(() => {

        	ref.fetchPods().subscribe((d) => {
        		ref.updatePods(observer, d)
        	})

        }, this._refreshInterval)
	}

	private updatePods(observer: Subscriber<LivePodsCount>, pods: K8sPod[]) {

		this._hasChanges = true

		let runTotal: number = 0
		let availableTotal: number = 0
		let unavailableTotal: number = 0

		pods.forEach((p) => {

			if (p.status == PodStatus.Running)
				runTotal += 1
			else if (p.status == PodStatus.Starting)
				availableTotal += 1
			else 
				unavailableTotal += 1
		})

		for (var i=0; i < this._dataSource.length; i++) {

			let p: K8sPod = this._dataSource[i]
			let m: any = this.matchedPod(p, pods)

			// first update status of each pod

			if (m.foundPod) {

				// replace with updated reference

				this._dataSource.splice(i, 1, m.foundPod)

				pods = m.remainingPods

			} else {
				// no longer in list, flag as removed, if not already, otherwise remove it from list

				if (p.status != PodStatus.Removed) {

					p.status = PodStatus.Removed
				} else {

					this._dataSource.splice(i, 1)
					i -= 1; // jiggle loop increment to ensure we don't jump next pod in array
				}
			}
		}

		// now add any new pods to end of list.

		pods.forEach((p) => {

			this._dataSource.push(p)
		})

		observer.next(new LivePodsCount(this.appId, runTotal, availableTotal, unavailableTotal))

		if (!this._pleaseStop)
			this._refreshPods(observer)
		else
			observer.complete()
	}

	private matchedPod(pod: K8sPod, pods: K8sPod[]): any {

		let foundIndex: number = -1

		for (var i=0; i < pods.length; i++) {

			let p: K8sPod = pods[i]

			if (pod.id == p.id) {
				foundIndex = i

				break
			}
		}

		if (foundIndex != -1) {
			
			let found: any = pods[foundIndex]
			pods.splice(foundIndex, 1)

			return {foundPod: found, remainingPods: pods}
		} else {

			return {foundPod: null, remainingPods: pods}
		}
	}

	private fetchPods(): Observable<K8sPod[]> {

		return this._k8sService.podsForAppLabel(this._namespace, this._deploymentId); //TODO: change this false
	}
}