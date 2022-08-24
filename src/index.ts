import * as fs from "fs"
import * as util from "util"
import * as core from "@actions/core"
import * as glob from "glob-promise"

import { TestResult, TestStatus, parseFile } from "./test_parser"

const dashboardUrl = 'http://svg.test-summary.com/dashboard.svg'
const passIconUrl = 'http://svg.test-summary.com/icon/pass.svg?s=12'
const failIconUrl = 'http://svg.test-summary.com/icon/fail.svg?s=12'
const skipIconUrl = 'http://svg.test-summary.com/icon/skip.svg?s=12'
const noneIconUrl = 'http://svg.test-summary.com/icon/none.svg?s=12'

const footer = `This test report was produced by the <a href="https://github.com/test-summary/action">test-summary action</a>.&nbsp; Made with ❤️ in Cambridge.`

async function run(): Promise<void> {
  try {
    const pathGlobs = core.getInput("paths", { required: true })
    const outputFile = core.getInput("output") || process.env.GITHUB_STEP_SUMMARY || "-"
    const showList = core.getInput("show")

    /*
     * Given paths may either be an individual path (eg "foo.xml"), a path
     * glob (eg "**TEST-*.xml"), or may be newline separated (from a multi-line
     * yaml scalar).
     */
    const paths = [ ]

    for (const path of pathGlobs.split(/\r?\n/)) {
        if (glob.hasMagic(path)) {
            paths.push(...await glob.promise(path))
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

            const showValue = (TestStatus as any)[showName.replace(/^([a-z])(.*)/, (m, p1, p2) => p1.toUpperCase() + p2)]

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

        core.debug(`Output file: ${outputFile === '-' ? "(stdout)" : outputFile}`)

        let showInfo = "Tests to show:"
        if (show === 0) {
            showInfo += " none"
        }
        for (const showName in TestStatus) {
            const showType = Number(showName)

            if (!isNaN(showType) && (show & showType) == showType) {
                showInfo += ` ${TestStatus[showType]}`
            }
        }
        core.debug(showInfo)
    }

    /* Analyze the tests */

    const total: TestResult = {
        counts: { passed: 0, failed: 0, skipped: 0 },
        suites: [ ],
        exception: undefined
    }

    for (const path of paths) {
        const result = await parseFile(path)

        total.counts.passed += result.counts.passed
        total.counts.failed += result.counts.failed
        total.counts.skipped += result.counts.skipped

        total.suites.push(...result.suites)
    }

    /* Create and write the output */

    let output = dashboardSummary(total)

    if (show) {
        output += dashboardResults(total, show)
    }

    if (outputFile === "-") {
        console.log(output)
    } else {
        const writefile = util.promisify(fs.writeFile)
        await writefile(outputFile, output)
    }

    core.setOutput('passed', total.counts.passed)
    core.setOutput('failed', total.counts.failed)
    core.setOutput('skipped', total.counts.skipped)
    core.setOutput('total', total.counts.passed + total.counts.failed + total.counts.skipped)

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

function dashboardSummary(result: TestResult) {
    const count = result.counts
    let summary = ""

    if (count.passed > 0) {
        summary += `${count.passed} passed`
    }
    if (count.failed > 0) {
        summary += `${summary ? ', ' : '' }${count.failed} failed`
    }
    if (count.skipped > 0) {
        summary += `${summary ? ', ' : '' }${count.skipped} skipped`
    }

    return `<img src="${dashboardUrl}?p=${count.passed}&f=${count.failed}&s=${count.skipped}" alt="${summary}">`
}

function dashboardResults(result: TestResult, show: number) {
    let table = "<table>"
    let count = 0
    let title: string

    if (show == TestStatus.Fail) {
        title = "Test failures"
    } else if (show === TestStatus.Skip) {
        title = "Skipped tests"
    } else if (show === TestStatus.Pass) {
        title = "Passing tests"
    } else {
        title = "Test results"
    }

    table += `<tr><th align="left">${title}:</th></tr>`

    for (const suite of result.suites) {
        for (const testcase of suite.cases) {
            if (show != 0 && (show & testcase.status) == 0) {
                continue
            }

            table += "<tr><td>"

            if (testcase.status == TestStatus.Pass) {
                table += `<img src="${passIconUrl}" alt="">&nbsp; `
            } else if (testcase.status == TestStatus.Fail) {
                table += `<img src="${failIconUrl}" alt="">&nbsp; `
            } else if (testcase.status == TestStatus.Skip) {
                table += `<img src="${skipIconUrl}" alt="">&nbsp; `
            }

            table += testcase.name

            if (testcase.description) {
                table += ": "
                table += testcase.description
            }

            if (testcase.details) {
                table += "<br/><pre><code>"
                table += testcase.details
                table += "</code></pre>"
            }

            table += "</td></tr>\n"

            count++
        }
    }

    table += `<tr><td><sub>${footer}</sub></td></tr>`
    table += "</table>"

    if (count == 0)
        return ""

    return table
}

run()
