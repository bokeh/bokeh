export interface Class<T> {
  new (...args: any[]): T;
  prototype: T;
}

export type Constructor<T = {}> = new (...args: any[]) => T
