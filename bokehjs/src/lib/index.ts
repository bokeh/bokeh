import "./polyfill"

export {version} from "./version"

import * as embed from "./embed"
export {embed}

import * as protocol from "./protocol"
export {protocol}

import * as _testing from "./testing"
export {_testing}

export {logger, set_log_level} from "./core/logging"
export {settings}              from "./core/settings"
export {Models, index}         from "./base"
export {documents}             from "./document"
export {safely}                from "./safely"
