import {Model} from "@bokehjs/model"

export class AModel extends Model {
  static __module__ = "ext_package_no_main"
}

import {register_models} from "@bokehjs/base"
register_models({AModel})
