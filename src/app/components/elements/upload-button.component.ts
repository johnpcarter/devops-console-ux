 import { Component, EventEmitter, OnInit,
            Input, Output }   					        from '@angular/core'

import { FormBuilder } 					                from '@angular/forms'

import { FileUploader }                         from 'ng2-file-upload'

@Component({
  selector: 'file-uploader-button',
  template: `
	<label [class]="buttonClass" color="accent"><fa-icon class="icon" [icon]="['fas', 'file-upload']" [style]="style"></fa-icon> {{title}}
		<input type="file" ng2FileSelect [uploader]="uploader" [disabled]="disabled" (onFileSelected)="upload($event)" style="display: none"/>
	</label>
`
})

export class UploadButtonComponent implements OnInit {

	@Input()
	public uploadURL: string

	@Input()
	public alias: string

	@Input()
	public small: boolean

	@Input()
	public type: string

	@Input()
	public title: string

	@Input()
	public titleColor: string

	@Input()
	public disabled: boolean

	@Output()
	public onCompletion: EventEmitter<string> = new EventEmitter()

  	public uploader: FileUploader

  	public buttonClass: string = "mat-raised-button mat-accent"
  	public style: any = {"color": "white"}

	public constructor(private _formBuilder: FormBuilder) {

	}

	public ngOnInit() {

		if (this.small) {
			this.buttonClass = "small-button"
			this.style["font-size"] = "9px"
		}

		if (this.titleColor) {
			this.style["color"] = this.titleColor
		}

		let url: string = this.uploadURL

		if (this.type)
			url += "?type=" + this.type

		this.uploader = new FileUploader({url: url, itemAlias: this.alias})

		this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; }
    	this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {

        	if (status == 200) {
        		alert('File uploaded successfully')

        		this.onCompletion.emit(JSON.parse(response).filename)
        	} else {
        		alert('File upload failed')
        	}
     }
	}

	public upload(event: any) {

		this.uploader.uploadAll()
	}
}
