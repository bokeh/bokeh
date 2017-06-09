import "./polyfill"

export {version} from "./version"

import * as embed from "./embed"
export {embed}

export {logger, set_log_level} from "./core/logging"
export {settings}              from "./core/settings"
export {Models, index}         from "./base"
export {documents}             from "./document"
export {safely}                from "./safely"
