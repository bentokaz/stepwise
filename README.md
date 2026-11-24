# Stepwise

Math practice in the browser. Every question is generated fresh, you get two tries, and after a second miss it walks through the working step by step. Each lesson has a notepad, a graphing calculator and worked examples beside the problem. Progress is saved in the browser.

## Lessons

| Group | Lesson |
|---|---|
| Equations | One-step (×), One-step (÷), Two-step, Distributive property |
| Number sense | Integer operations, Adding fractions, Percent of a number |
| Graphing | Slope from a graph |

All answers are whole numbers from −9 to 9.

## Run it locally

```sh
npm install
npm run dev
```

## Test and build

```sh
npm test        # question generators, answer parsing, graph expressions
npm run build   # type-check and build to dist/
```

## Deploying

```sh
npm run deploy
```

This runs the tests, builds the site and force-pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves at https://bentokaz.github.io/stepwise/.

## Adding a lesson

Add an entry to `TOPICS` in `src/math/topics.ts`. Its `gen()` returns the question, the answer and the lines of working. The tests check every lesson automatically.

## Layout

```
src/
  math/      core.ts (fractions, random), html.ts (typesetting), topics.ts (lessons),
             parse.ts (answer box), expr.ts (graph expressions)
  ui/        practice.ts, menu.ts, walkthrough.ts, notepad.ts, graph.ts, fx.ts, sound.ts
  state.ts   saved progress
  main.ts    routing between the lessons page and practice
tests/       vitest
```
