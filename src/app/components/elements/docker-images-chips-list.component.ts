import {
  Component, ChangeDetectorRef, OnInit, OnDestroy, OnChanges,
  EventEmitter, Input, Output, Inject
} from '@angular/core'
import { Router }                                                 from '@angular/router'

import {FormBuilder, FormGroup, FormControl,
								Validators} 			                                from '@angular/forms'

import { MatSnackBar }                                            from '@angular/material/snack-bar'
import { MatDialog, MatDialogRef,
					MAT_DIALOG_DATA }	  				              	            from '@angular/material/dialog'


import { DockerImage, ImageStatus, TestStatus }                   from '../../models/docker-image'
import { DockerService }                                          from '../../services/docker.service'

import { ContainerTemplates }                                     from '../../support/container.templates'

import * as $ from 'jquery'

export class Action {

  public action: string
  public image: DockerImage

  constructor(action: string, image: DockerImage) {
    this.action = action
    this.image = image
  }
}

@Component({
  selector: 'jc-docker-chips-images',
  templateUrl: '../../templates/elements/docker-images-chips-list.html'
})

export class DockerImagesChipListComponent implements OnInit, OnChanges {


  @Input()
  public title: string

  @Input()
  public type: string

  @Input()
  public namespace: string

  @Input()
  public references: any[]

  @Input()
  public dataSource: DockerImage[]

  @Input()
  public currentVersion: number

  @Output()
  public onAction: EventEmitter<Action> = new EventEmitter<Action>()

  @Output()
  public onSelection: EventEmitter<DockerImage> = new EventEmitter<DockerImage>()

  @Output()
  public imageCount: EventEmitter<number> = new EventEmitter<number>()

  protected _selectedVersion: DockerImage

  public constructor(private _router: Router, private _snackBar: MatSnackBar, private _formBuilder: FormBuilder, private _dialog: MatDialog, private _dockerImageService: DockerService) {

  }

  public ngOnInit() {

    if (this.type == 'sag') {

      this._dockerImageService.sagImages(true).subscribe((d) => {
        this.dataSource = d
        this.imageCount.emit(d.length)
      })
    } else if (this.type == 'base') {

      this._dockerImageService.baseImages(true).subscribe((d) => {
        this.dataSource = d
        this.imageCount.emit(d.length)
      })
    } else if (this.type == 'custom') {

      this._dockerImageService.customImages(true).subscribe((d) => {

        if (this.references) {

         this.updateReferences(d)

        } else {
          this.dataSource = d
          this.imageCount.emit(d.length)
        }
      })
    }

  }

  public ngOnChanges() {

    //if (this.type == 'custom' && this.references) {
    if (this.references) {
      this._dockerImageService.baseImages(true).subscribe((d) => {

         this.updateReferences(d)
      })
    }
  }

  public gotoImage(image: DockerImage) {

    if (image.isSagImage) {
      this._router.navigate(["/build/install", {id: image.id}])
    } else {
      this._router.navigate(["/build/image", {id: image.id}])
    }
  }

  public editImage(image: DockerImage, event: any) {

    let x = event.pageX
    let y = event.pageY

    let dialogRef = this._dialog.open(DockerImageInfoComponent, {
      data: { image: image, owner: this },
      width: '500px',
        height: '400px',
    })

    console.log("left: '${x}px', top: '${y}px'")

    dialogRef.updatePosition({ left: (x < 600 ? x : x-500) + "px", top: y + "px" })

    dialogRef.afterClosed().subscribe(image => {
        console.log(`Dialog result: ${image}`)

    })
  }

  public productCodeLabel(element: DockerImage): string {

    return ContainerTemplates.productCodeLabel(element.type)
  }

  public showTests(element: DockerImage) {

    this._router.navigate(['/test'], { skipLocationChange: false })
  }

  private updateReferences(d: DockerImage[]) {

    this.dataSource = []

      d.forEach((i) => {
        let v: number = -1

        if ((v=this._version(i.uniqueName())) != -1) {
          this.dataSource.push(i.imageForVersion(v))
        }
    })

  }

  private _version(name: string): number {

    let found: number = -1

    for (var i = 0; i < this.references.length; i++) {

      if (this.references[i].name == name) {
        found = this.references[i].version
        break
      }
    }

    return found
  }

  public isCurrentVersion(row: DockerImage): boolean {

    if (row) {

      if (this.currentVersion == Number(row.version()))
        return true
      else
        return false
    } else {
      return false
    }
  }

  public didFailTests(row: DockerImage): boolean {
    return row.testStatus == TestStatus.failed
  }

  public isSelected(row: DockerImage): boolean {

    if (this.isCurrentVersion(row)) {
      return true
    } else if (row) {

      if (this._selectedVersion && this._selectedVersion.version() == row.version())
        return true
      else
        return false
    } else {
      return false
    }

  }

  public canPublish(row: DockerImage): boolean {

    return row.repository() != null && row.id != null
  }

  public canPull(row: DockerImage): boolean {

    return row.repository() != null
  }

  public styleForStatus(image: DockerImage): any {

      let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '5px'
      style['padding'] = '10px'

      if (image.status == ImageStatus.deprecated)
        style['background-color'] = 'light-gray'
      else if (image.status == ImageStatus.deployed)
        style['background-color'] = 'blue'
      else if (image.status == ImageStatus.running)
        style['background-color'] = 'green'
      else if (image.status == ImageStatus.failed)
        style['background-color'] = 'red'
      else
        style['background-color'] = 'pink'

      return style
    }

     public localizedStatus(image: DockerImage): string {

      if (image.status == ImageStatus.deprecated)
        return "deprecated"
      else if (image.status == ImageStatus.deployed)
        return "deployed"
      else if (image.status == ImageStatus.running)
        return "running"
      else if (image.status == ImageStatus.failed)
        return "failed"
      else
        return "new"
    }

    public styleForAction(image: DockerImage): string {

      let style: any = {}
      style['text-align'] = 'center'
      style['border-radius'] = '5px'
      style['padding'] = '10px'
      style['color'] = "white"

      if (this.type == 'base')
        style['background-color'] = 'pink'
      else if (image.status == ImageStatus.deprecated)
        style['background-color'] = 'light-gray'
      else if (image.status == ImageStatus.running)
        style['background-color'] = 'orange'
      else
        style['background-color'] = 'green'

      return style
    }

    public styleForVersionColumn(image: DockerImage): string {

      let style: any = {}
      style['text-align'] = 'center'

      if (this.type == 'edit' && image.version() != image.latestVersion().version())
        style['color'] = 'orange'
      else
        style['color'] = 'rgb(100,100,100)'

      return style
    }

    public haveTests(image: DockerImage) {

      return image.testStatus != TestStatus.none
    }

    public passedTests(image: DockerImage) {

      return image.testStatus == TestStatus.passed
    }

    public failedTests(image: DockerImage) {

      return image.testStatus == TestStatus.failed
    }

    public todoTests(image: DockerImage) {

      return image.testStatus == TestStatus.todo
    }

    public runningTests(image: DockerImage) {

      return image.testStatus == TestStatus.running
    }

    public unknownTests(image: DockerImage) {

      return (this.type != 'edit' || image.version() != image.latestVersion().version()) && image.testStatus == TestStatus.unknown
    }

    public testLabelFor(image: DockerImage): string {

      let s: string = ""

      if (image.testStatus == TestStatus.none)
        s = "No test cases defined"
      else if (image.testStatus == TestStatus.passed)
        s = "All test cases pased successfully"
      if (image.testStatus == TestStatus.failed)
        s = "Some test cases failed"
      if (image.testStatus == TestStatus.running)
        s = "Test Cases are running"
      if (image.testStatus == TestStatus.todo)
        s = "Test cases defined, but not yet run"

      return s
    }

    public colorForTest(image: DockerImage): string {

      if (image.testStatus == TestStatus.none)
        return "basic"
      else if (image.testStatus == TestStatus.passed)
        return "primary"
      else
        return "warn"

    }

    public test(image: DockerImage) {

      this._router.navigate(['/test', {id: image.id}])
    }

    public selectRow(row: DockerImage) {

      if (Number(row.version())!= this.currentVersion) {

        if (this._selectedVersion == row)
          this._selectedVersion = null
        else
          this._selectedVersion = row
      }

      if (this.onSelection)
        this.onSelection.emit(this._selectedVersion)
    }


    public colorForEditButton(image: DockerImage) {

      if (image.version() == image.latestVersion().version())
        return "primary"
      else
        return "warn"
    }

    public updateVersionButtonLabel(image: DockerImage) {

      if (image.version() == image.latestVersion().version())
        return "Change"
      else
        return image.latestVersion()
    }

    public pushImage(image: DockerImage) {

      let busy = this._snackBar.open("Pushing " + image.tag() + " ...")

      this._dockerImageService.pushImage(image).subscribe((result) => {

        busy.dismiss()

        let message = null

        if (result)
          message = "Container successfully pushed"
        else
         message = "Container push failed for reposiotory " + image.repository()

        this._snackBar.open(message, "Dismiss", {
          duration: 5000,
        })
      })
    }

    public pullImage(image: DockerImage) {

      let busy = this._snackBar.open("Pulling " + image.tag() + " ...")

      this._dockerImageService.pullImage(image.tag()).subscribe((result) => {

        busy.dismiss()

        let message = null

        if (result)
          message = "Container pulled with id #" + result.id.substring(0, 6)
        else
         message = "Container pull failed with tag " + image.tag()

        this._snackBar.open(message, "Dismiss", {
          duration: 5000,
        })
      })
    }

    public deleteImage(image: DockerImage) {
      //TODO
    }

    private updateVersion(image: DockerImage) {

      this.onAction.emit(new Action("update", image))
    }
}

@Component({
	selector: 'docker-image-info',
  	templateUrl: '../../templates/elements/docker-image-info.html'
})

export class DockerImageInfoComponent {

  public image: DockerImage
  public owner: DockerImagesChipListComponent

  constructor(public dialogRef: MatDialogRef<DockerImageInfoComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.image = data.image
    this.owner = data.owner
  }

  closeDialog() {
    this.dialogRef.close(this.image)
  }

  delete() {
    this.owner.deleteImage(this.image)
  }

  push() {
    this.owner.pushImage(this.image)
  }

  pull() {
    this.owner.pullImage(this.image)

  }
}

