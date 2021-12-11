
export class ShapeSize {

  constructor(public width: number, public height: number) {

  }
}

export enum ShapeType {
  rect,
  ellipse,
}

export class ShapeCoords {

  public titlex: number
  public titley: number
  public subTitlex: number

  constructor(public x: number, public y: number, public width: number = ShapeLayer.DEFAULT_WIDTH, public height: number = ShapeLayer.DEFAULT_HEIGHT) {

  }
}

export class ShapeLayer {

  public static DEFAULT_WIDTH: number = 75
  public static DEFAULT_HEIGHT: number = 75

  public TITLE_MARGIN: number = 50
  public MARGINX: number = 20
  public MARGINY: number = 20

  public referencedObject: any
  public title: string
  public titleColor: string
  public subTitle: string
  public subTitleColor: string

  x: number = 0
  y: number = 0

  public width: number = ShapeLayer.DEFAULT_WIDTH
  public height: number = ShapeLayer.DEFAULT_HEIGHT

  public type: ShapeType = ShapeType.rect

  public backgroundColor: string

  public shapes: ShapeLayer[] = []

  protected _context: any

  public constructor(ref: any, context: any, type: ShapeType, coords?: ShapeCoords) {

    this.referencedObject = ref

    if (typeof(ref) == 'string')
      this.title = ref
    else
      this.title = ref.name

    this._context = context
    this.backgroundColor = "gray"
    this.type = type

    if (coords) {

      if (coords.width)
        this.width = coords.width

      if (coords.height)
        this.height = coords.height

      if (this.type == ShapeType.rect) {
        this.x = coords.x
        this.y = coords.y
      } else {
        this.width = this.width / 2
        this.height = this.height / 2

        this.x = coords.x - (this.width/2)
        this.y = coords.y = (this.height/2)
      }
    } else {
      if (this.type == ShapeType.ellipse) {
        this.width = this.width / 2
        this.height = this.height / 2
      }
    }
  }

  public isRect(): boolean {
    return this.type == ShapeType.rect
  }

  public isEllipse(): boolean {
    return this.type == ShapeType.ellipse
  }

  public setOrigin(x: number, y: number) {

    this.x = x
    this.y = y
  }

  public coords(parent?: ShapeLayer): ShapeCoords {

    let coords

    let width = this.width +(this.MARGINX)

    let w: number = 100
    let s: number = 100

    if (this._context) {
      w = this._context.measureText(this.title).width / 2
      s = this._context.measureText(this.subTitle).width / 2
    }

    let x = this.x
    let y = this.y
    let tx
    let ts

    let ty = y + this.height

    if (this.type == ShapeType.ellipse) {

      x += this.width / 2
      y += this.height / 2

      tx = x - w
      ts = x - s
      ty += 30

    } else {

      tx = x + ((width/2) - w)
      ts = x + ((width/2) - s)
      ty += 25
    }

    if (parent) {
      coords = new ShapeCoords(parent.x + x, parent.y + y)
      coords.titlex = (parent.x - this.MARGINX) + tx
      coords.titley = parent.y + ty
      coords.subTitlex = (parent.x - this.MARGINX) + ts
    } else {
      coords = new ShapeCoords(x, y)
      coords.titlex = tx
      coords.titley = ty
      coords.subTitlex = ts
    }

    coords.width = this.width
    coords.height = this.height

    return coords
  }
}
