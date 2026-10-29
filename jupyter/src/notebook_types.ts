import type {ICellModel} from "@jupyterlab/cells"
import type {DocumentRegistry} from "@jupyterlab/docregistry"
import type {IRenderMimeRegistry} from "@jupyterlab/rendermime"
import type {ISignal} from "@lumino/signaling"
import type {Widget} from "@lumino/widgets"

// The renderer consumes notebook instances supplied by JupyterLab. Keep this
// contract limited to the members we use so we don't depend on its full UI.
interface NotebookCells extends Iterable<ICellModel> {
  readonly changed: ISignal<NotebookCells, {newValues: ICellModel[], oldValues: ICellModel[]}>
}

export interface NotebookModel extends DocumentRegistry.IModel {
  readonly cells: NotebookCells
}

export interface NotebookPanel extends Widget {
  readonly content: {readonly rendermime: IRenderMimeRegistry}
}
