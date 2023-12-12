import { expect } from "chai"

import { TestStatus, TestResult } from "../src/test_parser"
import { dashboardResults } from "../src/dashboard"

describe("dashboard", async () => {
    it("escapes HTML entities", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 2, skipped: 0 },
            suites: [
                {
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "name escaped <properly>", // "<" and ">" require escaping
                            description: "description escaped \"properly\"", // double quotes require escaping
                        },
                        {
                            status: TestStatus.Fail,
                            name: "another name escaped 'properly'", // single quotes require escaping
                            description: "another description escaped & properly", // ampersand requires escaping
                        },
                        {
                            status: TestStatus.Fail,
                            name: "entities ' are & escaped < in > proper & order",
                            description: "order is important in a multi-pass replacement",
                        }
                    ]
                }
            ]
        }
        const actual = dashboardResults(result, TestStatus.Fail)
        expect(actual).contains("name escaped &lt;properly&gt;")
        expect(actual).contains("description escaped &quot;properly&quot;")
        expect(actual).contains("another name escaped &apos;properly&apos;")
        expect(actual).contains("another description escaped &amp; properly")
        expect(actual).contains("entities &apos; are &amp; escaped &lt; in &gt; proper &amp; order")
    })

    it("uses <no name> for test cases without name", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                {
                    cases: [
                        {
                            status: TestStatus.Fail,
                            // <-- no name
                        }
                    ]
                }
            ]
        }
        const actual = dashboardResults(result, TestStatus.Fail)
        expect(actual).contains("&lt;no name&gt;")
    })
})
