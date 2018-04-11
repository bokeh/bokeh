import {Signal0} from "core/signaling"

export const clear_menus = new Signal0<any>({}, "clear_menus")
document.addEventListener("click", () => clear_menus.emit())
