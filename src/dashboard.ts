import escapeHTML from "./escape_html"
import { TestResult, TestStatus } from "./test_parser"

const dashboardUrl = "https://svg.test-summary.com/dashboard.svg" // we need to use this one as it is dynamic depending on the number of tests executed
const passIconUrl =
    "https://github.com/tomtom-forks/test-summary-action/raw/icons/assets/pass.svg"
const failIconUrl =
    "https://github.com/tomtom-forks/test-summary-action/raw/icons/assets/fail.svg"
const skipIconUrl =
    "https://github.com/tomtom-forks/test-summary-action/raw/icons/assets/skip.svg"
const flakyIconUrl =
    "https://github.com/tomtom-forks/test-summary-action/raw/icons/assets/flaky.svg"
// not used: const noneIconUrl = '"https://github.com/tomtom-forks/test-summary-action/raw/icons/assets/none.svg'

const unnamedTestCase = "<no name>"

const footer = `This test report was produced by the <a href="https://github.com/test-summary/action">test-summary action</a>.&nbsp; Made with ❤️ in Cambridge.`

export function dashboardSummary(
    result: TestResult,
    show: number,
    summaryTitleInput: string,
    runUrl: string,
    maxLength: number | undefined
): string {
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

    const summaryTitle = summaryTitleInput || statusTitle(show)

    const summaryTitleHtml = runUrl
        ? `<h2><a href="${runUrl}" target="_blank">${summaryTitle}</a></h2>`
        : `<h2>${summaryTitle}</h2>`

    const finalSummary = `${summaryTitleHtml}<img src="${dashboardUrl}?p=${count.passed}&f=${count.failed}&s=${count.skipped}" alt="${summary}">`

    if (maxLength && finalSummary.length > maxLength) {
        throw new Error(
            "Summary length exceeds maximum length, this part cannot be truncated. Please consider increasing max-summary-length input"
        )
    }

    return finalSummary
}

export function dashboardResults(
    result: TestResult,
    show: number,
    flakyTestsInfo = false,
    maxLength: number | undefined = undefined,
    currentLength = 0
): string {
    let results = ``
    let count = 0

    for (const suite of result.suites) {
        let table = "<table>"
        let suiteHeader = ``
        if (suite.name) {
            suiteHeader = `<tr><th align="left">Test Suite: ${escapeHTML(
                suite.name
            )}</th></tr>`
        }
        table += suiteHeader
        for (const testcase of suite.cases) {
            if (show !== 0 && (show & testcase.status) === 0) {
                continue
            }

            table += "<tr><td>"

            const icon = statusIcon(testcase.status, testcase.flaky)
            if (icon) {
                table += icon
                table += "&nbsp; "
            }

            if (testcase.status === TestStatus.Fail) {
                table += `<b>(${testcase.fail_count}/${testcase.run_count} attempts failed)</b>&nbsp;`
            }

            if (flakyTestsInfo && testcase.flaky) {
                if (testcase.flakyTestTicket) {
                    table += `<a href="${testcase.flakyTestTicket}" target="_blank">[FLAKY]</a> `
                } else {
                    table += "[FLAKY]"
                }
            }
            if (testcase.system_error) {
                table += "[CRASH] "
            }
            table += escapeHTML(testcase.name || unnamedTestCase)

            if (testcase.description) {
                table += ": "
                table += escapeHTML(testcase.description)
            }

            if (
                (testcase.message && testcase.message.trim() !== "") ||
                testcase.details
            ) {
                table += "<br/>\n"

                if (testcase.message) {
                    table += "<pre><code>"
                    table += escapeHTML(testcase.message)
                    table += "</code></pre>"
                }

                if (testcase.details) {
                    table += "<details><pre><code>"
                    const cleanedDetails = testcase.details.replace(
                        /\n\s*\n/g,
                        "\n"
                    )
                    table += escapeHTML(cleanedDetails)
                    table += "</code></pre></details>"
                }
            }

            table += "</td></tr>\n"

            count++
        }
        table += "</table>"

        if (table !== `<table>${suiteHeader}</table>`) {
            results += table
        }
    }

    if (flakyTestsInfo) {
        results +=
            `<p><b>Note:</b> Flaky tests are marked with [FLAKY] in the test case name and with a link to the JIRA ticket if available.` +
            ` Flaky tests are unstable tests that sometimes fail and sometimes pass.` +
            ` These tests do not cause pipelines to fail, unless the failure is due to a system crash, and are not retried since their behavior is not consistent.</p>`
    }

    results += `<tr><td><sub>${footer}</sub></td></tr>`

    if (count === 0) {
        return `<h3>No test results to display.</h3>
      If the pipeline failed but no test runs indicate failures, it might be due to a 
      <strong>build failure</strong> or a <strong>timeout</strong>. Check the logs for more information.`
    }

    const summaryTruncatedNote = `<p><b>⚠️ Results truncated due to length constraints.</b></p>`

    if (maxLength && currentLength + results.length > maxLength) {
        let resultsTruncated = results.replace(
            /<details>[\s\S]*?<\/details>/g,
            ""
        )
        if (resultsTruncated.length + currentLength <= maxLength) {
            return resultsTruncated
        }

        // Iteratively remove the last <tr><td>...</td></tr>
        while (
            currentLength +
                resultsTruncated.length +
                summaryTruncatedNote.length >
            maxLength
        ) {
            const lastRowMatch = resultsTruncated.match(
                /<tr><td>[\s\S]*?<\/td><\/tr>/g
            )
            if (lastRowMatch && lastRowMatch.length > 0) {
                // Remove the last match
                resultsTruncated = resultsTruncated
                    .replace(lastRowMatch[lastRowMatch.length - 1], "")
                    .replace(
                        /<table>\s*(<tr>\s*<th[^>]*>[^<]*<\/th>\s*<\/tr>\s*)?<\/table>/g,
                        ""
                    ) // Remove empty tables
            } else {
                break
            }
        }

        return (resultsTruncated += summaryTruncatedNote)
    }

    return results
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

function statusIcon(
    status: TestStatus,
    flaky: boolean | undefined
): string | undefined {
    if (flaky && status === TestStatus.Fail) {
        return `<img src="${flakyIconUrl}" alt="" />`
    }
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
