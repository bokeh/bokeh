import type {HasProps} from "./has_props"

export class ModelResolver {
  protected _known_models: Map<string, typeof HasProps> = new Map()

  constructor(readonly parent: ModelResolver | null, models: (typeof HasProps)[] = []) {
    for (const model of models) {
      this.register(model)
    }
  }

  get(name: string): typeof HasProps | null
  get<M extends typeof HasProps>(name: string): M | null

  get(name: string): typeof HasProps | null {
    return this._known_models.get(name) ?? this.parent?.get(name) ?? null
  }

  register(model: typeof HasProps, force: boolean = false): void {
    const name = model.__qualified__
    if (force || this.get(name) == null) {
      this._known_models.set(name, model)
    } else {
      console.warn(`Model '${name}' was already registered with this resolver`)
    }
  }

  get names(): string[] {
    return [...this._known_models.keys()].sort()
  }
}
