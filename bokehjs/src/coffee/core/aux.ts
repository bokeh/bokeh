export interface Class<T> {
  new (...args: any[]): T;
  prototype: T;
}
