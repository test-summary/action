import { expect } from "chai"

import { TestStatus, TestResult } from "../src/test_parser"
import { dashboardSummary, dashboardResults } from "../src/dashboard"

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
                            flaky: false,
                        },
                        {
                            status: TestStatus.Fail,
                            name: "another name escaped 'properly'", // single quotes require escaping
                            description: "another description escaped & properly", // ampersand requires escaping
                            flaky: false,
                        },
                        {
                            status: TestStatus.Fail,
                            name: "entities ' are & escaped < in > proper & order",
                            description: "order is important in a multi-pass replacement",
                            flaky: false,
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
                            flaky: false,
                            // <-- no name
                        }
                    ]
                }
            ]
        }
        const actual = dashboardResults(result, TestStatus.Fail)
        expect(actual).contains("&lt;no name&gt;")
    })

    it("includes details and message when present, using proper escaping", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                {
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "Test",
                            message: "message escaped <properly>",
                            details: "details escaped <properly>",
                            flaky: false
                        }
                    ]
                }
            ]
        }

        const actual = dashboardResults(result, TestStatus.Fail)

        expect(actual).contains("message escaped &lt;properly&gt;")
        expect(actual).contains("details escaped &lt;properly&gt;")
    })

        it("includes flaky test info", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                { 
                    name: "TestSuite1",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: 'test1',
                            description: 'test',
                            message: 'expected:<99> but was:<98>',
                            details: 'junit.framework.AssertionFailedError: expected:<99> but was:<98>\n' +
                              '\tat test.failsTestSix(Unknown Source)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n',
                            duration: '0.005',
                            flaky: false
                        },
                        {
                            status: TestStatus.Fail,
                            name: 'test2',
                            description: 'test',
                            message: 'expected:<99> but was:<98>',
                            details: 'junit.framework.AssertionFailedError: expected:<99> but was:<98>\n' +
                              '\tat test.failsTestFive(Unknown Source)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n',
                            duration: '0.005',
                            flaky: true
                        },
                        {
                            status: TestStatus.Fail,
                            name: 'test3',
                            description: 'test',
                            message: 'expected:<99> but was:<98>',
                            details: 'junit.framework.AssertionFailedError: expected:<99> but was:<98>\n' +
                              '\tat test.failsTestFive(Unknown Source)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n',
                            duration: '0.005',
                            flaky: true
                          },
                    ]
                },
                { 
                    name: "TestSuite2",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: 'test4',
                            description: 'test',
                            message: 'expected:<99> but was:<98>',
                            details: 'junit.framework.AssertionFailedError: expected:<99> but was:<98>\n' +
                              '\tat test.failsTestSix(Unknown Source)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n' +
                              '\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n' +
                              '\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n',
                            duration: '0.005',
                            flaky: false
                        }
                    ]
                }
            ]
        }

        const actual = dashboardResults(result, TestStatus.Fail)
        expect(actual).contains("<b>Non-flaky tests:</b>")
        expect(actual).contains("<b>Flaky tests:</b>")

    })

})
