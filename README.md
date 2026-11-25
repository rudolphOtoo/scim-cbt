# SCIM Practice CBT

A computer-based practice exam for the MPhil Scientific Computing & Industrial Modelling (SCIM) entrance examination (KNUST / NIMS).

**Live site:** https://rudolphotoo.github.io/scim-cbt/

> The questions are **unofficial revision material** written for practice at undergraduate entrance level. They are not past papers, and the real exam's format, length and difficulty may differ.

## Features

- 156 questions across Algebra, Calculus, Differential Equations, Numerical Analysis and Mathematical Analysis: 125 multiple choice and 31 fill-in
- **Fill-in questions:** type a number, a fraction (1/6) or a short expression (2pi/3, sqrt(3), e^3). Answers are matched by value, so decimals to 3 significant figures count
- **Mock mode:** countdown timer that auto-submits at 0:00; answers and explanations at the end
- **Practice mode:** instant feedback with an explanation after each question, plus "Reset question"
- Choose the subjects, the question types (multiple choice, fill-in or both), the number of questions and the time limit; questions and answer choices are shuffled every attempt, with a balanced pick across subjects
- Numbered navigator bubbles, flag for review, and a confirm dialog before you submit
- Results with a score, per-subject bars and your weakest area
- Review filters (All / Wrong / Flagged / Unanswered) and **Retry wrong answers**
- Attempt history and resume of an unfinished test, saved in your browser (localStorage)
- Keyboard shortcuts: <kbd>A</kbd>–<kbd>D</kbd> answer, <kbd>←</kbd> <kbd>→</kbd> move, <kbd>F</kbd> flag, <kbd>Enter</kbd> check a typed answer
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

Questions live in `js/questions.js`, one per line, in the `Q` array. There are two kinds of entry.

**Multiple choice:**

```js
[subject, question, [option A, option B, option C, option D], correctIndex, explanation]
["Algebra","Find det(A) for A = [[2, 1], [5, 3]].",["1","11","−1","7"],0,"det = (2)(3) − (1)(5) = 6 − 5 = 1."],
```

**Fill-in:** the third field is the word `"fill"` and the fourth is a list of accepted answers. The first one is shown as the correct answer.

```js
[subject, question, "fill", [accepted answers], explanation]
["Calculus","Evaluate ∫₀¹ 1 / (1 + x²) dx. (You may type pi.)","fill",["π/4","pi/4"],"[arctan x] from 0 to 1 = π/4 ≈ 0.785."],
```

Typed answers are compared ignoring case and spaces. If both the typed answer and an accepted answer are numbers or simple expressions (digits, `+ - * / ^ ( )`, `pi`/`π`, `e`, `sqrt`/`√`), they are also compared by value to within 0.5%, so `π/4`, `0.785` and `pi/4` all count. For a word answer (such as "elliptic"), list each spelling you want to accept.

- `subject` must be exactly one of: `Algebra`, `Calculus`, `Differential Equations`, `Numerical Analysis`, `Mathematical Analysis`.
- For multiple choice, `correctIndex` is 0–3 and points into the options array (0 = first option).
- Options are shuffled when the test runs, so the correct one can go in any position.
- Use plain text and Unicode for maths (², √, ∫, θ). Text is shown as-is, not as HTML.

Then run the checks.

## Tests

```sh
npm test
```

This runs `tests/validate.mjs` with Node (version 18 or later, no dependencies). It checks every question for the right number of fields; for multiple choice, exactly 4 options, no duplicate options and a correct index of 0–3; for fill-in, a non-empty list of accepted answers; and for all questions a non-empty explanation, a known subject and no duplicate question text. On success it prints the number of questions per subject; on failure it lists each problem and exits with code 1.

## License

[MIT](LICENSE)
