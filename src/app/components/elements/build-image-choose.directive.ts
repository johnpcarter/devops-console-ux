import { Directive, ViewContainerRef } 					from '@angular/core'
import { FormBuilder, FormGroup } 		  				from '@angular/forms'
import {DockerImage} from '../../models/docker-image'
import {Installer} from '../../models/project'

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
