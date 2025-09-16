import * as fs from "fs"
import * as util from "util"
import * as core from "@actions/core"
import * as glob from "glob-promise"

import {
    TestResult,
    TestSuite,
    TestStatus,
    parseFile,
    TestCase
} from "./test_parser"
import { dashboardResults, dashboardSummary } from "./dashboard"
import { markFlakyTests } from "./flaky_tests"

function getTestCaseKey(testcase: TestCase): string {
    return `${testcase.name || ""}::${testcase.description || ""}`
}

export async function getResultsFromPaths(
    paths: string[]
): Promise<TestResult> {
    const suiteMap = new Map<string, TestSuite>()
    const total: TestResult = {
        counts: { passed: 0, failed: 0, skipped: 0 },
        suites: [],
        exception: undefined
    }

    for (const path of paths) {
        const result = await parseFile(path)

        total.counts.passed += result.counts.passed
        total.counts.failed += result.counts.failed
        total.counts.skipped += result.counts.skipped

        for (const suite of result.suites) {
            if (!suiteMap.has(suite.project || suite.name || "")) {
                suiteMap.set(suite.project || suite.name || "", {
                    ...suite,
                    cases: []
                })
            }
            const mergedSuite = suiteMap.get(suite.project || suite.name || "")

            if (!mergedSuite) {
                throw new Error("Suite not found in suiteMap")
            }

            const testCaseMap = new Map<string, TestCase>()

            for (const testcase of mergedSuite.cases) {
                testCaseMap.set(getTestCaseKey(testcase), testcase)
            }

            for (const testcase of suite.cases) {
                const key = getTestCaseKey(testcase)
                const existingTestCase = testCaseMap.get(key)
                if (existingTestCase) {
                    if (existingTestCase.status === TestStatus.Skip) continue

                    existingTestCase.run_count += 1
                    if (testcase.status === TestStatus.Fail) {
                        existingTestCase.fail_count =
                            (existingTestCase.fail_count || 0) + 1
                        existingTestCase.status = TestStatus.Fail // Update status to Fail if it was previously not Fail

                        if (
                            testcase.message &&
                            !existingTestCase.message?.includes(
                                testcase.message
                            )
                        ) {
                            existingTestCase.message = `${(
                                existingTestCase.message || ""
                            ).trim()}\n${(
                                testcase.message || ""
                            ).trim()}`.trim()
                        }
                        if (
                            testcase.details &&
                            !existingTestCase.details?.includes(
                                testcase.details || ""
                            )
                        ) {
                            const separator = "\n---\n"
                            existingTestCase.details =
                                (existingTestCase.details || "") +
                                separator +
                                (testcase.details || "")
                        }
                    }
                } else {
                    testCaseMap.set(key, {
                        ...testcase,
                        fail_count: testcase.status === TestStatus.Fail ? 1 : 0,
                        run_count: testcase.status === TestStatus.Skip ? 0 : 1
                    })
                }
            }
            mergedSuite.cases = Array.from(testCaseMap.values())
        }
    }

    total.suites = Array.from(suiteMap.values())
    return total
}

async function run(): Promise<void> {
    try {
        const pathGlobs = core.getInput("paths", { required: true })
        const outputFile =
            core.getInput("output") || process.env.GITHUB_STEP_SUMMARY || "-"
        const showList = core.getInput("show")
        const summaryTitle = core.getInput("summary-title") || ""
        const flakyTestsJsonPath = core.getInput("flaky-tests-json") || ""
        const runUrl = core.getInput("run-url") || ""
        const maxSummaryLength =
            parseInt(core.getInput("max-summary-length")) || undefined

        /*
         * Given paths may either be an individual path (eg "foo.xml"),
         * a path glob (eg "**TEST-*.xml"), or may be newline separated
         * (from a multi-line yaml scalar).
         */
        const paths = []

        for (const path of pathGlobs.split(/\r?\n/)) {
            if (glob.hasMagic(path)) {
                paths.push(...(await glob.promise(path)))
            } else {
                paths.push(path.trim())
            }
        }

        let show = TestStatus.Fail
        if (showList) {
            show = 0

            for (const showName of showList.split(/,\s*/)) {
                if (showName === "none") {
                    continue
                } else if (showName === "all") {
                    show = TestStatus.Pass | TestStatus.Fail | TestStatus.Skip
                    continue
                }

                const showNameCapitalized = showName.replace(
                    /^([a-z])(.*)/,
                    (m, p1, p2) => `${p1.toUpperCase()}${p2}`
                )

                const showValue =
                    TestStatus[showNameCapitalized as keyof typeof TestStatus]

                if (!showValue) {
                    throw new Error(`unknown test type: ${showName}`)
                }

                show |= showValue
            }
        }

        /*
         * Show the inputs for debugging
         */

        if (core.isDebug()) {
            core.debug("Paths to analyze:")

            for (const path of paths) {
                core.debug(`: ${path}`)
            }

            core.debug(
                `Output file: ${outputFile === "-" ? "(stdout)" : outputFile}`
            )

            let showInfo = "Tests to show:"
            if (show === 0) {
                showInfo += " none"
            }
            for (const showName in TestStatus) {
                const showType = Number(showName)

                if (!isNaN(showType) && (show & showType) === showType) {
                    showInfo += ` ${TestStatus[showType]}`
                }
            }
            core.debug(showInfo)
        }

        /* Analyze the tests */
        let total = await getResultsFromPaths(paths)

        /* Create and write the output */
        if (flakyTestsJsonPath) {
            total = markFlakyTests(total, flakyTestsJsonPath)
        }

        let output = dashboardSummary(
            total,
            show,
            summaryTitle,
            runUrl,
            maxSummaryLength
        )
        const current_length = output.length

        if (show) {
            output += dashboardResults(
                total,
                show,
                flakyTestsJsonPath !== "",
                maxSummaryLength,
                current_length
            )
        }

        if (outputFile === "-") {
            core.info(output)
        } else {
            const writefile = util.promisify(fs.writeFile)
            await writefile(outputFile, output)
        }

        core.setOutput("passed", total.counts.passed)
        core.setOutput("failed", total.counts.failed)
        core.setOutput("skipped", total.counts.skipped)
        core.setOutput(
            "total",
            total.counts.passed + total.counts.failed + total.counts.skipped
        )
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        } else if (error !== null && error !== undefined) {
            core.setFailed(error as string)
        } else {
            core.setFailed("unknown error")
        }
    }
}

run()
