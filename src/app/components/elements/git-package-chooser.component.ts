import { Component, Inject, OnChanges, OnInit, SimpleChanges }  from '@angular/core';
import { Repository }                                           from '../../models/git-source';
import { MAT_DIALOG_DATA, MatDialogRef }                        from '@angular/material/dialog';
import {Settings, Values} from '../../settings';
import {SourceWrapper} from './git-sources.component';
import {SelectionModel} from '@angular/cdk/collections';
import {WmPackageInfo} from '../../models/wm-package-info';

@Component({
    selector: 'git-package-source',
    templateUrl: '../../templates/elements/git-package-source.html'
})

export class GitPackageChooserComponent implements OnInit
{
    public dependencyDisplayedColumns: string[] = ['select', 'repository', 'package', 'description', 'tests']

    public dialogRef: MatDialogRef<GitPackageChooserComponent>
    public repoName: string

    public dependencies: WmPackageInfo[]
    public selectedDependencies: SelectionModel<WmPackageInfo> = new SelectionModel<WmPackageInfo>(true, [])

    private _repository: Repository
    private _values: Values

    private _gitSelectionModel: SelectionModel<any>
    private _freshReload = false
    private _apiEnabled = true

    constructor(dialogRef: MatDialogRef<GitPackageChooserComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private _settings: Settings) {

        this.dialogRef = dialogRef;
        this._repository = data.repository
        this.repoName = this._repository.name

        this._settings.values().subscribe((v) => {

            this._values = v

        })
    }

    ngOnInit(): void {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    public deploymentSetPackages(): string[] {

        if (this._repository != null && this._repository.include != null) {

            return this._repository.include
        } else {
            return []
        }
    }
    public gitAPIActivated(active: boolean) {
        this._apiEnabled = active
    }

    public selectedSourcesDidLoad(sourceWrapper: SourceWrapper) {

        this._gitSelectionModel = sourceWrapper.model
        this.selectPackagesForCurrentDeploymentSet()
    }

    private selectPackagesForCurrentDeploymentSet() {

        if (this._repository) {

            if (this._gitSelectionModel) {
                this._gitSelectionModel.select(this._repository)
            }
        }
    }

    public selectedSourcesDidChange(sourceWrapper: SourceWrapper) {

        this._freshReload = false

        this._repository.include = sourceWrapper.source.repositories[0].include
        this._repository.exclude = sourceWrapper.source.repositories[0].exclude

        this._gitSelectionModel = sourceWrapper.model
    }
}
