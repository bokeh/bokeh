declare module "slickgrid/plugins/slick.rowselectionmodel" {
  class RowSelectionModel<T extends Slick.SlickData, E> extends Slick.SelectionModel<T, E> {
    constructor(options?: {selectActiveRow: boolean})
    getSelectedRows(): number[]
    setSelectedRows(rows: number[]): void
    getSelectedRanges(): number[]
    setSelectedRanges(ranges: number[]): void
  }
}

declare module "slickgrid/plugins/slick.checkboxselectcolumn" {
  export interface CheckBoxSelectColumnOptions extends Slick.PluginOptions {
    columnId?: string
    cssClass?: string
    toolTip?: string
    width?: number
  }

  export class CheckboxSelectColumn<T extends Slick.SlickData> extends Slick.Plugin<T> {
    constructor(options?: CheckBoxSelectColumnOptions)
    init(grid: Slick.Grid<T>): void
    destroy(): void
    getColumnDefinition(): Slick.ColumnMetadata<T>
  }
}

declare module "slickgrid/plugins/slick.cellexternalcopymanager" {
  export interface CellExternalCopyManagerOptions extends Slick.PluginOptions {
    copiedCellStyle?: string
    copiedCellStyleLayerKey?: string
    dataItemColumnValueExtractor?: Function
    dataItemColumnValueSetter?: Function
    clipboardCommandHandler?: Function
    includeHeaderWhenCopying?: boolean
    bodyElement?: HTMLElement
    onCopyInit?: Function
    onCopySuccess?: Function
    newRowCreator?: Function
    readOnlyMode?: boolean
    headerColumnValueExtractor?: Function
  }

  export class CellExternalCopyManager<T extends Slick.SlickData> extends Slick.Plugin<T> {
    constructor(options?: CellExternalCopyManagerOptions)
  }
}
