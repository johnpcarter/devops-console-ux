import { Component, Inject }   		      from '@angular/core'
import {MAT_DIALOG_DATA} 								from '@angular/material/dialog'

@Component({
  selector: 'name-dialog',
  template: `
  <h2 style="color: #1a3a5c">{{title}}</h2>
  <mat-dialog-content>
	  <mat-form-field style="width: 90%">
		  <input matInput [placeholder]="description" style="width: 100%" [type]="type" [(ngModel)]="data.name" required>
		  <mat-hint *ngIf="hint">{{hint}}</mat-hint>
	  </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions>
  	<button mat-button mat-dialog-close>Cancel</button>
  	<button mat-button [mat-dialog-close]="data.name">Continue</button>
</mat-dialog-actions>`
})

export class SimpleNameComponent {

	public title: string
	public type: string = 'text'
	public hint: string
	public description: string

	constructor(@Inject(MAT_DIALOG_DATA) public data: any) {

		this.title = data.title

		if (data.type)
			this.type = data.type

		if (data.hint)
			this.hint = data.hint

		if (data.description)
			this.description = data.description
	}
}
