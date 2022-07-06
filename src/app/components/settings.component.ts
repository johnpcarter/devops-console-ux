import {Component, ChangeDetectorRef, OnDestroy, ViewChild} from '@angular/core';
import {
  FormBuilder, FormGroup, FormControl,
  Validators
} from '@angular/forms'
import {MediaMatcher} from '@angular/cdk/layout'
import {
  MatDialog, MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog'
import { trim } from 'jquery'

import {Settings, Values, RepoSettings, GitType} from '../settings'
import {RegistryToken} from '../models/registry-token';
import {MatTable} from '@angular/material/table';
import {DockerRegistriesService} from '../services/docker-registries.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'home',
  templateUrl: '../templates/settings.html',
  styleUrls: ['../templates/settings.css']
})

export class SettingsComponent {

  public settingsForm: FormGroup
  public environments: string[] = ['Default']

  public envCtrl: FormControl = new FormControl('Default')

  public gitTypeCtrl: FormControl
  public gitHostCtrl: FormControl
  public gitIsOrgCtrl: FormControl
  public gitNameCtrl: FormControl
  public gitUserCtrl: FormControl
  public gitTokenCtrl: FormControl
  public gitPasswordCtrl: FormControl
  public gitRepoCtrl: FormControl
  public gitPackagesCtrl: FormControl
  public gitConfigCtrl: FormControl

  public dockerHostCtrl: FormControl
  public dockerPortCtrl: FormControl
  public dockerHttpsCtrl: FormControl
  public dockerCertCtrl: FormControl

  public dockerCertificateCtrl: FormControl

  public k8sUrlCtrl: FormControl
  public k8sTokenCtrl: FormControl
  public k8sTypeCtrl: FormControl

  public gitExpander: boolean = true
  public dockerExpander: boolean
  public dockerRegistries: boolean
  public k8sExpander: boolean

  public gitRepos: RepoSettings[] = []

  public registries: RegistryToken[] = []

  private _ignoreChanges: boolean
  private _oldName: string

  private _defaultValues: Values
  private _values: Values

  public k8sTypes: string[] = ["desktop", "aks", "eks", "other"]
  public displayedColumnsForRegistries: string[] = ["registry", "user", "token", "remove"]

  @ViewChild('registriesTable', {read: MatTable})
  public registriesTable: MatTable<RegistryToken>

  public constructor(private _settings: Settings, private _dialog: MatDialog, private _formBuilder: FormBuilder, private _registriesService: DockerRegistriesService, private _snackbar: MatSnackBar) {

    this._registriesService.registries().subscribe((r) => {

      if (r != null) {
        this.registries = r
      }

      this.registries.push(new EditableRegistryToken())
    })

    this._settings.environments().subscribe((env) => {
      this.environments = env
    })

    this._settings.values().subscribe((v) => {

      this._defaultValues = v
      this._values = v
    })

    this.gitTypeCtrl = new FormControl()
    this.gitHostCtrl = new FormControl()
    this.gitUserCtrl = new FormControl()
    this.gitTokenCtrl = new FormControl()
    this.gitIsOrgCtrl = new FormControl()
    this.gitNameCtrl = new FormControl()
    this.gitPasswordCtrl = new FormControl()
    this.gitRepoCtrl = new FormControl()
    this.gitPackagesCtrl = new FormControl()
    this.gitConfigCtrl = new FormControl()

    this.dockerHostCtrl = new FormControl()
    this.dockerPortCtrl = new FormControl()
    this.dockerHttpsCtrl = new FormControl()
    this.dockerCertCtrl = new FormControl()

    this.k8sUrlCtrl = new FormControl()
    this.k8sTokenCtrl = new FormControl()
    this.k8sTypeCtrl = new FormControl("desktop")

    this.dockerCertificateCtrl = new FormControl()

    this.settingsForm = this._formBuilder.group({
      envCtrl: this.envCtrl,
      gitTypeCtrl: this.gitTypeCtrl,
      gitHostCtrl: this.gitHostCtrl,
      gitIsOrgCtrl: this.gitIsOrgCtrl,
      gitNameCtrl: this.gitNameCtrl,
      gitUserCtrl: this.gitUserCtrl,
      gitTokenCtrl: this.gitTokenCtrl,
      gitPasswordCtrl: this.gitPasswordCtrl,
      gitRepoCtrl: this.gitRepoCtrl,
      gitPackagesCtrl: this.gitPackagesCtrl,
      gitConfigCtrl: this.gitConfigCtrl,
      dockerHostCtrl: this.dockerHostCtrl,
      dockerPortCtrl: this.dockerPortCtrl,
      dockerHttpsCtrl: this.dockerHttpsCtrl,
      dockerCertCtrl: this.dockerCertCtrl,
      dockerCertificateCtrl: this.dockerCertificateCtrl,
      k8sUrlCtrl: this.k8sUrlCtrl,
      k8sTokenCtrl: this.k8sTokenCtrl,
      k8sTypeCtrl: this.k8sTypeCtrl
    })

    this.gitExpander = this._settings.gitExpander
    this.dockerExpander = this._settings.dockerExpander
    this.k8sExpander = this._settings.k8sExpander

    this.settingsForm.valueChanges.subscribe((d) => {

      if (this._ignoreChanges) {
        return
      }

      if (this.envCtrl.dirty) {
        this.changedEnvironment()
        this.envCtrl.markAsPristine()
        return
      }

      if (this.gitTypeCtrl.dirty) {

        this.gitTypeCtrl.markAsPristine()

        this._values.gitType = this.gitTypeCtrl.value == 'github' ? GitType.github : GitType.gitlab
      }

      if (this.gitHostCtrl.dirty) {
        this._values.gitUri = this.gitHostCtrl.value
      }

      if (this.gitIsOrgCtrl.dirty) {
        this.gitIsOrgCtrl.markAsPristine()

        this._ignoreChanges = true

        if (this.gitIsOrgCtrl.value) {
          this._values.gitName = this._oldName
          this.gitNameCtrl.setValue(this._values.gitName)
        } else {
          this._oldName = this._values.gitName
          this.gitNameCtrl.setValue(null)
          this._values.gitName = null
        }

        this._ignoreChanges = false
      }

      if (this.gitIsOrgCtrl.value && this.gitNameCtrl.dirty) {
        this.gitNameCtrl.markAsPristine()
        this._values.gitName = this.gitNameCtrl.value
      }

      if (this.gitUserCtrl.dirty) {
        this._values.gitUser = this.gitUserCtrl.value
        this.gitUserCtrl.markAsPristine()
      }

      if (this.gitTokenCtrl.dirty) {

        this._values.gitIsPACPassword = this.gitTokenCtrl.value ? 'true' : 'false'
        this.gitTokenCtrl.markAsPristine()
      }

      if (this.gitPasswordCtrl.dirty) {
        this._values.gitPassword = this.gitPasswordCtrl.value
        this.gitPasswordCtrl.markAsPristine()
      }

      if (this.gitRepoCtrl.dirty) {

        let repo: RepoSettings = this._values.repoForName(this.gitRepoCtrl.value)

        if (repo != null) {
          this._ignoreChanges = true
          this.gitPackagesCtrl.setValue(repo.packages)
          this.gitConfigCtrl.setValue(repo.configuration)
          this._ignoreChanges = false
        }

        this.gitRepoCtrl.markAsPristine()
      }

      if (this.gitPackagesCtrl.dirty) {

        let repo: RepoSettings = this._values.repoForName(this.gitRepoCtrl.value)

        if (repo) {
          repo.packages = this.gitPackagesCtrl.value
        }

        this.gitPackagesCtrl.markAsPristine()
      }

      if (this.gitConfigCtrl.dirty) {

        let repo: RepoSettings = this._values.repoForName(this.gitRepoCtrl.value)

        if (repo) {
          repo.configuration = this.gitConfigCtrl.value
        }

        this.gitConfigCtrl.markAsPristine()
      }

      if (this.dockerHostCtrl.dirty) {
        this._values.dockerHost = this.formatDockerHost(this.dockerHostCtrl.value, this.dockerPortCtrl.value)
        this.dockerHostCtrl.markAsPristine()
      }

      if (this.dockerPortCtrl.dirty) {
        this._values.dockerHost = this.formatDockerHost(this.dockerHostCtrl.value, this.dockerPortCtrl.value)
        this.dockerPortCtrl.markAsPristine()
      }

      if (this.dockerHttpsCtrl.dirty) {

        this._values.dockerUseHttps = this.dockerHttpsCtrl.value
        this.dockerHttpsCtrl.markAsPristine()
      }

      if (this.dockerCertCtrl.dirty) {
        //this._settings.dockerCert = this.dockerCertCtrl.value
        this.dockerCertCtrl.markAsPristine()
      }

      if (this.gitPasswordCtrl.dirty) {
        this._values.gitPassword = this.gitPasswordCtrl.value
        this.gitPasswordCtrl.markAsPristine()
      }

      if (this.dockerCertificateCtrl.dirty) {
        this._values.dockerCertificate = this.dockerCertificateCtrl.value
        this.dockerCertificateCtrl.markAsPristine()
      }

      if (this.k8sUrlCtrl.dirty) {
        this._values.k8sUrl = this.k8sUrlCtrl.value
        this.k8sUrlCtrl.markAsPristine()
      }

      if (this.k8sTokenCtrl.dirty) {
        this._values.k8sToken = this.k8sTokenCtrl.value
        this.k8sTokenCtrl.markAsPristine()
      }

      if (this.k8sTypeCtrl.dirty) {
        this._values.k8sType = this.k8sTypeCtrl.value
        this.k8sTypeCtrl.markAsPristine()
      }

      this._settings.saveChanges(this._values, this.envCtrl.value == 'Default' ? null : this.envCtrl.value)
    })

    this.setFormValues()
  }

  public certFileUploaded(response: any) {

    let filename: string = response.filename
    this.dockerCertificateCtrl.setValue(filename)
    this._values.dockerCertificate = filename
    this._settings.saveChanges(this._values, this.envCtrl.value == 'Default' ? null : this.envCtrl.value)
  }

  public changedEnvironment() {

    if (this.isExistingEnvironment()) {
      this.setFormValues()
    }
  }

  public addEnvironment() {
    this.environments.push(this.envCtrl.value)
    this.setFormValues()
  }

  public deleteEnvironment() {

    this._settings.removeEnvironment(this.envCtrl.value)

    var index = this.environments.indexOf(this.envCtrl.value)
    this.environments.splice(index, 1)
    this.envCtrl.setValue('Default', {emitEvent: false})

    this.setFormValues()
  }

  public isExistingEnvironment() {

    return this.environments.indexOf(this.envCtrl.value) != -1
  }

  public gotHostPlaceholder(): string {
    if (this._defaultValues == this._values) {
      return "Git host"
    } else {
      return "Git host: (default:" + this._defaultValues.gitUri + ")"
    }
  }

  public gitUserPlaceholder(): string {

    if (this._defaultValues == this._values) {
      return "GIT user"
    } else {
      return "GIT user (default: " + this._defaultValues.gitUser + ")"
    }
  }

  public gitPasswordPlaceholder() {

    let label: string

    if (this.gitTokenCtrl.value) {
      label = 'Access Token'
    } else {
      label = 'Password'
    }

    if (this._defaultValues == this._values) {
      return label
    } else {
      return label + "(default: " + this._defaultValues.gitPassword + ")"
    }
  }

  private setFormValues() {

    this.gitRepoCtrl.setValue('', {emitEvent: false})
    this.gitRepos = []
    this.gitHostCtrl.setValue('', {emitEvent: false})
    this.gitUserCtrl.setValue('', {emitEvent: false})
    this.gitPasswordCtrl.setValue('', {emitEvent: false})
    this.gitTypeCtrl.setValue('', {emitEvent: false})
    this.gitNameCtrl.setValue('', {emitEvent: false})
    this.gitIsOrgCtrl.setValue('', {emitEvent: false})
    this.gitTokenCtrl.setValue('', {emitEvent: false})
    this.gitPackagesCtrl.setValue('', {emitEvent: false})
    this.gitConfigCtrl.setValue('', {emitEvent: false})
    this.dockerHostCtrl.setValue('', {emitEvent: false})
    this.dockerPortCtrl.setValue('', {emitEvent: false})
    this.dockerCertificateCtrl.setValue('', {emitEvent: false})
    this.k8sUrlCtrl.setValue('', {emitEvent: false})
    this.k8sTokenCtrl.setValue('', {emitEvent: false})
    this.k8sTypeCtrl.setValue('desktop', {emitEvent: false})

    this._settings.values(this.envCtrl.value == 'Default' ? null : this.envCtrl.value, false).subscribe((v) => {

      if (this.envCtrl.value == 'Default') {
        this._defaultValues = v
      }

      this._values = v

      this.gitRepos = v.gitRepos

      this._ignoreChanges = true

      if (v.gitType == GitType.gitlab) {
        this.gitTypeCtrl.setValue('gitlab')
      } else {
        this.gitTypeCtrl.setValue('github')
      }

      this.gitHostCtrl.setValue(v.gitUri)

      this.gitUserCtrl.setValue(v.gitUser)
      this.gitNameCtrl.setValue(v.gitName)
      this.gitIsOrgCtrl.setValue(v.gitName != null)

      this.gitPasswordCtrl.setValue(v.gitPassword)

      if (v.gitIsPACPassword && v.gitIsPACPassword == 'true') {
        this.gitTokenCtrl.setValue(true)
      } else {
        this.gitTokenCtrl.setValue(false)
      }

      if (v.gitRepos) {
        this.gitRepoCtrl.setValue(v.gitRepos[0].name)
        this.gitPackagesCtrl.setValue(v.gitRepos[0].packages)
        this.gitConfigCtrl.setValue(v.gitRepos[0].configuration)
      }

      this.dockerHostCtrl.setValue(this.hostNameFromURI(v.dockerHost))
      this.dockerPortCtrl.setValue(this.portFromURI(v.dockerHost))
      this.dockerHttpsCtrl.setValue(this._values.dockerUseHttps)

      if (v.dockerCertificate) {
        let i = v.dockerCertificate.lastIndexOf('/')
        if (i != -1) {
          this.dockerCertificateCtrl.setValue(v.dockerCertificate.substring(i+1))
        } else {
          this.dockerCertificateCtrl.setValue(v.dockerCertificate)
        }
      }

      this.k8sUrlCtrl.setValue(v.k8sUrl)//.replace('localhost', window.location.hostname))
      this.k8sTokenCtrl.setValue(v.k8sToken)
      this.k8sTypeCtrl.setValue(v.k8sType == null ? "desktop" : v.k8sType)

      this._ignoreChanges = false
    })
  }

  private hostNameFromURI(url: string): string {

    if (url && url.lastIndexOf(':') != -1) {
      return url.substring(0, url.lastIndexOf(':'))
    } else {
      return url
    }
  }

  private portFromURI(url: string): string {

    if (url && url.lastIndexOf(':') != -1) {
      return url.substring(url.lastIndexOf(':') + 1)
    } else {
      return url
    }
  }

  private formatDockerHost(host: string, port: number): string {

    return host + ':' + port
  }

  public isExistingRepo(repo: string) {

    if (this._values && repo) {
      return this._values.repoForName(repo) != null
    } else {
      return false
    }
  }

  public addRepo() {

    this._values.gitRepos.push(new RepoSettings(trim(this.gitRepoCtrl.value), trim(this.gitPackagesCtrl.value), trim(this.gitConfigCtrl.value)))

    this.gitRepos = this._values.gitRepos

    this._settings.saveChanges(this._values, this.envCtrl.value == 'Default' ? null : this.envCtrl.value)
  }

  public deleteRepo() {

    let repo: RepoSettings = this._values.repoForName(trim(this.gitRepoCtrl.value))
    let index: number = this._values.gitRepos.indexOf(repo)
    this._values.gitRepos.splice(index, 1)

    this.gitRepos = this._values.gitRepos

    this._ignoreChanges = true
    this.gitRepoCtrl.setValue(null)
    this.gitPackagesCtrl.setValue(null)
    this.gitConfigCtrl.setValue(null)
    this._ignoreChanges = false

    this._settings.saveChanges(this._values, this.envCtrl.value == 'Default' ? null : this.envCtrl.value)
  }

  public repoSelectionChanged(event: any) {
    console.log('did change')
  }

  public controlForPanelElement(key: string, element: RegistryToken, value?: string): FormControl {

    let ctrl: FormControl = null

    const name: string = key + ':0' // element.position

    if (this.settingsForm.controls[name]) {
      ctrl = (this.settingsForm.controls[name] as FormControl)
    } else {
      ctrl = new FormControl(value)
      this._ignoreChanges = true
      this.settingsForm.addControl(name, ctrl)
      this._ignoreChanges = false
    }

    return ctrl
  }

  public updateElementWithControlValue(key: string, r: RegistryToken): void {

    r[key] = this.controlForPanelElement(key, r).value
  }

  public addRegistriesRow(row: RegistryToken): void {

    const r = new RegistryToken()
    r.name = row.name
    r.user = row.user
    r.token = row.token

    if (r.name && r.user && r.token) {
      this._registriesService.addRegistry(r).subscribe((success) => {

        if (success) {
          this.registries.splice(this.registries.length-1, 1, r)
          this.registries.push(new EditableRegistryToken())

          this.registriesTable.renderRows()
        } else {
          this._snackbar.open('I cannot comply at the moment!', 'Sorry', {
            duration: 2000,
          })
        }
      })
    }
  }

  public removeRegistryRow(r: RegistryToken): void {

    let found = -1

    for (let i = 0; i < this.registries.length; i++) {

      if (this.registries[i] === r) {
        found = i
      }
    }

    if (found !== -1) {
      this.settingsForm.removeControl('key:' + found)
      this.settingsForm.removeControl('type:' + found)
      this.settingsForm.removeControl('value:' + found)

      this.registries.splice(found, 1)
      this.registriesTable.renderRows()

      this._registriesService.removeRegistry(r.name).subscribe((success) => {

        if (!success) {
          this._snackbar.open('ach, deletion failed', 'Sorry', {
            duration: 2000,
          })
        }
      })
    }
  }

  public isValidNewRegistry(element: RegistryToken): boolean {
    return element.name != null && element.user != null && element.token != null
  }
}

class EditableRegistryToken extends RegistryToken {
  isEditable: boolean = true
}
