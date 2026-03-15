export * from "#framework/framework"

import {set_ready} from "#framework/framework"
import {paint} from "@bokehjs/core/util/defer"
set_ready(paint)

import "./auto_index"
