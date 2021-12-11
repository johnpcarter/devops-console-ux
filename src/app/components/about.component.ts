import { Component, ChangeDetectorRef, Inject, 
									OnDestroy }        from '@angular/core'
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} 	   from '@angular/material/dialog'

@Component({
  selector: 'about-app',
  templateUrl: '../templates/about.html',
})
export class AboutComponent {

  // constructor(public dialogRef: MatDialogRef<AboutComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
   constructor(public dialogRef: MatDialogRef<AboutComponent>) {
   	
   }

  onNoClick(): void {
    this.dialogRef.close()
  }

}