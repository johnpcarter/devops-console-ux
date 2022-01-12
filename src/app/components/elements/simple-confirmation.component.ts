import { Component, Inject }   		      from '@angular/core'
import {MAT_DIALOG_DATA} 								from '@angular/material/dialog'

@Component({
  selector: 'name-dialog',
  template: `
  <h2 style="color: #1a3a5c">{{title}}</h2>
  <mat-dialog-content>
  	<input style="width: 80%" mat-input type="text" [(ngModel)]="data.name" required>
  </mat-dialog-content>
  <mat-dialog-actions>
  	<button mat-button mat-dialog-close>Cancel</button>
  	<button mat-button [mat-dialog-close]="data.name">Continue</button>
</mat-dialog-actions>`
})

export class SimpleNameComponent {

	public title: string

	constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

		this.title = data.title
	}
}
