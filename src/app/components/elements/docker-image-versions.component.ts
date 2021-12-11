import { Component, ChangeDetectorRef, OnInit, OnDestroy,
          EventEmitter, Input, Output, Inject }                   from '@angular/core'
import { Router }                                                 from '@angular/router'

import { MAT_DIALOG_DATA }                                        from '@angular/material/dialog'

import { DockerImage }                                            from '../../models/docker-image'

@Component({
  selector: 'jc-docker-image-versions',
  templateUrl: '../../templates/elements/docker-image-versions.html'
})

export class DockerImageVersionsComponent {

  @Input()
  public dataSource: any

  @Input()
  public currentVersion: number

  @Output()
  public onSelection: EventEmitter<DockerImage> = new EventEmitter<DockerImage>()

  public columns: string[] = ['current', 'Version', 'Comments', 'Last Updated', 'Tested' ]

  private _selectedVersion: DockerImage

  public constructor(router: Router, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.dataSource = data.dataSource
    this.currentVersion = data.currentVersion

    this.onSelection.subscribe((obj: any) => {
      data.selectHandler(obj)
    })
  }

  public ngOnInit() {
    // overide parent

  }

  public labelForAction(image: DockerImage): string {

    if (this._selectedVersion)
      return "Update to " + this._selectedVersion.version()
    else
      return "Update"
  }

  public haveActions(): boolean {

    return this._selectedVersion && Number(this._selectedVersion.version()) != this.currentVersion
  }

  public selectVersion(image: DockerImage) {

    this._selectedVersion = image
  }

  public close() {
    this.onSelection.emit(null)
  }

  public updateVersion() {

    this.onSelection.emit(this._selectedVersion)
  }
}
