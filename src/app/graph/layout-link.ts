import { ShapeCoords, ShapeLayer, ShapeType } from './shape-layer';
import { GraphRenderer } from './graph-renderer'

export class LayoutLink {

  public label: string
  private _startDeploymment: GraphRenderer
  private _endDeploymment: GraphRenderer

  constructor(label: string, startDeployment: GraphRenderer, public startShape: ShapeLayer, endDeployment: GraphRenderer, public endShape: ShapeLayer) {

    this.label = label
    this._startDeploymment = startDeployment
    this._endDeploymment = endDeployment
  }

  public fromCoords(): ShapeCoords {

    let fromCoords: ShapeCoords

    if (this.startShape.type == ShapeType.rect) {
      let centerX = this.startShape.coords(this._startDeploymment).x + this.startShape.width/2
      let centerY = this.startShape.coords(this._startDeploymment).y + this.startShape.height/2

      fromCoords = new ShapeCoords(centerX, centerY)
    } else {
      fromCoords = new ShapeCoords(this.startShape.coords(this._startDeploymment).x, this.startShape.coords(this._startDeploymment).y)
    }

    if (this.label) {
      let toCoords = this.toCoords()

      let labelx
      let labely

      if (toCoords.x > fromCoords.x) {
        labelx = (toCoords.x - fromCoords.x) / 2
        labelx += fromCoords.x
      } else {
        labelx = (fromCoords.x - toCoords.x) / 2
        labelx += toCoords.x
      }

      if (toCoords.y > fromCoords.y) {
        labely = (toCoords.y - fromCoords.y) / 2
        labely += fromCoords.y
      } else {
        labely = (fromCoords.y - toCoords.y) / 2
        labely += toCoords.y
      }

      fromCoords.titlex = labelx
      fromCoords.titley = labely
    }

    return fromCoords
  }

  public toCoords(): ShapeCoords {

    if (this.endShape.type == ShapeType.rect) {
      let centerX = this.endShape.coords(this._endDeploymment).x + this.endShape.width / 2
      let centerY = this.endShape.coords(this._endDeploymment).y + this.endShape.height / 2

      return new ShapeCoords(centerX, centerY)
    } else {
      return new ShapeCoords(this.endShape.coords(this._startDeploymment).x, this.endShape.coords(this._startDeploymment).y)
    }
  }
}
