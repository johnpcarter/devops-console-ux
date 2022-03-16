import { BrowserModule }                                from '@angular/platform-browser'
import { BrowserAnimationsModule }                      from '@angular/platform-browser/animations'
import { NgModule }                                     from '@angular/core'
import { RouterModule, Routes, Route }                  from '@angular/router'

import { DragDropModule }                               from '@angular/cdk/drag-drop'
import { ScrollingModule }                              from '@angular/cdk/scrolling'
import { CdkTableModule }                               from '@angular/cdk/table'
import { CdkTreeModule }                                from '@angular/cdk/tree'

import { FormsModule,
          ReactiveFormsModule }                         from '@angular/forms'

import { HttpClientModule }                             from '@angular/common/http'; // v5 onwards
import { AppComponent }                                 from './app.component'
import { AboutComponent }                               from './components/about.component'

import 'hammerjs'

import { FontAwesomeModule }                            from '@fortawesome/angular-fontawesome'
import { library, dom }                                 from '@fortawesome/fontawesome-svg-core'

import { CancelCdkDrag }                                from './extras/directives/CancelCdkDrag.directive'

import { FileUploadModule }                             from "ng2-file-upload"
import { UPLOAD_DIRECTIVES }                            from './extras/ng2-uploader'

import { CanvasModule }                                 from '@ng-web-apis/canvas'

import { RuntimeK8sComponent }                          from './components/k8s/runtime-k8s.component'
import { RuntimeContainersComponent }                   from './components/runtime-containers.component'
import { RuntimeContainersListComponent }               from './components/runtime-containers-list.component'
import { RuntimeContainersGraphComponent }              from './components/runtime-containers-graph.component'

import { HomeComponent }                                from './components/home.component'
import { RuntimeDetailsComponent }                      from './components/k8s/runtime-details.component'
import { RuntimeActionsDirective }                      from './components/k8s/runtime-actions.directive'
import { RuntimeScaleComponent }                        from './components/k8s/runtime-scale.component'
import { RuntimeUpdateComponent }                       from './components/k8s/runtime-update.component'
import { BuildComponent }                               from './components/build.component'
import { BuildPackagesComponent }                       from './components/build-packages.component'
import { BuildPropertiesComponent }                     from './components/build-properties.component'
import { BuildPropertiesTableComponent }                from './components/build-properties-table.component'

import { BuildImageComponent }                          from './components/build-image.component'
import { RuntimeDeployComponent }                       from './components/runtime-deploy.component'
import { RuntimeStageComponent }                        from './components/runtime-stage.component'
import { BuildInstallComponent }                        from './components/build-install.component'

import { BuildImageChooseDirective }                    from './components/elements/build-image-choose.directive'

import { GitSourcesComponent }                          from './components/elements/git-sources.component'

import { MicroServiceBuilderComponent }                 from './components/plugins/micro-service-builder.component'
import { MicroServiceInstallerComponent }               from './components/plugins/micro-service-installer.component'
import { SettingsComponent }                            from './components/settings.component'
import { DockerImageChooserComponent }                  from './components/elements/docker-image-chooser.component'
import { UploadButtonComponent }                        from './components/elements/upload-button.component'

import { SimpleNameComponent }                          from './components/elements/simple-name.component'
import { EditContainerComponent }                       from './components/staging.component'
import { DockerImageInfoComponent }                     from './components/elements/docker-images-chips-list.component'

import { Settings }                                     from './settings'

import { DockerImagesListComponent }                    from './components/elements/docker-images-list.component'
import { DockerImagesChipListComponent }                from './components/elements/docker-images-chips-list.component'
import { DockerImageVersionsComponent }                 from './components/elements/docker-image-versions.component'
import { ContainersComponent }                          from './components/containers.component'
import { ContainerComponent }                           from './components/container.component'
import { StagingComponent }                             from './components/staging.component'
import { ActionComponent }                              from './components/action.component'
import { BuildCommandsComponent }                       from './components/build-commands.component'
import { PodsListComponent }                            from './components/k8s/pods-list.component'
import { DeploymentDetailsComponent }                   from './components/k8s/deployment-details.component'
import { DeploymentListComponent }                      from './components/k8s/deployment-list.component'
import { ServicePropertiesComponent }                   from './components/k8s/service-properties.component'

import { TestHistoryComponent }                         from './components/test-history.component'
import { TestRunComponent }                             from "./components/test-run.component"
import { BuildExeComponent }                            from './components/build-exe.component'

import { K8sService }                                   from './services/k8s.service'
import { GitSourceService }                             from './services/git-source-control.service'
import { DockerService }                                from './services/docker.service'
import { PackagesService }                              from './services/packages.service'
import { ResourceService }                              from './services/resources.service'
import { ConfigurationService }                         from './services/configuration.service'
import { TestTraceService }                             from "./services/test-trace.service"
import { RuntimeInspectionService }                     from "./services/runtime-inspection.service"
import { InstallerComponent }                           from "./components/plugins/installer.component"

import { MatTableModule } from '@angular/material/table'
import { MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatInputModule } from '@angular/material/input'
import { MatStepperModule } from '@angular/material/stepper'
import { MatCardModule } from '@angular/material/card'
import { MatRadioModule } from '@angular/material/radio'
import {MAT_CHECKBOX_DEFAULT_OPTIONS, MatCheckboxDefaultOptions, MatCheckboxModule} from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSliderModule } from '@angular/material/slider'
import { MatChipsModule } from '@angular/material/chips'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { ContainerTemplates } from './support/container.templates'

import { faDocker, faCloudscale } from '@fortawesome/free-brands-svg-icons'
import { faCircle } from '@fortawesome/free-regular-svg-icons'

import { faEllipsisV, faBars, faEraser, faFilter, faExternalLinkAlt, faTerminal, faTimesCircle, faBox, faBoxOpen, faVial, faRocket, faSpinner, faCheck, faBug, faHome, faExclamationCircle, faRunning, faCog, faEject, faPlay, faSquare, faExclamationTriangle, faLightbulb, faEnvelope, faStop, faStopCircle, faClock, faPlus, faTimes, faCloudSunRain,
    faMinus, faPlusCircle, faMinusCircle, faArrowUp, faArrowDown, faTrashAlt, faProjectDiagram, faComment, faStar, faFlag, faPen, faPenSquare, faHourglassEnd, faList, faArrowLeft, faArrowRight, faChevronCircleDown, faThumbsUp, faThumbsDown, faQuestion,
    faComments, faSync, faLevelUpAlt, faChevronDown, faCheckSquare, faCaretSquareDown, faCaretSquareUp, faArrowsAltV, faVials, faCodeBranch, faLock, faFileDownload, faTools, faFileUpload, faLockOpen, faUser, faSyncAlt,faUserCircle, faShare, faInfo, faCertificate, faClone, faPlusSquare, faMinusSquare, faCloudDownloadAlt, faCloudUploadAlt }  from '@fortawesome/free-solid-svg-icons'
import {MatTooltipModule} from '@angular/material/tooltip'
import {GitPackageChooserComponent} from './components/elements/git-package-chooser.component';
import {SimpleConfirmationComponent} from './components/elements/simple-confirmation.component';
import {ComboBoxComponent} from './components/elements/combo-box.component';
import {DockerRegistriesService} from './services/docker-registries.service';
import {MatTabsModule} from '@angular/material/tabs';

 library.add(faEllipsisV, faEraser, faFilter, faLock, faList, faBars, faArrowUp, faArrowDown, faTerminal, faBox, faBoxOpen, faTimes, faTimesCircle, faHome, faVial, faCheck, faPlay, faSpinner, faExclamationCircle, faBug, faLightbulb, faTrashAlt, faCloudscale, faCaretSquareDown, faCaretSquareUp, faPen, faLevelUpAlt, faVials, faCodeBranch, faArrowsAltV, faStopCircle, faSyncAlt, faCloudUploadAlt, faClock, faThumbsUp, faThumbsDown, faQuestion,
   faRocket, faCog, faCloudSunRain, faDocker, faCircle, faSquare, faProjectDiagram, faChevronDown, faCheckSquare, faExternalLinkAlt, faCheckSquare, faRunning, faArrowLeft, faArrowRight, faPlusCircle, faFileDownload, faFileUpload, faPlusSquare, faTools, faSync, faCloudDownloadAlt)

const sideNavRoutes: Routes = [
  {
      path: 'home',
      component: HomeComponent,
      data: {
        animation: 'home'
      }
    },
    {
      path: 'build',
      component: BuildComponent,
      data: {
        animation: 'build'
      }
    },
    {
      path: 'build/install',
      component: BuildInstallComponent,
      data: {
        animation: 'install'
      }
    },
    {
      path: 'build/install/:id',
      component: BuildInstallComponent,
      data: {
        animation: 'install'
      }
    },
    {
      path: 'build/properties',
      component: BuildPropertiesComponent,
        data: {
          animation: 'properties'
        }
    },
    {
        path: 'build/properties/:id',
        component: BuildPropertiesComponent,
        data: {
            animation: 'properties'
        }
    },
    {
      path: 'build/package',
      component: BuildPackagesComponent,
      data: {
        animation: 'package'
      }
    },
    {
      path: 'build/package/:id',
      component: BuildPackagesComponent,
      data: {
        animation: 'package'
      }
    },
    {
      path: 'build/image',
      component: BuildImageComponent,
      data: {
        animation: 'image'
      }
    },
    {
      path: 'build/image/:id',
      component: BuildImageComponent,
      data: {
        animation: 'build'
      }
    },
    {
      path: 'deploy',
      component: RuntimeContainersComponent,
      data: {
        animation: 'container'
      }
    },
    {
      path: 'deploy/run',
      component: RuntimeDeployComponent,
      data: {
        animation: 'run'
      }
    },
    {
      path: 'deploy/run/:id',
      component: RuntimeDeployComponent,
      data: {
        animation: 'run'
      }
    },
    {
      path: 'k8s',
      component: RuntimeK8sComponent,
      data: {
        animation: 'k8s'
      }
    },
    {
      path: 'k8s/scale',
      component: RuntimeDetailsComponent,
      data: {
        animation: 'scale'
      }
    },
    {
      path: 'k8s/update',
      component: RuntimeDetailsComponent,
      data: {
        animation: 'update'
      }
    },
    {
      path: 'test',
      component: TestRunComponent,
      data: {
        animation: 'run'
      }
    },
    {
      path: 'test/history',
      component: TestHistoryComponent,
      data: {
        animation: 'run'
      }
    },
    {
      path: 'deploy/stage',
      component: RuntimeStageComponent,
      data: {
        animation: 'stage'
      }
    },
    {
      path: 'settings',
      component: SettingsComponent,
       data: {
        animation: 'settings'
      }
    },
    {
      path: '',
      component: HomeComponent
    }
  ]

@NgModule({
  entryComponents: [
      AboutComponent,
      RuntimeScaleComponent,
      RuntimeUpdateComponent,
      MicroServiceBuilderComponent,
      MicroServiceInstallerComponent,
      GitSourcesComponent,
      GitPackageChooserComponent,
      InstallerComponent,
      DockerImageVersionsComponent,
      SimpleNameComponent,
      SimpleConfirmationComponent,
      ComboBoxComponent,
      EditContainerComponent,
      DockerImageInfoComponent,
      BuildExeComponent
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    ContainersComponent,
    ContainerComponent,
    ActionComponent,
    BuildCommandsComponent,
    StagingComponent,
    RuntimeContainersComponent,
    RuntimeContainersListComponent,
    RuntimeContainersGraphComponent,
    RuntimeK8sComponent,
    SettingsComponent,
    RuntimeDetailsComponent,
    RuntimeUpdateComponent,
    BuildComponent,
    BuildInstallComponent,
      BuildPropertiesComponent,
    BuildPropertiesTableComponent,
    BuildPackagesComponent,
    BuildImageComponent,
    RuntimeDeployComponent,
    RuntimeStageComponent,
    BuildImageChooseDirective,
    RuntimeActionsDirective,
    RuntimeScaleComponent,
    RuntimeUpdateComponent,
    DockerImagesListComponent,
    DockerImagesChipListComponent,
    DockerImageVersionsComponent,
    DeploymentListComponent,
    ServicePropertiesComponent,
    DeploymentDetailsComponent,
    PodsListComponent,
    MicroServiceBuilderComponent,
    MicroServiceInstallerComponent,
    GitSourcesComponent,
    SimpleNameComponent,
    SimpleConfirmationComponent,
      ComboBoxComponent,
    DockerImageChooserComponent,
    UploadButtonComponent,
    EditContainerComponent,
    DockerImageInfoComponent,
    TestHistoryComponent,
    TestRunComponent,
    BuildExeComponent,
    InstallerComponent,
      GitPackageChooserComponent,
      CancelCdkDrag,
    UPLOAD_DIRECTIVES
  ],
    imports: [
        RouterModule.forRoot(sideNavRoutes),
        DragDropModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        FileUploadModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatTableModule,
        MatAutocompleteModule,
        MatStepperModule,
        MatCardModule,
        MatSelectModule,
        MatRadioModule,
        MatInputModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        MatSliderModule,
        MatChipsModule,
        MatPaginatorModule,
        MatSnackBarModule,
        FontAwesomeModule,
        MatTooltipModule,
        CanvasModule,
        MatTabsModule
    ],
  providers: [
    Settings,
    DockerService,
    K8sService,
    GitSourceService,
    PackagesService,
    ResourceService,
    ConfigurationService,
    TestTraceService,
    ContainerTemplates,
    RuntimeInspectionService,
    DockerRegistriesService
  ],
  bootstrap: [AppComponent],
  exports: [
    CdkTableModule,
    CdkTreeModule,
    DragDropModule,
    ScrollingModule,
    RouterModule
  ]
})
export class AppModule {

  constructor() {

    let self:AppModule = this
  }
}
