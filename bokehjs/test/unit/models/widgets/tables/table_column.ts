import {expect} from "#framework/assertions"

import {TableColumn} from "@bokehjs/models/widgets/tables/table_column"

describe("table_column module", () => {
  describe("TableColumn class", () => {
    describe("default properties", () => {
      it("should have allow_html_title set to false", () => {
        const c = new TableColumn({field: "a_field"})
        expect(c.allow_html_title).to.be.equal(false)
      })
    })
  })
})
