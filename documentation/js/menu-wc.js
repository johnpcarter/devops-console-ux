'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">wm-devops-console documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' : 'data-target="#xs-components-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' :
                                            'id="xs-components-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                            <li class="link">
                                                <a href="components/AboutComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AboutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ActionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ActionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ApiGatewayInstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ApiGatewayInstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ApiMicroGatewayInstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ApiMicroGatewayInstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ApiPortalInstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ApiPortalInstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildCommandsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildCommandsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildExeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildExeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildImageComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildImageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildInstallComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildInstallComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BuildPackagesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildPackagesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ContainerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ContainerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ContainersComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ContainersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeploymentDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeploymentDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeploymentListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeploymentListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DockerImageChooserComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DockerImageChooserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DockerImageListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DockerImageListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DockerImageVersionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DockerImageVersionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditContainerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EditContainerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GitSourcesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">GitSourcesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HomeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">HomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">InstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MicroServiceBuilderComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MicroServiceBuilderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MicroServiceInstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MicroServiceInstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PodsListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PodsListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeContainersComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeContainersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeDeployComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeDeployComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeK8sComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeK8sComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeScaleComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeScaleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeStageComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeStageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RuntimeUpdateComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeUpdateComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SagImageAlerterComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SagImageAlerterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ServicePropertiesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ServicePropertiesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SettingsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SettingsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SimpleNameComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SimpleNameComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/StagingComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">StagingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestCaseComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TestCaseComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestDefinitionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TestDefinitionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestHistoryComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TestHistoryComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TestRunComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TestRunComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UMInstallerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UMInstallerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UploadButtonComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UploadButtonComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' : 'data-target="#xs-directives-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' :
                                        'id="xs-directives-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                        <li class="link">
                                            <a href="directives/BuildImageChooseDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">BuildImageChooseDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/CancelCdkDrag.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">CancelCdkDrag</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/NgFileDrop.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">NgFileDrop</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/NgFileSelect.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">NgFileSelect</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/RuntimeActionsDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">RuntimeActionsDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' : 'data-target="#xs-injectables-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' :
                                        'id="xs-injectables-links-module-AppModule-0769bb59d9fa4e9d0acdbdff5cd6e9cc"' }>
                                        <li class="link">
                                            <a href="injectables/ConfigurationService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContainerTemplates.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ContainerTemplates</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DockerService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>DockerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GitSourceService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>GitSourceService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/K8sService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>K8sService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PackagesService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>PackagesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ResourceService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ResourceService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Settings.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>Settings</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TestConfigService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>TestConfigService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TestTraceService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>TestTraceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Action.html" data-type="entity-link">Action</a>
                            </li>
                            <li class="link">
                                <a href="classes/Action-1.html" data-type="entity-link">Action</a>
                            </li>
                            <li class="link">
                                <a href="classes/API.html" data-type="entity-link">API</a>
                            </li>
                            <li class="link">
                                <a href="classes/APIDefinition.html" data-type="entity-link">APIDefinition</a>
                            </li>
                            <li class="link">
                                <a href="classes/APIPolicy.html" data-type="entity-link">APIPolicy</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppPage.html" data-type="entity-link">AppPage</a>
                            </li>
                            <li class="link">
                                <a href="classes/Arg.html" data-type="entity-link">Arg</a>
                            </li>
                            <li class="link">
                                <a href="classes/ArgDisplayType.html" data-type="entity-link">ArgDisplayType</a>
                            </li>
                            <li class="link">
                                <a href="classes/Authentication.html" data-type="entity-link">Authentication</a>
                            </li>
                            <li class="link">
                                <a href="classes/BuildCommand.html" data-type="entity-link">BuildCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/Builder.html" data-type="entity-link">Builder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BuilderProperties.html" data-type="entity-link">BuilderProperties</a>
                            </li>
                            <li class="link">
                                <a href="classes/BuildImage.html" data-type="entity-link">BuildImage</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommitInfo.html" data-type="entity-link">CommitInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/Container.html" data-type="entity-link">Container</a>
                            </li>
                            <li class="link">
                                <a href="classes/DependencyWrapper.html" data-type="entity-link">DependencyWrapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Deployment.html" data-type="entity-link">Deployment</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeploymentSet.html" data-type="entity-link">DeploymentSet</a>
                            </li>
                            <li class="link">
                                <a href="classes/DockerBuild.html" data-type="entity-link">DockerBuild</a>
                            </li>
                            <li class="link">
                                <a href="classes/DockerContainer.html" data-type="entity-link">DockerContainer</a>
                            </li>
                            <li class="link">
                                <a href="classes/DockerImage.html" data-type="entity-link">DockerImage</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileInfo.html" data-type="entity-link">FileInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/GitRepo.html" data-type="entity-link">GitRepo</a>
                            </li>
                            <li class="link">
                                <a href="classes/GitSelectionModel.html" data-type="entity-link">GitSelectionModel</a>
                            </li>
                            <li class="link">
                                <a href="classes/Installer.html" data-type="entity-link">Installer</a>
                            </li>
                            <li class="link">
                                <a href="classes/K8sDeployment.html" data-type="entity-link">K8sDeployment</a>
                            </li>
                            <li class="link">
                                <a href="classes/K8sDeploymentDefinition.html" data-type="entity-link">K8sDeploymentDefinition</a>
                            </li>
                            <li class="link">
                                <a href="classes/K8sPod.html" data-type="entity-link">K8sPod</a>
                            </li>
                            <li class="link">
                                <a href="classes/LivePods.html" data-type="entity-link">LivePods</a>
                            </li>
                            <li class="link">
                                <a href="classes/LivePodsCount.html" data-type="entity-link">LivePodsCount</a>
                            </li>
                            <li class="link">
                                <a href="classes/Payload.html" data-type="entity-link">Payload</a>
                            </li>
                            <li class="link">
                                <a href="classes/Port.html" data-type="entity-link">Port</a>
                            </li>
                            <li class="link">
                                <a href="classes/Probe.html" data-type="entity-link">Probe</a>
                            </li>
                            <li class="link">
                                <a href="classes/Project.html" data-type="entity-link">Project</a>
                            </li>
                            <li class="link">
                                <a href="classes/RepoSettings.html" data-type="entity-link">RepoSettings</a>
                            </li>
                            <li class="link">
                                <a href="classes/Result.html" data-type="entity-link">Result</a>
                            </li>
                            <li class="link">
                                <a href="classes/RunSet.html" data-type="entity-link">RunSet</a>
                            </li>
                            <li class="link">
                                <a href="classes/Scope.html" data-type="entity-link">Scope</a>
                            </li>
                            <li class="link">
                                <a href="classes/SearchObj.html" data-type="entity-link">SearchObj</a>
                            </li>
                            <li class="link">
                                <a href="classes/Server.html" data-type="entity-link">Server</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServiceInfo.html" data-type="entity-link">ServiceInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/Source.html" data-type="entity-link">Source</a>
                            </li>
                            <li class="link">
                                <a href="classes/Sources.html" data-type="entity-link">Sources</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceWrapper.html" data-type="entity-link">SourceWrapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Stage.html" data-type="entity-link">Stage</a>
                            </li>
                            <li class="link">
                                <a href="classes/Test.html" data-type="entity-link">Test</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestCase.html" data-type="entity-link">TestCase</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestSuite.html" data-type="entity-link">TestSuite</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadedFile.html" data-type="entity-link">UploadedFile</a>
                            </li>
                            <li class="link">
                                <a href="classes/Values.html" data-type="entity-link">Values</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebSocketService.html" data-type="entity-link">WebSocketService</a>
                            </li>
                            <li class="link">
                                <a href="classes/WmPackageInfo.html" data-type="entity-link">WmPackageInfo</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/APIGatewayService.html" data-type="entity-link">APIGatewayService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/Ng2Uploader.html" data-type="entity-link">Ng2Uploader</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActionsComponent.html" data-type="entity-link">ActionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BuilderComponent.html" data-type="entity-link">BuilderComponent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BuildParams.html" data-type="entity-link">BuildParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PropertiesChangedOwner.html" data-type="entity-link">PropertiesChangedOwner</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});