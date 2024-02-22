import escapeHTML from "./escape_html"
import { TestResult, TestStatus } from "./test_parser"

const dashboardUrl = "https://svg.test-summary.com/dashboard.svg"
const passIconUrl = "https://svg.test-summary.com/icon/pass.svg?s=12"
const failIconUrl = "https://svg.test-summary.com/icon/fail.svg?s=12"
const skipIconUrl = "https://svg.test-summary.com/icon/skip.svg?s=12"
// not used: const noneIconUrl = 'https://svg.test-summary.com/icon/none.svg?s=12'

const unnamedTestCase = "<no name>"

const footer = `This test report was produced by the <a href="https://github.com/test-summary/action">test-summary action</a>.&nbsp; Made with ❤️ in Cambridge.`

export function dashboardSummary(result: TestResult): string {
    const count = result.counts
    let summary = ""

    if (count.passed > 0) {
        summary += `${count.passed} passed`
    }
    if (count.failed > 0) {
        summary += `${summary ? ", " : ""}${count.failed} failed`
    }
    if (count.skipped > 0) {
        summary += `${summary ? ", " : ""}${count.skipped} skipped`
    }

    return `<img src="${dashboardUrl}?p=${count.passed}&f=${count.failed}&s=${count.skipped}" alt="${summary}">`
}

export function dashboardResults(result: TestResult, show: number): string {
    let table = "<table>"
    let count = 0

    table += `<tr><th align="left">${statusTitle(show)}:</th></tr>`

    for (const suite of result.suites) {
        for (const testcase of suite.cases) {
            if (show !== 0 && (show & testcase.status) === 0) {
                continue
            }

            table += "<tr><td>"

            const icon = statusIcon(testcase.status)
            if (icon) {
                table += icon
                table += "&nbsp; "
            }

            table += escapeHTML(testcase.name || unnamedTestCase)

            if (testcase.description) {
                table += ": "
                table += escapeHTML(testcase.description)
            }

            if (testcase.message || testcase.details) {
                table += "<br/>\n"

                if (testcase.message) {
                    table += "<pre><code>"
                    table += escapeHTML(testcase.message)
                    table += "</code></pre>"
                }

                if (testcase.details) {
                    table += "<pre><code>"
                    table += escapeHTML(testcase.details)
                    table += "</code></pre>"
                }
            }

            table += "</td></tr>\n"

            count++
        }
    }

    table += `<tr><td><sub>${footer}</sub></td></tr>`
    table += "</table>"

    if (count === 0) {
        return ""
    }

    return table
}

function statusTitle(status: TestStatus): string {
    switch (status) {
        case TestStatus.Fail:
            return "Test failures"
        case TestStatus.Skip:
            return "Skipped tests"
        case TestStatus.Pass:
            return "Passing tests"
        default:
            return "Test results"
    }
}

function statusIcon(status: TestStatus): string | undefined {
    switch (status) {
        case TestStatus.Pass:
            return `<img src="${passIconUrl}" alt="" />`
        case TestStatus.Fail:
            return `<img src="${failIconUrl}" alt="" />`
        case TestStatus.Skip:
            return `<img src="${skipIconUrl}" alt="" />`
        default:
            return
    }
}
