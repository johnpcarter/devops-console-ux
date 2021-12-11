import {ShapeLayer, ShapeSize, ShapeType} from './shape-layer';
import {LayoutRule, ShapeAlignment, ShapeWidthType} from './layout-rule';

export class GraphRenderer extends ShapeLayer {

  public TITLE_MARGIN: number = 50
  public MARGINX: number = 40
  public MARGINY: number = 20

  private layoutRule: LayoutRule
  private layoutRules: LayoutRule[] = []
  private lastMaxHeight: number = 0

  constructor(ref: any, context: any, layoutRule: LayoutRule, layoutRules: LayoutRule[]) {
    super(ref, context, ShapeType.rect)

    this.layoutRule = layoutRule
    this.layoutRules = layoutRules
    this.backgroundColor = "lightgray"
  }

  public render(objects: any[], availableWidth: number): ShapeSize {

    let width: number = this.layoutRule.useWidth == ShapeWidthType.half ? (availableWidth - (this.MARGINX*2) / 2) : availableWidth
    let rules = this.layoutRules
    let ypos: number = this.MARGINY

    while(rules.length > 0) {
      this.lastMaxHeight = 0
      rules = this.renderNextRow(rules, objects, ypos, width)
      ypos += this.lastMaxHeight + this.MARGINY
    }

    let maxY: number = 0
    let maxX: number = 0

    this.shapes.forEach((s) => {
      if (s.y + s.height > maxY) {
        maxY = s.y + s.height
      }
      if (s.x + s.width > maxX) {
        maxX = s.x + s.width
      }
    })

    if (this.layoutRule.useWidth == ShapeWidthType.full) {
      this.width = availableWidth - (this.MARGINX + 10)
    } else {
      this.width = maxX + this.shapes[0].x
    }

    this.height = maxY + this.TITLE_MARGIN

    return new ShapeSize(this.width, this.height)
  }

  public renderNextRow(rules: LayoutRule[], objects: any[], ypos: number, availableWidth): LayoutRule[] {

    // first loop, render each row in isolation to determine width and height

    let rowShapes: ShapeLayer[] = []
    let rowWidth = 0

    for (let i = 0; i < rules.length; i++) {

      if (i != 0 && rules[i].startOnNewRow) {
        rowWidth += this.MARGINX
        break
      }

      let obj = this.objectForRef(rules[i].id, rules[i].name, objects)
      let shape = this.renderObject(obj, rules[i], availableWidth)
      shape.x = rowWidth // assume left justification by default
      shape.y = ypos

      if (rowWidth + shape.width < availableWidth) {
        rowWidth += shape.width

        if (shape.height > this.lastMaxHeight) {
          this.lastMaxHeight = shape.height + shape.MARGINY + shape.TITLE_MARGIN
        }

        rowShapes.push(shape)
      }
      else {
        rowWidth += this.MARGINX
        break
      }
    }

    // reposition on x-axis if alignment is center or right justified

    if (this.layoutRule.alignment == ShapeAlignment.center) {

      let width: number = this.calcWidth(availableWidth, rowWidth, rowShapes.length)
      let xoffset

      // work out how much space we have over

      let spacing = (width - rowWidth) / (rowShapes.length + 1)

      if (rowShapes.length > 1) {
        xoffset = spacing
      } else {
        xoffset = width / 2 - (rowWidth/2)
      }

      rowShapes.forEach((r) => {
        r.x = xoffset
        xoffset += r.width + spacing
      })
    } else if (this.layoutRule.alignment == ShapeAlignment.right) {

      let width: number = this.calcWidth(availableWidth, rowWidth, rowShapes.length)

      let xoffset = width
      rowShapes.reverse().forEach((r) => {
        r.x = xoffset - r.width
        xoffset -= r.width + this.MARGINX
      })
    }

    rowShapes.forEach((s) => {
      this.shapes.push(s)
    })

    if (rowShapes.length < rules.length) {
      return rules.slice(rowShapes.length)
    } else {
      return []
    }
  }

  protected renderObject(object: any, l: LayoutRule, availableWidth: number): ShapeLayer {

    return new ShapeLayer(object, this._context, l.type)
  }

  private calcWidth(availableWidth: number, minWidth: number, itemCount: number): number {

    if (this.layoutRule.useWidth == ShapeWidthType.full) {
      return availableWidth
    } else if (this.layoutRule.useWidth == ShapeWidthType.half) {
      return (availableWidth / 2) - this.MARGINX
    } else {
      return minWidth + (itemCount * this.MARGINX)
    }
  }

  private objectForRef(id: string, name: string, containers: any[]): any {

    let found: any = null

    if (id != null) {
      for (let i=0; i<containers.length;i++) {
        if (containers[i].id == id) {
          found = containers[i]
          break
        }
      }
    }

    // try name

    if (found == null) {
      for (let i=0; i<containers.length;i++) {
        if (containers[i].name == name) {
          found = containers[i]
          break
        }
      }
    }

    return found
  }
}
