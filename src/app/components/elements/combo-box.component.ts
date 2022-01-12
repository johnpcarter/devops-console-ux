import { Component, Inject }   		      from '@angular/core'
import {MAT_DIALOG_DATA} 								from '@angular/material/dialog'

@Component({
  selector: 'confirm-dialog',
  template: `
  <h2 style="color: #1a3a5c">{{title}}</h2>
  <mat-dialog-content>
  	{{subTitle}}
  </mat-dialog-content>
  <mat-dialog-actions>
  	<button mat-button mat-dialog-close>Cancel</button>
  	<button mat-button [mat-dialog-close]="true">Continue</button>
</mat-dialog-actions>`
})

export class SimpleConfirmationComponent {

	public title: string
	public subTitle: string

	constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

		this.title = data.title
		this.subTitle = data.subTitle
	}
}
