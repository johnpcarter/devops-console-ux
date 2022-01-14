import { Directive, ViewContainerRef } 					from '@angular/core'
import { FormGroup } 		  				            from '@angular/forms'
import { Installer }                                    from '../../models/Installer';

@Directive({
  selector: '[builder]',
})

export class BuildImageChooseDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

export class BuilderProperties {

	public constructor(public key: string, public values: string[]) {

	}
}

export interface PropertiesChangedOwner {

	initialProperties(): any
	installerTemplateLoaded(template: Installer)

	propertiesChangedInBuilder(type: string, displayableProperties: Map<string, BuilderProperties[]>, properties: any)
}

export interface BuilderComponent {

  formGroup: FormGroup
  owner: PropertiesChangedOwner

  setLicenseFile(license: string)
  refreshBuildCommands(show: boolean)
}
