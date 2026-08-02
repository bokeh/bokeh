import {afterNextRender, Component, EventEmitter, Input, Output, ViewChild} from "@angular/core"
import type {ElementRef, OnChanges, OnDestroy, SimpleChanges} from "@angular/core"

import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"
import type {BokehMount, MountOptions} from "@bokeh/bokehjs"

@Component({
  selector: "bokeh-plot",
  standalone: true,
  template: "<div #target></div>",
  styles: ":host { display: block; }",
})
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
