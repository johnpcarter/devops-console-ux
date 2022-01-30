import { Component, OnInit, OnDestroy }        		from '@angular/core'
import { Router }					   				from '@angular/router'
import { Location } 								from "@angular/common"

import { Settings }                                	from '../settings'

import * as $ from 'jquery'

@Component({
  selector: 'home',
  templateUrl: '../templates/home.html',
  styleUrls: ['../templates/home.css']
})
export class HomeComponent implements OnInit {

	private _currentExtra: string

  // constructor(public dialogRef: MatDialogRef<AboutComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
   constructor(private _location: Location, private _router: Router, private _settings: Settings) {

   		if (this._location.path() == "") {

   			// user reloaded browser, do we need to go back to last page

   			this._settings.values().subscribe(values => {

	   			if (values.lastViewedPage && values.lastViewedPage != 'home') {
	   				this._settings.gotoLastViewedPage(this._router)
	   			}
   			})
   		}
   }

   public ngOnInit() {

   		this.setOffsetForExtraDivs()
      }

   public showDetailsInfo(name: string) {

   		if (this.hideExtraInfo()) {
   			let ref: HomeComponent = this
   			setTimeout(() => {
   				ref._showExtraInfo(name)
   			}, 100)

   		} else {
   			this._showExtraInfo(name)
   		}
   }

   public hideExtraInfo(): boolean {

   		if (this._currentExtra) {
   			$(this._currentExtra).animate({ bottom: '-800px' }, 400)
   			$(this._currentExtra).css({display: 'none'})

   			this._currentExtra = null

   			return true
   		} else {
   			return false
   		}
   }

   public goBuild() {
   		this._router.navigate(['/build'])
   }

   public goInstall() {
   		this._router.navigate(['/build/install'])
   }

   public goSource() {
   		this._router.navigate(['/build/package'])
   }

   public goMake() {
   		this._router.navigate(['/build/image'])
   }

   public goDeploy() {
   		this._router.navigate(['/deploy'])
   }

   public goRun() {
   		this._router.navigate(['/deploy/run'])
   }

   public goStage() {
   		this._router.navigate(['/deploy/stage'])
   }

   public goTest() {
   		this._router.navigate(['/test'])
   }

   public goTestResults() {
   		this._router.navigate(['/test'])
   }

   public goTestArchives() {
   		this._router.navigate(['/test/history'])
   }

   private _showExtraInfo(name: string) {

   		this._currentExtra = name
   		$(name).css({display: 'block'})

   		$(name).animate({ bottom: this.offsetForExtraInfo(name)}, 400)
   }

   private setOffsetForExtraDivs() {

   		let left: number = this.xposOfMainDiv()

   		if (left > 20) {
   	   		$('#buildextra').css({left: $("#build-block").offset().left - 10})
   	   		$('#deployextra').css({left: $("#deploy-block").offset().left - 10})
   	   		$('#testextra').css({left: $("#test-block").offset().left - 10})
   		}
   	   	else {
   	   		$('#buildextra').css({left: $("#build-block").offset().left + 20})
   	   		$('#deployextra').css({left: $("#deploy-block").offset().left + 20})
   	   		$('#testextra').css({left: $("#test-block").offset().left + 20})
   	   	}

   	   	let ref: HomeComponent = this
   		setTimeout(() => {
   			ref.setOffsetForExtraDivs()
   		}, 500)
   }

   private offsetForExtraInfo(name: string): number {

   		let dh: number = $('#home-page').offset().top + $('#home-page').height() - 30
   		let my: number = this.offset()
		let bh: number = $(name).height()

   		let space: number = dh - my

   		return space - bh
   }

   private offset(): number {

   		return $('#page-content').offset().top + $('#page-content').height()
   }

   private xposOfMainDiv(): number {

		if ($("#home-page")) {
			return $("#home-page").offset().left
		} else {
			return 0
		}
   }
}
