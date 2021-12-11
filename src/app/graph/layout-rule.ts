import {ShapeLayer, ShapeType} from './shape-layer';

export enum LayoutContentType {
  deploymentCollection,
  msr,
  msrWithApiEnforcement,
  apiEnforcement,
  apiMgmt,
  storage,
  other
}

export enum ShapeWidthType {
  full,
  half,
  dynamic
}

export enum ShapeAlignment {
  left,
  center,
  right
}

export class LayoutMaster {

  public layoutRule: LayoutRule

  public constructor(public type: LayoutContentType, public useWidth: ShapeWidthType = ShapeWidthType.full, public alignment: ShapeAlignment = ShapeAlignment.center, public rules: LayoutRule[]) {
    this.layoutRule = new LayoutRule(null, type.toString(), ShapeType.rect, true, alignment, useWidth)
  }
}

export class LayoutRule {

  public constructor(public id: string, public name: string, public type: ShapeType = ShapeType.rect, public startOnNewRow: boolean = false, public alignment: ShapeAlignment = ShapeAlignment.center, public useWidth: ShapeWidthType = ShapeWidthType.half, public minWidth: number = ShapeLayer.DEFAULT_WIDTH, public minHeight: number = ShapeLayer.DEFAULT_HEIGHT) {
    
  }
}
