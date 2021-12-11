import {Container, ContainerType, RunSet} from '../models/project';
import {LayoutContentType, LayoutMaster, LayoutRule, ShapeAlignment, ShapeWidthType} from '../graph/layout-rule';
import {ShapeType} from '../graph/shape-layer';

export class ContainerLayoutTemplates {

  public static layoutDeployment(deployment: RunSet): LayoutMaster {

    let rules: LayoutRule[] = []

    deployment.deployments.forEach((d) => {

      let deploymentType: LayoutContentType = ContainerLayoutTemplates.determineDeploymentType(d.containers)

      if (deploymentType == LayoutContentType.msr || deploymentType == LayoutContentType.msrWithApiEnforcement) {
        rules.push(new LayoutRule(null, d.name, ShapeType.rect, false, ShapeAlignment.center, ShapeWidthType.dynamic))
      } else if (deploymentType == LayoutContentType.apiMgmt) {
        rules.push(new LayoutRule(null, d.name, ShapeType.rect, true, ShapeAlignment.center, ShapeWidthType.half))
      } else {
        rules.push(new LayoutRule(null, d.name, ShapeType.rect, false, ShapeAlignment.center, ShapeWidthType.dynamic))
      }
    })

    return new LayoutMaster(LayoutContentType.deploymentCollection, ShapeWidthType.full, ShapeAlignment.center, rules)
  }

  public static layoutContainers(containers: Container[]): LayoutMaster {

    let deploymentType: LayoutContentType = ContainerLayoutTemplates.determineDeploymentType(containers)

    if (deploymentType === LayoutContentType.msr || deploymentType === LayoutContentType.msrWithApiEnforcement) {
      return ContainerLayoutTemplates.layoutForMicroServiceLayer(containers, deploymentType)
    } else if (deploymentType == LayoutContentType.apiMgmt) {
      return new LayoutMaster(deploymentType, ShapeWidthType.full, ShapeAlignment.center, ContainerLayoutTemplates.addRemainingObjects([], containers))
    } else if (deploymentType == LayoutContentType.storage) {
      return new LayoutMaster(deploymentType, ShapeWidthType.dynamic, ShapeAlignment.left, ContainerLayoutTemplates.addRemainingObjects([], containers))

    } else {
      // other
      return new LayoutMaster(LayoutContentType.other, ShapeWidthType.full, ShapeAlignment.center, ContainerLayoutTemplates.addRemainingObjects([], containers))
    }
  }

  public static determineDeploymentType(containers: Container[]): LayoutContentType {

    let deploymentType: LayoutContentType

    containers.forEach((c) => {
      if (c.type == ContainerType.apimg) {
        if (deploymentType == LayoutContentType.msr) {
          deploymentType = LayoutContentType.msrWithApiEnforcement
        } else {
          deploymentType = LayoutContentType.apiEnforcement
        }
      } else if (c.type == ContainerType.msr) {
        if (deploymentType == LayoutContentType.apiEnforcement) {
          deploymentType = LayoutContentType.msrWithApiEnforcement
        } else {
          deploymentType = LayoutContentType.msr
        }
      } else if (deploymentType == null && (c.type == ContainerType.apigw || c.type == ContainerType.apipr)) {
        deploymentType = LayoutContentType.apiMgmt
      } else if (deploymentType == null && c.typeLabel == 'storage') {
        deploymentType = LayoutContentType.storage
      }
    })

    return deploymentType
  }

  public static layoutForMicroServiceLayer(containers: Container[], type: LayoutContentType): LayoutMaster {

    let rules: LayoutRule[] = []

    if (type == LayoutContentType.msrWithApiEnforcement) {

      // make sure micro gateway is first to render

      var mgContainers: Container[] = ContainerLayoutTemplates.containersForType('apimg', containers)

      for (let i = 0; i < mgContainers.length; i++) {
        rules.push(new LayoutRule(mgContainers[i].id, mgContainers[i].name, ShapeType.ellipse, i == 0, ShapeAlignment.center, ShapeWidthType.dynamic))
      }
    }

    var msrContainers: Container[] = ContainerLayoutTemplates.containersForType('msr', containers)

    for(let i = 0; i < msrContainers.length; i++) {
      rules.push(new LayoutRule(msrContainers[i].id, msrContainers[i].name, ShapeType.rect, i == 0, ShapeAlignment.center, ShapeWidthType.dynamic))
    }

    return new LayoutMaster(type, ShapeWidthType.dynamic, ShapeAlignment.center, ContainerLayoutTemplates.addRemainingObjects(rules, containers))
  }

  public static addRemainingObjects(rules: LayoutRule[], objects: any[]): LayoutRule[] {

    if (rules == null) {
      rules = []
    }

    objects.forEach((c) => {
      if (ContainerLayoutTemplates.objectNotIncluded(rules, c)) {
        rules.push(new LayoutRule(c.id, c.name, ShapeType.rect, c == objects[0], ShapeAlignment.center, ShapeWidthType.dynamic))
      }
    })

    return rules
  }

  public static objectNotIncluded(rules: LayoutRule[], container: any): boolean {

    let found: boolean = false

    for (let i = 0; i < rules.length; i++) {
      if (rules[i].name == container.name) {
        found = true
        break
      }
    }
    return !found
  }

  public static containersForType(type: string, containers: Container[]): Container[] {

    var out: Container[] = []

    containers.forEach((c) => {
      if (c.type == type) {
        out.push(c)
      }
    })

    return out
  }
}

