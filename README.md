Test Summary
============
![Test dashboard: 42 tests passed](http://svg.test-summary.com/dashboard.svg?p=42)
![Test dashboard: 42 tests failed](http://svg.test-summary.com/dashboard.svg?f=42)
![Test dashboard: 42 tests passed, 8 tests failed, 18 tests skipped](http://svg.test-summary.com/dashboard.svg?p=42&f=8&s=18)

Produce an easy-to-read summary of your project's test data as part of your GitHub Actions CI/CD workflow. This helps you understand at-a-glance the impact to the changes in your pull requests, and see which changes are introducing new problems.

* Integrates easily with your existing GitHub Actions workflow
* Produces summaries from JUnit XML and TAP test output
* Compatible with most testing tools for most development platforms
* Customizable to show just a summary, just failed tests, or all test results.

Getting Started
---------------
To set up the test summary action, just add a few lines of YAML to your GitHub Actions workflow. For example, if your test harness produces JUnit XML outputs in the `test/results/` directory, and you want to produce a test summary in a file named `test-summary.md`, add a new step to your workflow YAML after your build and test step:

```yaml
- name: Test Summary
  uses: test-summary/action@v1
  with:
    paths: "test/results/**/TEST-*.xml"
  if: always()
```

Update `paths` to match the test output file(s) that your test harness produces. You can specify glob patterns, including `**` to match the pattern recursively. In addition, you can specify multiple test paths on multiple lines. For example:

```yaml
- name: Test Summary
  uses: test-summary/action@v1
  with:
    paths: |
      test-one/**/TEST-*.xml
      test-two/results/results.tap
  if: always()
```

> Note the `if: always()` conditional in this workflow step: you should always use this so that the test summary creation step runs _even if_ the previous steps have failed. This allows your test step to fail -- due to failing tests -- but still produce a test summary.

Upload the markdown
-------------------
The prior "getting started" step generates a summary in GitHub-flavored Markdown (GFM). Once the markdown is generated, you can upload it as a build artifact, add it to a pull request comment, or add it to an issue. For example, to upload the markdown generated in the prior example as a build artifact:

```yaml
- name: Upload test summary
  uses: actions/upload-artifact@v3
  with:
    name: test-summary
    path: test-summary.md
  if: always()
```

Examples
--------
There are examples for setting up a GitHub Actions step with many different platforms [in the examples repository](https://github.com/test-summary/examples).

Options
-------
Options are specified on the [`with` map](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepswith) of the action.

* **`paths`: the paths for input files** (required)  
  One or more file [glob patterns](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet) that specify the test results files in JUnit XML or TAP format.

  * To specify a single file, provide it directly as a string value to the `paths` key. For example:

    ```yaml
    - uses: test-summary/action@v1
      with:
        paths: "tests/results.xml"
    ```

  * To specify multiple files, provide them as a multi-line string value to the `paths` key. For example:

    ```yaml
    - uses: test-summary/action@v1
      with:
        paths: |
          tests-one/results.xml
          tests-two/results.xml
          tests-three/results.xml
    ```

  * You can specify files as a [glob patterns](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet), allowing you to use wildcards to match multiple files. For example, to match all files named `TEST-*.xml` beneath the `tests` folder, recursively:

    ```yaml
    - uses: test-summary/action@v1
      with:
        paths: "test/results/**/TEST-*.xml"
    ```

* **`output`: the output file to create** (optional)  
  This is the path to the output file to populate with the test summary markdown data. For example:

  ```yaml
  - uses: test-summary/action@v1
    with:
      output: "test/results/summary.md"
  ```

  If this is not specified, the output will be to the workflow summary.

  This file is [GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/) and may include permitted HTML.

* **`show`: which tests have to be shown in the summary** (optional, by default just the failed tests are shown in the summary)

  - To show all tests, specify: `show: "all"`. For example:

    ```yaml
    - uses: test-summary/action@v1
      with:
        show: "all"
    ```

  - To show no tests, specify: `show: "none"`


FAQ
---
* **How is the summary graphic generated? Does any of my data ever leave GitHub?**  
  None of your data ever leaves GitHub. Test results are read within GitHub Actions by the test-summary action, and a link to an SVG with the test results numbers is created. This the graphic is both fetched and subsequently cached by GitHub's image service. This service provides no referral information to remote hosts. This means that no information at all about your workflow - the repository name, test results, or other information - is available to the image generator service.

Questions / Help / Contact
--------------------------
Have questions? Need help? Visit [the discussion forum](https://github.com/test-summary/action/discussions).

Copyright (c) 2022 Edward Thomson. Available under the MIT license.
