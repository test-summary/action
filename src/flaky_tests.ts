import * as fs from "fs"
import * as core from "@actions/core"

import { TestSuite, TestResult } from "./test_parser"


export function markFlakyTests(result: TestResult, flakyTestsJsonPath: any): TestResult {
  if (!fs.existsSync(flakyTestsJsonPath)) {
    core.warning(`Flaky tests JSON file not found: ${flakyTestsJsonPath}`);
    return result; // Return the original result if no flaky tests file is found
  }
  const data = fs.readFileSync(flakyTestsJsonPath, "utf-8");
  const flakyTestsJson = JSON.parse(data);

    console.log(flakyTestsJson);

    for (const flakyTest of flakyTestsJson) {
        const suiteName = flakyTest.testsuite;

        const matchingSuite = result.suites.find((suite) => suite.name === suiteName);
        if (matchingSuite) {
            console.log(`Marking flaky test: ${flakyTest.name} in suite: ${matchingSuite.name}`);
            const matchingCase = matchingSuite.cases.find((testCase) =>
                testCase.name === flakyTest.name && testCase.description === flakyTest.class
            );

            if (matchingCase) {
                console.log(`Found matching case: ${matchingCase.name}`);
                matchingCase.flaky = true; // Mark the case as flaky
            }
        }
    }

    // Sort the test cases within each suite: flaky=false cases first
    result.suites.forEach((suite) => {
        suite.cases.sort((a, b) => {
            const flakyA = a.flaky;
            const flakyB = b.flaky;
            return Number(flakyA) - Number(flakyB);
        });
    });
    console.log(result.suites[0].cases);
    return result;
  }
