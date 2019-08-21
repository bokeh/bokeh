import {DataSet} from "vis-data"

declare module "vis-graph3d" {
  export type Point3d = {
    x: number
    y: number
    z: number
  }

  export class Graph3d {
    constructor(el: HTMLElement, data: DataSet<Point3d>, options: object)
    setData(data: DataSet<Point3d>): void
  }
}
