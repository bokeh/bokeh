import {Signal} from "core/signaling"

export const clear_menus = new Signal<void, any>({}, "clear_menus")
document.addEventListener("click", () => clear_menus.emit(undefined))
