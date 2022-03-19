import * as chai from "chai"
import chaiAsPromised from 'chai-as-promised'
import { expect } from "chai"

import { TestStatus, parseTapFile } from "../src/test_parser"

chai.use(chaiAsPromised)

const resourcePath = `${__dirname}/resources/tap`

describe("tap", async () => {
    it("parses common", async () => {
        const result = await parseTapFile(`${resourcePath}/01-common.tap`)

        expect(result.counts.passed).to.eql(6)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites.length).to.eql(1)
        expect(result.suites[0].name).to.eql("Create a new Board and Tile, then place the Tile onto the board.")
        expect(result.suites[0].cases.length).to.eql(6)
    })

    it("parses unknown amount and failure", async () => {
        const result = await parseTapFile(`${resourcePath}/02-unknown-amount-and-failure.tap`)

        expect(result.counts.passed).to.eql(5)
        expect(result.counts.failed).to.eql(2)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites.length).to.eql(2)

        expect(result.suites[0].name).to.be.a('undefined')
        expect(result.suites[0].cases.length).to.eql(1)

        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("retrieving servers from the database")

        expect(result.suites[1].name).to.eql('need to ping 6 servers')
        expect(result.suites[1].cases.length).to.eql(6)

        expect(result.suites[1].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[1].cases[0].name).to.eql("pinged diamond")

        expect(result.suites[1].cases[1].status).to.eql(TestStatus.Pass)
        expect(result.suites[1].cases[1].name).to.eql("pinged ruby")

        expect(result.suites[1].cases[2].status).to.eql(TestStatus.Fail)
        expect(result.suites[1].cases[2].name).to.eql("pinged saphire")
        expect(result.suites[1].cases[2].details!.substring(0, 37)).to.eql(`message: 'hostname "saphire" unknown'`)

        expect(result.suites[1].cases[3].status).to.eql(TestStatus.Pass)
        expect(result.suites[1].cases[3].name).to.eql("pinged onyx")

        expect(result.suites[1].cases[4].status).to.eql(TestStatus.Fail)
        expect(result.suites[1].cases[4].name).to.eql("pinged quartz")
        expect(result.suites[1].cases[4].details!.substring(0, 35)).to.eql(`message: 'timeout'\nseverity: fail`)

        expect(result.suites[1].cases[5].status).to.eql(TestStatus.Pass)
        expect(result.suites[1].cases[5].name).to.eql("pinged gold")
    })

    it("can bail out", async () => {
        const result = await parseTapFile(`${resourcePath}/03-bail-out.tap`)

        expect(result.counts.passed).to.eql(0)
        expect(result.counts.failed).to.eql(1)
        expect(result.counts.skipped).to.eql(0)

        expect(result.exception).to.eql("Couldn't connect to database.")
    })

    it("understands skipped tests", async () => {
        const result = await parseTapFile(`${resourcePath}/04-skipped.tap`)

        expect(result.counts.passed).to.eql(1)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(4)

        expect(result.suites.length).to.eql(2)

        expect(result.suites[0].name).to.be.a('undefined')
        expect(result.suites[0].cases.length).to.eql(1)

        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("approved operating system")

        expect(result.suites[1].name).to.eql('$^0 is solaris')
        expect(result.suites[1].cases.length).to.eql(4)

        expect(result.suites[1].cases[0].status).to.eql(TestStatus.Skip)
        expect(result.suites[1].cases[0].name).to.be.a('undefined')
        expect(result.suites[1].cases[0].description).to.eql("no /sys directory")

        expect(result.suites[1].cases[1].status).to.eql(TestStatus.Skip)
        expect(result.suites[1].cases[1].description).to.eql("no /sys directory")

        expect(result.suites[1].cases[2].status).to.eql(TestStatus.Skip)
        expect(result.suites[1].cases[2].description).to.eql("no /sys directory")

        expect(result.suites[1].cases[3].status).to.eql(TestStatus.Skip)
        expect(result.suites[1].cases[3].description).to.eql("no /sys directory")
    })

    it("can skip an entire file", async () => {
        const result = await parseTapFile(`${resourcePath}/05-skip-everything.tap`)

        expect(result.counts.passed).to.eql(0)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites.length).to.eql(1)
        expect(result.suites[0].cases.length).to.eql(0)
    })

    it("reads todos as skipped", async () => {
        const result = await parseTapFile(`${resourcePath}/06-todo.tap`)

        expect(result.counts.passed).to.eql(2)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(2)

        expect(result.suites.length).to.eql(1)
        expect(result.suites[0].cases.length).to.eql(4)

        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("Creating test program")

        expect(result.suites[0].cases[1].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[1].name).to.eql("Test program runs, no error")

        expect(result.suites[0].cases[2].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[2].name).to.eql("infinite loop")
        expect(result.suites[0].cases[2].description).to.eql("halting problem unsolved")

        expect(result.suites[0].cases[3].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[3].name).to.eql("infinite loop 2")
        expect(result.suites[0].cases[3].description).to.eql("halting problem unsolved")
    })

    it("handles creative liberties", async () => {
        const result = await parseTapFile(`${resourcePath}/07-creative-liberties.tap`)

        expect(result.counts.passed).to.eql(9)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("created Board")
        expect(result.suites[0].cases[0].details).to.be.a('undefined')

        expect(result.suites[0].cases[1].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[1].name).to.be.a('undefined')
        expect(result.suites[0].cases[1].details).to.be.a('undefined')

        expect(result.suites[0].cases[2].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[2].name).to.be.a('undefined')
        expect(result.suites[0].cases[2].details).to.be.a('undefined')

        expect(result.suites[0].cases[3].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[3].name).to.be.a('undefined')
        expect(result.suites[0].cases[3].details).to.be.a('undefined')

        expect(result.suites[0].cases[4].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[4].name).to.be.a('undefined')
        expect(result.suites[0].cases[4].details).to.be.a('undefined')

        expect(result.suites[0].cases[5].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[5].name).to.be.a('undefined')
        expect(result.suites[0].cases[5].details).to.be.a('undefined')

        expect(result.suites[0].cases[6].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[6].name).to.be.a('undefined')
        expect(result.suites[0].cases[6].details).to.be.a('undefined')

        expect(result.suites[0].cases[7].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[7].name).to.be.a('undefined')
        expect(result.suites[0].cases[7].details!.substring(0, 23)).to.eql('message: "Board layout"')

        expect(result.suites[0].cases[8].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[8].name).to.eql('board has 7 tiles + starter tile')
        expect(result.suites[0].cases[8].details).to.be.a('undefined')
    })

    it("handles everything", async () => {
        const result = await parseTapFile(`${resourcePath}/08-everything.tap`)

        expect(result.counts.passed).to.eql(6)
        expect(result.counts.failed).to.eql(6)
        expect(result.counts.skipped).to.eql(8)

        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("description 1")

        expect(result.suites[0].cases[1].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[1].name).to.eql("description 2")

        expect(result.suites[0].cases[2].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[2].name).to.eql("description 3")

        expect(result.suites[0].cases[3].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[3].name).to.eql("no number 4")

        expect(result.suites[0].cases[4].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[4].name).to.eql("no number 5")

        expect(result.suites[0].cases[5].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[5].name).to.eql("no number 6")

        expect(result.suites[0].cases[6].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[6].name).to.eql("description 7")

        expect(result.suites[0].cases[7].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[7].name).to.eql("description 8")

        expect(result.suites[0].cases[8].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[8].name).to.eql("description 9")

        expect(result.suites[0].cases[9].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[9].name).to.eql("no number 10")

        expect(result.suites[0].cases[10].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[10].name).to.eql("no number 11")

        expect(result.suites[0].cases[11].status).to.eql(TestStatus.Fail)
        expect(result.suites[0].cases[11].name).to.eql("no number 12")

        expect(result.suites[0].cases[12].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[12].name).to.be.a('undefined')
        expect(result.suites[0].cases[12].description).to.eql("skip 13")

        expect(result.suites[0].cases[13].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[13].name).to.be.a('undefined')
        expect(result.suites[0].cases[13].description).to.eql("skip 14")

        expect(result.suites[0].cases[14].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[14].name).to.be.a('undefined')
        expect(result.suites[0].cases[14].description).to.eql("skip 15")

        expect(result.suites[0].cases[15].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[15].name).to.be.a('undefined')
        expect(result.suites[0].cases[15].description).to.eql("skip 16")

        expect(result.suites[0].cases[16].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[16].name).to.be.a('undefined')
        expect(result.suites[0].cases[16].description).to.eql("skip 17")

        expect(result.suites[0].cases[17].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[17].name).to.be.a('undefined')
        expect(result.suites[0].cases[17].description).to.eql("number 18")

        expect(result.suites[0].cases[18].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[18].description).to.eql("number 19")

        expect(result.suites[0].cases[19].status).to.eql(TestStatus.Skip)
        expect(result.suites[0].cases[19].description).to.eql("number 20")
    })

    it("parses node-tap output", async () => {
        const result = await parseTapFile(`${resourcePath}/09-node-tap.tap`)

        expect(result.counts.passed).to.eql(4)
        expect(result.counts.failed).to.eql(4)
        expect(result.counts.skipped).to.eql(2)
    })

    it("rejects invalid trailer", async () => {
        expect(parseTapFile(`${resourcePath}/10-results-after-trailer.tap`)).to.be.rejectedWith(Error)
    })
})
