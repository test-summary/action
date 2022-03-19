import * as chai from "chai"
import chaiAsPromised from 'chai-as-promised'
import { expect } from "chai"

import { TestStatus, parseFile } from "../src/test_parser"

chai.use(chaiAsPromised)

const tapResourcePath = `${__dirname}/resources/tap`
const junitResourcePath = `${__dirname}/resources/junit`

describe("file", async () => {
    it("identifies common tap", async () => {
        const result = await parseFile(`${tapResourcePath}/01-common.tap`)
        expect(result.counts.passed).to.eql(6)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(0)
    })

    it("identifies creative liberties tap", async () => {
        const result = await parseFile(`${tapResourcePath}/07-creative-liberties.tap`)
        expect(result.counts.passed).to.eql(9)
        expect(result.counts.failed).to.eql(0)
        expect(result.counts.skipped).to.eql(0)
    })

    it("identifies node-tap output", async () => {
        const result = await parseFile(`${tapResourcePath}/09-node-tap.tap`)
        expect(result.counts.passed).to.eql(4)
        expect(result.counts.failed).to.eql(4)
        expect(result.counts.skipped).to.eql(2)
    })

    it("rejects invalid tap file", async () => {
        expect(parseFile(`${tapResourcePath}/10-results-after-trailer.tap`)).to.be.rejectedWith(Error)
    })

    it("identifies common junit", async () => {
        const result = await parseFile(`${junitResourcePath}/01-common.xml`)
        expect(result.counts.passed).to.eql(7)
        expect(result.counts.failed).to.eql(1)
        expect(result.counts.skipped).to.eql(0)
    })

    it("identifies example junit", async () => {
        const result = await parseFile(`${junitResourcePath}/02-example.xml`)
        expect(result.counts.passed).to.eql(21)
        expect(result.counts.failed).to.eql(9)
        expect(result.counts.skipped).to.eql(0)
    })

    it("identifies junit", async () => {
        const result = await parseFile(`${junitResourcePath}/03-junit.xml`)
        expect(result.counts.passed).to.eql(4)
        expect(result.counts.failed).to.eql(4)
        expect(result.counts.skipped).to.eql(2)
    })
})
