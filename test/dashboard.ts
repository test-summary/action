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
                            description: 'description escaped "properly"', // double quotes require escaping
                            run_count: 1
                        },
                        {
                            status: TestStatus.Fail,
                            name: "another name escaped 'properly'", // single quotes require escaping
                            description:
                                "another description escaped & properly", // ampersand requires escaping
                            run_count: 1
                        },
                        {
                            status: TestStatus.Fail,
                            name: "entities ' are & escaped < in > proper & order",
                            description:
                                "order is important in a multi-pass replacement",
                            run_count: 1
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
        expect(actual).contains(
            "entities &apos; are &amp; escaped &lt; in &gt; proper &amp; order"
        )
    })

    it("uses <no name> for test cases without name", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                {
                    cases: [
                        {
                            status: TestStatus.Fail,
                            run_count: 1
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
                            run_count: 1
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
                    project: "testsuite-project-name",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "test1",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestSix(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            flaky: true,
                            flakyTestTicket:
                                "https://jira.example.com/browse/TEST-1",
                            run_count: 1,
                            fail_count: 1
                        },
                        {
                            status: TestStatus.Fail,
                            name: "test2",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestFive(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            run_count: 1,
                            fail_count: 1
                        }
                    ]
                }
            ]
        }
        let actual = dashboardResults(result, TestStatus.Fail, true)
        const count = (actual.match(/\[FLAKY\]/g) || []).length
        expect(actual).contains(
            `<a href="https://jira.example.com/browse/TEST-1" target="_blank">[FLAKY]</a> `
        )
        expect(count).to.equal(2) // Once comes from the footer
    })

    it("removes details sections to adjust to maxLength", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                {
                    name: "TestSuite1",
                    project: "testsuite-project-name",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "test1",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestSix(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            flaky: true,
                            flakyTestTicket:
                                "https://jira.example.com/browse/TEST-1",
                            run_count: 1,
                            fail_count: 1
                        },
                        {
                            status: TestStatus.Fail,
                            name: "test2",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestFive(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            run_count: 1,
                            fail_count: 1
                        }
                    ]
                }
            ]
        }
        let actual = dashboardResults(result, TestStatus.Fail, true, 5000, 0)
        expect(actual).not.contains(`<details>`)
    })

    it("removes details and last test with its table to adjust to maxLength", async () => {
        const result: TestResult = {
            counts: { passed: 0, failed: 1, skipped: 0 },
            suites: [
                {
                    name: "TestSuite1",
                    project: "testsuite-project-name",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "test1",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestSix(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            flaky: true,
                            flakyTestTicket:
                                "https://jira.example.com/browse/TEST-1",
                            run_count: 1,
                            fail_count: 1
                        }
                    ]
                },
                {
                    name: "TestSuite2",
                    project: "testsuite-project-name",
                    cases: [
                        {
                            status: TestStatus.Fail,
                            name: "test2",
                            description: "test",
                            message: "expected:<99> but was:<98>",
                            details:
                                "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                                "\tat test.failsTestFive(Unknown Source)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                                "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                                "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                            duration: "0.005",
                            run_count: 1,
                            fail_count: 1
                        }
                    ]
                }
            ]
        }
        let actual = dashboardResults(result, TestStatus.Fail, true, 900, 0)
        const count = (actual.match(/\<table\>/g) || []).length
        expect(count).to.equal(1) // Only one table should remain
        expect(actual).not.contains(`test2`)
    })
      it("includes system error", async () => {
      const result: TestResult = {
          counts: { passed: 0, failed: 1, skipped: 0 },
          suites: [
              {
                  name: "TestSuite1",
                  project: "testsuite-project-name",
                  cases: [
                      {
                          status: TestStatus.Fail,
                          name: "test1",
                          description: "test",
                          message: "expected:<99> but was:<98>",
                          details:
                              "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                              "\tat test.failsTestSix(Unknown Source)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                              "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                              "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                          duration: "0.005",
                          flaky: true,
                          flakyTestTicket:
                              "https://jira.example.com/browse/TEST-1",
                          run_count: 1,
                          fail_count: 1
                      },
                      {
                          status: TestStatus.Fail,
                          name: "test2",
                          description: "test",
                          message: "expected:<99> but was:<98>",
                          details:
                              "junit.framework.AssertionFailedError: expected:<99> but was:<98>\n" +
                              "\tat test.failsTestFive(Unknown Source)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                              "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)\n" +
                              "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)\n" +
                              "\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)\n",
                          duration: "0.005",
                          run_count: 1,
                          fail_count: 1,
                          system_error: true
                      }
                  ]
              }
          ]
      }
      let actual = dashboardResults(result, TestStatus.Fail, true)
      expect(actual).contains(`[CRASH]`)
  })

})
