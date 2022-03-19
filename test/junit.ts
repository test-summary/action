import * as chai from "chai"
import { expect } from "chai"

import { TestStatus, parseJunitFile } from "../src/test_parser"

const resourcePath = `${__dirname}/resources/junit`

describe("junit", async () => {
    it("parses common", async () => {
        const result = await parseJunitFile(`${resourcePath}/01-common.xml`)

        expect(result.counts.passed).to.eql(7)
        expect(result.counts.failed).to.eql(1)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites.length).to.eql(2)
        expect(result.suites[0].cases.length).to.eql(2)
        expect(result.suites[1].cases.length).to.eql(6)
    })

    it("parses example", async () => {
        const result = await parseJunitFile(`${resourcePath}/02-example.xml`)

        expect(result.counts.passed).to.eql(21)
        expect(result.counts.failed).to.eql(9)
        expect(result.counts.skipped).to.eql(0)

        expect(result.suites.length).to.eql(5)

        expect(result.suites[0].name).to.eql("Validation")
        expect(result.suites[0].timestamp).to.eql('2022-03-07T01:42:21')
        expect(result.suites[0].filename).to.eql('/Users/ethomson/Projects/calculator/test/arithmetic.js')

        expect(result.suites[0].cases.length).to.eql(6)
        expect(result.suites[0].cases[0].status).to.eql(TestStatus.Pass)
        expect(result.suites[0].cases[0].name).to.eql("Arithmetic Validation rejects missing operation")
        expect(result.suites[0].cases[0].duration).to.eql("0.021")
        expect(result.suites[0].cases[0].description).to.eql("rejects missing operation")

        // ...

        expect(result.suites[0].cases[5].name).to.eql("Arithmetic Validation rejects operands with invalid decimals")
        expect(result.suites[0].cases[5].duration).to.eql("0.002")
        expect(result.suites[0].cases[5].description).to.eql("rejects operands with invalid decimals")

        expect(result.suites[1].name).to.eql("Addition")
        expect(result.suites[1].timestamp).to.eql('2022-03-07T01:42:21')
        expect(result.suites[1].filename).to.eql('/Users/ethomson/Projects/calculator/test/arithmetic.js')

        expect(result.suites[2].name).to.eql("Subtraction")
        expect(result.suites[2].timestamp).to.eql('2022-03-07T01:42:21')
        expect(result.suites[2].filename).to.eql('/Users/ethomson/Projects/calculator/test/arithmetic.js')

        expect(result.suites[3].name).to.eql("Multiplication")
        expect(result.suites[3].timestamp).to.eql('2022-03-07T01:42:21')
        expect(result.suites[3].filename).to.eql('/Users/ethomson/Projects/calculator/test/arithmetic.js')

        expect(result.suites[4].name).to.eql("Division")
        expect(result.suites[4].timestamp).to.eql('2022-03-07T01:42:41')
        expect(result.suites[4].filename).to.eql('/Users/ethomson/Projects/calculator/test/arithmetic.js')

        expect(result.suites[4].cases.length).to.eql(7)
        expect(result.suites[4].cases[0].status).to.eql(TestStatus.Fail)
        expect(result.suites[4].cases[0].name).to.eql("Arithmetic Division divides a positive integer by an integer factor ")
        expect(result.suites[4].cases[0].duration).to.eql("10")
        expect(result.suites[4].cases[0].description).to.eql("divides a positive integer by an integer factor ")
        expect(result.suites[4].cases[0].details!.substring(0, 35)).to.eql("Error: Timeout of 10000ms exceeded.")
    })

    it("parses junit", async () => {
        const result = await parseJunitFile(`${resourcePath}/03-junit.xml`)

        expect(result.counts.passed).to.eql(4)
        expect(result.counts.failed).to.eql(4)
        expect(result.counts.skipped).to.eql(2)

        expect(result.suites.length).to.eql(1)

        expect(result.suites[0].cases[0].name).to.eql("passesTestOne")
        expect(result.suites[0].cases[1].name).to.eql("passesTestTwo")
        expect(result.suites[0].cases[2].name).to.eql("passesTestThree")
        expect(result.suites[0].cases[3].name).to.eql("passesTestFour")
        expect(result.suites[0].cases[4].name).to.eql("failsTestFive")
        expect(result.suites[0].cases[5].name).to.eql("failsTestSix")
        expect(result.suites[0].cases[6].name).to.eql("failsTestSeven")
        expect(result.suites[0].cases[7].name).to.eql("failsTestEight")
        expect(result.suites[0].cases[8].name).to.eql("skipsTestNine")
        expect(result.suites[0].cases[9].name).to.eql("skipsTestTen")
    })
})
