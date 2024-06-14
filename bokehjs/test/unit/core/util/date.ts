import {expect} from "assertions"

import {format_date_rfc7231} from "@bokehjs/core/util/date"

describe("core/util/date", () => {
  it("should support format_date_rfc7231() function", () => {
    // Test week around 1970
    expect(format_date_rfc7231(new Date(0))).to.be.equal("Thu, 01 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000))).to.be.equal("Fri, 02 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000 * 2))).to.be.equal("Sat, 03 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000 * 3))).to.be.equal("Sun, 04 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000 * 4))).to.be.equal("Mon, 05 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000 * 5))).to.be.equal("Tue, 06 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(86400000 * 6))).to.be.equal("Wed, 07 Jan 1970 00:00:00 GMT")

    // Test months around 1970
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)))).to.be.equal("Thu, 01 Jan 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 1, 1, 0, 0, 0)))).to.be.equal("Sun, 01 Feb 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 2, 1, 0, 0, 0)))).to.be.equal("Sun, 01 Mar 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 3, 1, 0, 0, 0)))).to.be.equal("Wed, 01 Apr 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 4, 1, 0, 0, 0)))).to.be.equal("Fri, 01 May 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 5, 1, 0, 0, 0)))).to.be.equal("Mon, 01 Jun 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 6, 1, 0, 0, 0)))).to.be.equal("Wed, 01 Jul 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 7, 1, 0, 0, 0)))).to.be.equal("Sat, 01 Aug 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 8, 1, 0, 0, 0)))).to.be.equal("Tue, 01 Sep 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 9, 1, 0, 0, 0)))).to.be.equal("Thu, 01 Oct 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 10, 1, 0, 0, 0)))).to.be.equal("Sun, 01 Nov 1970 00:00:00 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(1970, 11, 1, 0, 0, 0)))).to.be.equal("Tue, 01 Dec 1970 00:00:00 GMT")

    // Test a leap year
    expect(format_date_rfc7231(new Date(Date.UTC(2000, 1, 29, 0, 0, 0)))).to.be.equal("Tue, 29 Feb 2000 00:00:00 GMT")

    // Two random dates
    expect(format_date_rfc7231(new Date(Date.UTC(1995, 11, 4, 13, 12, 15)))).to.be.equal("Mon, 04 Dec 1995 13:12:15 GMT")
    expect(format_date_rfc7231(new Date(Date.UTC(2018, 9, 24, 8, 11, 47)))).to.be.equal("Wed, 24 Oct 2018 08:11:47 GMT")

  })
})
