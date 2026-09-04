import {afterNextRender, Component, Directive, ElementRef, EventEmitter, Input, Output, ViewChild, inject} from "@angular/core"
import type {OnChanges, OnDestroy, SimpleChanges} from "@angular/core"

import {DocumentMountController, MountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel} from "@bokeh/framework"
import type {BokehMount, MountOptions} from "@bokeh/bokehjs"

@Component({
  selector: "bokeh-plot",
  standalone: true,
  template: "<div #target></div>",
  styles: ":host { display: block; }",
})
/** Angular component that owns one target and disposes its core mount on destroy. */
export class BokehComponent implements OnChanges, OnDestroy {
  /** The Bokeh root, roots array, or document to render in one mount. */
  @Input({required: true}) model!: BokehModel
  /** Options forwarded to Bokeh's mount() API. */
  @Input() mountOptions?: MountOptions

  @Output() readonly bokehMounted = new EventEmitter<BokehMount>()
  @Output() readonly bokehDisposed = new EventEmitter<BokehMount>()
  @Output() readonly bokehMountError = new EventEmitter<unknown>()

  @ViewChild("target", {static: true}) private _target!: ElementRef<HTMLElement>

  mounted: BokehMount | null = null

  private readonly _controller = new MountController()
  private _view_ready = false
  private _destroyed = false

  constructor() {
    afterNextRender(() => {
      if (!this._destroyed) {
        this._view_ready = true
        this._mount()
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this._view_ready && (Object.hasOwn(changes, "model") || Object.hasOwn(changes, "mountOptions"))) {
      this._mount()
    }
  }

  ngOnDestroy(): void {
    this._destroyed = true
    this._controller.dispose()
    this.mounted = null
  }

  private _mount(): void {
    void this._controller.start(this.model, this._target.nativeElement, {
      mountOptions: this.mountOptions,
      onMounted: (mounted) => {
        this.mounted = mounted
        this.bokehMounted.emit(mounted)
      },
      onDisposed: (mounted) => {
        if (this.mounted == mounted) {
          this.mounted = null
        }
        this.bokehDisposed.emit(mounted)
      },
      onError: (error) => this.bokehMountError.emit(error),
    })
  }
}

@Component({
  selector: "bokeh-document",
  standalone: true,
  template: "<ng-content></ng-content>",
  styles: ":host { display: contents; }",
})
/** Angular provider for one shared document mount and descendant root directives. */
export class BokehDocumentComponent implements OnChanges, OnDestroy {
  /** Roots rendered by descendant elements carrying the bokehRoot directive. */
  @Input({required: true}) models!: readonly BokehRootModel[]
  @Input() mountOptions?: MountOptions

  @Output() readonly bokehMounted = new EventEmitter<BokehMount>()
  @Output() readonly bokehDisposed = new EventEmitter<BokehMount>()
  @Output() readonly bokehMountError = new EventEmitter<unknown>()

  mounted: BokehMount | null = null

  private readonly _controller = new DocumentMountController()

  ngOnChanges(): void {
    this._controller.update(this.models, {
      mountOptions: this.mountOptions,
      onMounted: (mounted) => {
        this.mounted = mounted
        this.bokehMounted.emit(mounted)
      },
      onDisposed: (mounted) => {
        if (this.mounted == mounted) {
          this.mounted = null
        }
        this.bokehDisposed.emit(mounted)
      },
      onError: (error) => this.bokehMountError.emit(error),
    })
  }

  attach(model: BokehRootModel, target: HTMLElement): () => void {
    return this._controller.attach(model, target)
  }

  ngOnDestroy(): void {
    this._controller.dispose()
    this.mounted = null
  }
}

@Directive({
  selector: "[bokehRoot]",
  standalone: true,
})
/** Selectively attach one declared root to the host element. */
export class BokehRootDirective implements OnChanges, OnDestroy {
  @Input({required: true}) bokehRoot!: BokehRootModel

  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly _document = inject(BokehDocumentComponent)
  private _detach: (() => void) | null = null

  ngOnChanges(): void {
    this._detach?.()
    this._detach = this._document.attach(this.bokehRoot, this._element.nativeElement)
  }

  ngOnDestroy(): void {
    this._detach?.()
    this._detach = null
  }
}
