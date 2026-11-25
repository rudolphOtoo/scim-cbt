# SCIM Practice CBT

A computer-based practice exam for the MPhil Scientific Computing & Industrial Modelling (SCIM) entrance examination (KNUST / NIMS).

**Live site:** https://rudolphotoo.github.io/scim-cbt/

> The questions are **unofficial revision material** written for practice at undergraduate entrance level. They are not past papers, and the real exam's format, length and difficulty may differ.

## Features

- 125 multiple-choice questions, 25 each in Algebra, Calculus, Differential Equations, Numerical Analysis and Mathematical Analysis
- **Mock mode:** countdown timer that auto-submits at 0:00; answers and explanations at the end
- **Practice mode:** instant feedback with an explanation after each question, plus "Reset question"
- Choose the subjects, the number of questions and the time limit; questions and answer choices are shuffled every attempt, with a balanced pick across subjects
- Numbered navigator bubbles, flag for review, and a confirm dialog before you submit
- Results with a score, per-subject bars and your weakest area
- Review filters (All / Wrong / Flagged / Unanswered) and **Retry wrong answers**
- Attempt history and resume of an unfinished test, saved in your browser (localStorage)
- Keyboard shortcuts: <kbd>A</kbd>–<kbd>D</kbd> answer, <kbd>←</kbd> <kbd>→</kbd> move, <kbd>F</kbd> flag
- Light and dark theme (follows your system setting) and a mobile layout

No frameworks, no build step, no tracking. The only outside request is for Google Fonts.

## Run locally

Double-click `index.html` to open it in your browser. It works straight from the file system.

Or serve the folder:

```sh
npx serve .
```

## Project layout

```
index.html          markup
css/style.css       styles
js/questions.js     the question bank (const Q = [...])
js/app.js           app logic
tests/validate.mjs  question bank checks
```

## Adding questions

Questions live in `js/questions.js`, one per line, in the `Q` array. Each entry is:

```js
[subject, question, [option A, option B, option C, option D], correctIndex, explanation]
```

For example:

```js
["Algebra","Find det(A) for A = [[2, 1], [5, 3]].",["1","11","−1","7"],0,"det = (2)(3) − (1)(5) = 6 − 5 = 1."],
```

- `subject` must be exactly one of: `Algebra`, `Calculus`, `Differential Equations`, `Numerical Analysis`, `Mathematical Analysis`.
- `correctIndex` is 0–3 and points into the options array (0 = first option).
- Options are shuffled when the test runs, so the correct one can go in any position.
- Use plain text and Unicode for maths (², √, ∫, θ). Text is shown as-is, not as HTML.

Then run the checks.

## Tests

```sh
npm test
```

This runs `tests/validate.mjs` with Node (version 18 or later, no dependencies). It checks every question for the right number of fields, exactly 4 options, no duplicate options, a correct index of 0–3, a non-empty explanation, a known subject and no duplicate question text. On success it prints the number of questions per subject; on failure it lists each problem and exits with code 1.

## License

[MIT](LICENSE)
