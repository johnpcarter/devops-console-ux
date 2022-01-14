import { Component, Inject }   		      from '@angular/core'
import {MAT_DIALOG_DATA} 								from '@angular/material/dialog'
import {Observable, of} from 'rxjs';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h2 style="color: #1a3a5c">{{title}}</h2>
  <mat-dialog-content>
	  <form [formGroup]="form">
	  <mat-form-field style="min-width: 450px; margin-right: 10px; background-color: transparent" appearance="fill">
		  <input matInput placeholder="Search extended setting" formControlName="filter"
				 [matAutocomplete]="auto">
		  <mat-autocomplete #auto="matAutocomplete">
			  <mat-option *ngFor="let v of filteredValues | async"
						  [value]="v">{{v}}</mat-option>
		  </mat-autocomplete>
	  </mat-form-field>
	  </form>
  </mat-dialog-content>
  <mat-dialog-actions>
  	<button mat-button mat-dialog-close>Cancel</button>
  	<button mat-button [mat-dialog-close]="this.filter.value">Continue</button>
</mat-dialog-actions>`
})

export class ComboBoxComponent {

	public title: string
	public subTitle: string
	public values: string[]

	public form: FormGroup
	public filter: FormControl
	public filteredValues: Observable<string[]>

	constructor(@Inject(MAT_DIALOG_DATA) public data: any, private _formBuilder: FormBuilder) {

		this.title = data.title
		this.subTitle = data.subTitle
		this.values = data.values

		this.filteredValues = of(this.values)

		this.filter = new FormControl(data.filter)

		this.form = this._formBuilder.group({
			filter: this.filter
		})

		this.filteredValues = this.filter.valueChanges.pipe(startWith(''), map(value => this._filterKeys(value)))
	}

	private _filterKeys(value: string) {

		const filterValue = value.toLowerCase()
		return this.values.filter(option => filterValue.length == 0 || option.toLowerCase().includes(filterValue))
	}
}
