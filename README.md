# highlightjs-lean4

A [highlight.js](https://highlightjs.org) grammar for **Lean 4**.

`leanprover-community/highlightjs-lean` is a **Lean 3** grammar — `begin`/`end`,
`assume`, `existsi`, `tt`/`ff` — and has not moved since June 2024. It knows none
of Lean 4's vocabulary (`abbrev`, `deriving`, `where`, `macro`, `syntax`,
`termination_by`) and highlights `begin`/`end`, which Lean 4 does not have. This
is a separate grammar for the current language.

highlight.js core does not accept new languages
([CONTRIBUTING](https://github.com/highlightjs/highlight.js/blob/main/CONTRIBUTING.md)),
so this ships as a third-party package.

## Install

```sh
npm install highlight.js highlightjs-lean4
```

```js
import hljs from 'highlight.js/lib/core';
import lean4 from 'highlightjs-lean4';

hljs.registerLanguage('lean4', lean4);
hljs.highlight(source, { language: 'lean4' });
```

Registered as `lean4`, aliased `lean4`. Register it under `lean` as well if your
fences are labelled that way.

Works in Node (build-time highlighting, e.g. from a markdown-it `highlight`
hook) and in the browser alike — it is a grammar, not a runtime.

## Scopes

Mostly the standard highlight.js scopes, so any stock theme works. Two notes:

| Scope | Covers |
|---|---|
| `hljs-keyword` | commands, tactics, modifiers (`theorem`, `deriving`, `private`) |
| `hljs-type` | `Prop`, `Type`, `Sort` |
| `hljs-built_in` | `#eval`, `#check`, `#print`, … |
| `hljs-title function_` | the name introduced by a definition command |
| `hljs-meta` | `@[simp]`, `attribute [instance]` |
| `hljs-subst` | interpolation holes in `s!"…{x}…"` |
| `hljs-operator` | `→ ↦ ∈ ∉ ≤ ∧ ∘ ×`, `:=`, `->` … |
| **`hljs-sorry`** | `sorry`, `admit`, `#exit` |

`hljs-sorry` is not a standard scope and **no stock theme styles it.** Upstream
marks these `invalid.illegal`; incomplete proofs are worth seeing. Add your own:

```css
.hljs-sorry { background: #ffdddd; color: #b00; font-weight: bold; }
```

(`highlightjs-lean` invented the same scope, so themes carrying a rule for it
already will pick this up.)

## Beyond upstream, deliberately

vscode-lean4's TextMate grammar scopes very little inside a theorem, because in
VS Code the colour comes from Lean's **semantic token server** — from running
the compiler. Ported faithfully, a real theorem highlights its `theorem`
keyword and its name and nothing else.

So this grammar adds three things upstream has no reason to: binders
(`λ ∀ ∃`) as keywords, logical/set/order notation (`→ ↔ ↦ ∘ × ∧ ∨ ¬ ∈ ∉ ⊆ ∪ ∩
≤ ≥ ≠ ≡ ⊢ ⁻¹`, plus ASCII `:=`, `->`, `<-`, `=>`) as operators, and the number
sets (`ℕ ℤ ℝ ℚ ℂ`) as types. Static Lean is the whole use case here; matching a
grammar that expects a language server behind it would be fidelity to the wrong
thing.

## Not supported

Doc comments render as plain comments. Upstream embeds a whole markdown
grammar inside `/-- … -/` (a separate 94KB file that recursively re-embeds
Lean); that is not ported and is not planned.

Twenty tokens in upstream's keyword list are not word-shaped — `by?`,
`binop%`, `exact?%`, `import all`, `trace[…]` and friends. highlight.js matches
keywords with a single word pattern, so these are dropped rather than
mis-highlighted; the generated `src/keywords.js` lists them in its header.

Tactic vs. term position is not distinguished. highlight.js has no parser
state, so `exact` and `simp` highlight as keywords wherever they appear. Lean's
tactic set is user-extensible and open-ended in any case.

## Keeping up with Lean

The keyword sets are **generated, not copied**:

```sh
npm run gen    # refetches vscode-lean4's lean4.json, rewrites src/keywords.js
npm test
```

Lean's keyword list churns with the language — `grind_propagator`,
`partial_fixpoint`, `reprove` and `register_error_explanation` are all recent
additions — and a hand-copied list rots silently. Re-run the generator after a
Lean release and commit the diff. Only the mode structure (comments, strings,
definition commands) is hand-written, and that part is stable.

## Status

Not yet published to npm. Built by [CyberChitta](https://www.cyberchitta.cc)
and offered to the Lean 4 maintainers; if they want it, it moves to them.
Until then it lives here.

## License

Apache-2.0, matching
[vscode-lean4](https://github.com/leanprover/vscode-lean4), from whose TextMate
grammar this is derived. See `NOTICE`.
