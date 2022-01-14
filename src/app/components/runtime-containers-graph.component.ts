import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Router} from '@angular/router';

import {MatDialog} from '@angular/material/dialog';
import { Container} from '../models/container';
import { RunSet} from '../models/project';
import {ConfigurationService} from '../services/configuration.service';
import {DockerService} from '../services/docker.service';
import {TestTraceService} from '../services/test-trace.service';

import {ShapeCoords, ShapeLayer, ShapeType} from '../graph/shape-layer';
import {LayoutLink} from '../graph/layout-link';
import {GraphRenderer} from '../graph/graph-renderer';
import {LayoutMaster, LayoutRule} from '../graph/layout-rule';
import {ContainerLayoutTemplates} from '../support/container.layout';

import {Settings} from '../settings';

import * as $ from 'jquery';
import {RuntimeInspectionService} from '../services/runtime-inspection.service';

@Component({
  selector: 'runtime-containers-graph',
  templateUrl: '../templates/runtime-containers-graph.html',
  styleUrls: ['../templates/runtime-containers.css']
})

export class RuntimeContainersGraphComponent implements OnInit, OnDestroy {

  @Input()
  public containers: Container[]

  @Input()
  public selectedDeployment: RunSet

  @Input()
  public useFullWidth: boolean = true

  @Output()
  public stopContainerEvent: EventEmitter<Container> = new EventEmitter()

  public root: ShapeLayer
  public links: LayoutLink[] = []

  private _host: string
  private _context: any
  private _currentLayout: LayoutMaster
  private _lastSelection: string

	public constructor(private _router: Router, private _settings: Settings, private _configService: ConfigurationService, private _dialog: MatDialog,
		private _dockerService: DockerService, private _testMgr: TestTraceService, private _runtimeService: RuntimeInspectionService, private _sanitizer: DomSanitizer) {

	}

  public ngOnInit() {

    this._settings.values().subscribe((s) => {
      if (s.dockerHost)
        this._host = s.dockerHost.substring(0, s.dockerHost.indexOf(":"))
      else
        this._host = "localhost"

      if (this._host == 'host.docker.internal')
        this._host = 'localhost'

      this._settings.setCurrentPage('deploy')
    })

    let canvas = document.getElementById('runtime-container-graph')
    this._context = (<any> canvas).getContext('2d')
    //this._context.scale(2, 2)

    this.deploymentSelectionChanged(true)
  }

  public ngOnChanges() {

    this.deploymentSelectionChanged()
  }

  public ngOnDestroy() {

  }

  public deploymentSelectionChanged(onInit?: boolean) {

	  if (this.containers.length == 0 && !this.selectedDeployment)
	    return

	  this.render()
  }

  public render() {

    if (this._context && this.root) {
      this._context.clearRect(0, 0, this.availableWidth(), this.root.height)
    }

    if (this.selectedDeployment) {

      if (this._lastSelection != this.selectedDeployment.name) {
        this._currentLayout = ContainerLayoutTemplates.layoutDeployment(this.selectedDeployment)
      }

      this.root = new DeploymentShapeLayer(this.selectedDeployment, this._context, this._currentLayout.layoutRule, this._currentLayout.rules, this.containers);
      (<DeploymentShapeLayer> this.root).render(this.selectedDeployment.deployments, this.availableWidth())

      this._lastSelection = this.selectedDeployment.name

    } else {

      if (this._lastSelection != "all") {
        this._currentLayout = ContainerLayoutTemplates.layoutContainers(this.containers)
      }

      let d = new DeploymentShapeLayer("All Containers", this._context, this._currentLayout.layoutRule, this._currentLayout.rules, this.containers)
      d.render(this.containers, this.availableWidth())

      this.root = new ShapeLayer("All Containers", this._context, ShapeType.rect)
      d.setOrigin(d.MARGINX, d.MARGINY)
      this.root.shapes.push(d)
      this.root.height = d.height + (d.MARGINY * 2)
      this._lastSelection = "all"
    }

    this.root.x = this.availableWidth() / 2 - (this.root.width/2)
    this.root.y = this.root.MARGINY

    this.connectDeployments()
    this.connectRuntimeDeployments()
  }

  public connectDeployments() {

    this.root.shapes.forEach((d) => {
      this.connectContainers(<DeploymentShapeLayer> d)
    })
  }

  private connectContainers(d: DeploymentShapeLayer) {

    d.shapes.forEach((s) => {
      if (s instanceof DeploymentShapeLayer) {
        this.connectContainers(s)
      } else {
        if ((<ContainerShapeLayer> s).container.type == 'apigw') {
          this.buildLinksFromAPIGateway(<GraphRenderer> d, <ContainerShapeLayer> s)
        } else if ((<ContainerShapeLayer> s).container.type == 'apimg') {
          this.buildStaticLinksFromMicroGateway(<GraphRenderer> d, <ContainerShapeLayer> s)
        } else if ((<ContainerShapeLayer> s).container.type == 'msr') {

        } else {

        }
      }
    })
  }

  public connectRuntimeDeployments(d?: DeploymentShapeLayer) {

    let q = d || this.root

    q.shapes.forEach((s) => {
      if (s instanceof DeploymentShapeLayer) {
        this.connectRuntimeDeployments(<DeploymentShapeLayer> s)
      } else if ((<ContainerShapeLayer> s).container.type == 'apimg') {
          this.buildDynamicLinksFromMicroGateway(<DeploymentShapeLayer> d, <ContainerShapeLayer> s)
      } else if ((<ContainerShapeLayer> s).container.type == 'msr') {
        this.buildAdapterLinksFromMicroServiceRuntime(<DeploymentShapeLayer> d, <ContainerShapeLayer> s)
      }
    })
  }

  public buildAdapterLinksFromMicroServiceRuntime(deployment: DeploymentShapeLayer, containerShape: ContainerShapeLayer) {

    this._runtimeService.msrStatus(this.selectedDeployment.name, containerShape.container.name, this._settings.currentEnvironment).subscribe((response) => {

      response.forEach((r) => {

        r.connections.forEach((c) => {
          c.connectionDataList.forEach((cc) => {
              this.linkFrom(deployment, containerShape, cc.endpoint, c.adapterTypeName)
          })
        })
      })
    })
  }

  public buildDynamicLinksFromMicroGateway(deployment: DeploymentShapeLayer, containerShape: ContainerShapeLayer) {

    this._runtimeService.microgatewayStatus(this.selectedDeployment.name, containerShape.container.name, this._settings.currentEnvironment).subscribe((response) => {

      response.forEach((r) => {
        r.apis.forEach((a) => {
          this.linkFrom(deployment, containerShape, a.endpoint, name)
        })
      })
    })
  }

  private buildStaticLinksFromMicroGateway(deployment: GraphRenderer, containerShape: ContainerShapeLayer) {

    this.root.shapes.forEach((d) => {
      (<GraphRenderer> d).shapes.forEach((c) => {
        let cc: ContainerShapeLayer = <ContainerShapeLayer> c

        if (cc.container.type == 'apigw') {
          // check if our micro gateway is hooked up

          if (containerShape.container.environmentSettings().environmentVariable('mcgw_api_gateway_url').target.indexOf(cc.container.name) != -1) {
            let l = new LayoutLink("policies & monitoring", deployment, containerShape, <GraphRenderer> d, cc)
            this.links.push(l)
          }
        }
      })
    })
  }

  private linkFrom(fromDeployment: DeploymentShapeLayer, fromShape: ContainerShapeLayer, endpointName, label?: string) {

    this.root.shapes.forEach((toDeployment) => {
      (<DeploymentShapeLayer> toDeployment).shapes.forEach((c) => {
        let toShape: ContainerShapeLayer = <ContainerShapeLayer> c

        if (toShape.container.name == endpointName) {
          let l = new LayoutLink(label || "invokes", fromDeployment, fromShape, <DeploymentShapeLayer> toDeployment, toShape)
          this.links.push(l)
        }
      })
    })
  }

  private buildLinksFromAPIGateway(deployment: GraphRenderer, containerShape: ContainerShapeLayer) {

	  let elkEndPoint = containerShape.container.environmentSettings().environmentVariable('apigw_elasticsearch_hosts').target

	  if (elkEndPoint != null) {
      this.root.shapes.forEach((d) => {
        (<GraphRenderer>d).shapes.forEach((c) => {
          let cc: ContainerShapeLayer = <ContainerShapeLayer>c

          if (elkEndPoint.indexOf(cc.container.name) != -1) {
            let l = new LayoutLink("storage", deployment, containerShape, <GraphRenderer> d, cc)
            this.links.push(l)
          } else if (cc.container.type == 'apipr') {
            let l = new LayoutLink("deploy", deployment, containerShape, <GraphRenderer> d, cc)
            this.links.push(l)
          }
        })
      })
    }
  }

  public availableWidth(): number {
    return $('#runtime-containers-page').width() - 80
  }

  public requiredHeight(): number {
    if (this.root) {
      return this.root.height
    } else {
      return 500
    }
  }
}

export class DeploymentShapeLayer extends GraphRenderer {

  public TITLE_MARGIN: number = 80

  public liveContainers: Container[]

  constructor(ref: any, context: any, layoutRule: LayoutRule, layoutRules: LayoutRule[], liveContainers: Container[]) {
    super(ref, context, layoutRule, layoutRules)
    this.liveContainers = liveContainers
  }

  protected renderObject(object: any, l: LayoutRule, availableWidth: number): ShapeLayer {

    let shape

    if (object instanceof Container) {
      shape = new ContainerShapeLayer(this.liveContainer(object), this._context, l.type)
    } else {

      if (object.deployments) {
        shape = new DeploymentShapeLayer(object, this._context, l, ContainerLayoutTemplates.layoutContainers(object.deployments).rules, this.liveContainers)
        shape.render(object.deployments, availableWidth)
      } else if (object.containers) {
        shape = new DeploymentShapeLayer(object, this._context, l, ContainerLayoutTemplates.layoutContainers(object.containers).rules, this.liveContainers)
        shape.render(object.containers, availableWidth)
      }
    }

    return shape
  }

  private liveContainer(originalContainer: Container): Container {

    let found = null

    for (let i = 0; i < this.liveContainers.length; i++) {
      if (this.liveContainers[i].name.indexOf(originalContainer.name) != -1) {
        found = this.liveContainers[i]
        break
      }
    }

    return found || originalContainer
  }
}

export class ContainerShapeLayer extends ShapeLayer {

  public container: Container

  constructor(container: Container, context: any, type?: ShapeType, coords?: ShapeCoords) {

    super(container.type == "apimg" ? "Micro Gateway" : container.description, context, type, coords)

    this.container = container
    this.subTitle = container.type == "msr" ? container.name : null
    this.backgroundColor = this.isAlive() ? "lightblue" : 'lightgrey'
  }

  public isAlive() {

    return this.container.state && this.container.state == 'running'
  }
}
