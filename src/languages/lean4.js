/*
Language: Lean 4
Description: Language definition for the Lean 4 theorem prover
Category: scientific, functional
Website: https://lean-lang.org

Ported from leanprover/vscode-lean4's TextMate grammar (Apache-2.0). The
keyword lists are generated from it by build/gen-keywords.mjs rather than
copied, so a Lean release can be picked up by re-running the generator.
*/

import KEYWORDS from '../keywords.js';

export default function lean4(hljs) {
  // Covers `#eval`, `panic!`, `foo'` and `dbg_trace` — hljs's default \w+
  // would split every one of them.
  const KEYWORD_PATTERN = /#?[A-Za-z_][\w!']*/;

  // Lean block comments nest. `contains: ['self']` is what buys that; a flat
  // begin/end mode would close on the first inner `-/`.
  const BLOCK_COMMENT = {
    scope: 'comment',
    begin: /\/-/,
    end: /-\//,
    contains: ['self'],
  };

  // `/--` (doc) and `/-!` (module doc) must precede the plain `/-` mode, or
  // it swallows their opener.
  const DOC_COMMENT = {
    scope: 'comment',
    begin: /\/-[-!]/,
    end: /-\//,
    contains: ['self', { scope: 'doctag', begin: /@\[[^\]]*\]/ }],
  };

  const COMMENTS = [hljs.COMMENT(/--/, /$/), DOC_COMMENT, BLOCK_COMMENT];

  const ESCAPE = {
    scope: 'char.escape',
    match: /\\(?:[\\"ntr']|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4})/,
  };

  const STRING = {
    scope: 'string',
    begin: /"/,
    end: /"/,
    contains: [ESCAPE],
  };

  // s!"..{x}.." and friends: the prefix is a keyword, the braces are holes.
  const INTERPOLATED_STRING = {
    scope: 'string',
    begin: /(?:s!|m!|throwError|dbg_trace|panic!|reportIssue!)\s*"/,
    end: /"/,
    contains: [
      ESCAPE,
      {
        scope: 'subst',
        begin: /\{/,
        end: /\}/,
        keywords: { $pattern: KEYWORD_PATTERN, ...KEYWORDS },
      },
    ],
  };

  const CHAR = {
    scope: 'string',
    match: /(?<!\]|\w)'(?:\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|.)|[^\\'])'/,
  };

  // «guillemet identifiers» may contain anything, including keywords and
  // spaces, so they get their own mode rather than falling to the tokenizer.
  const FRENCH_QUOTED = {
    scope: 'title',
    begin: /«/,
    end: /»/,
  };

  // `@[simp, inline]` and `attribute [instance]`.
  const ATTRIBUTE = {
    scope: 'meta',
    match: /(?:@|\battribute\b\s*)\[[^\]\s]*\]/,
  };

  // ---------------------------------------------------------------------
  // Beyond upstream. vscode-lean4's grammar scopes almost nothing here,
  // because in VS Code the colour comes from Lean's *semantic token server* —
  // from running the compiler. Statically highlighted Lean therefore renders
  // almost entirely plain: a real theorem lights up its `theorem` and its
  // name, and nothing else. These three modes buy back the notation that
  // carries the meaning. They are a deliberate divergence from upstream.
  // ---------------------------------------------------------------------

  // Binders read as keywords: they introduce, they do not relate.
  const BINDER = { scope: 'keyword', match: /[λ∀∃]/ };

  // Arrows, connectives, set and order relations, plus ASCII `:=` and `->`.
  // Longest alternatives first — `⁻¹` and `<->` must beat their prefixes.
  const OPERATOR = {
    scope: 'operator',
    match: /⁻¹|<->|->|<-|=>|:=|[→←↔↦⟶⟹∘×∧∨¬∈∉⊆⊂⊇⊃∪∩≤≥≠≡≈∣⊢±∑∏√∫∞]/,
  };

  // Mathlib's number sets. Not identifiers in practice — nobody rebinds ℕ.
  const MATH_TYPE = { scope: 'type', match: /[ℕℤℝℚℂ𝔽𝕜]/ };

  // Lean names types, structures, classes and constructors in UpperCamelCase
  // and everything else in lowerCamelCase or snake_case, near-universally in
  // core and mathlib. A grammar cannot know what a name *is*, but that
  // convention is regular enough to colour on. Namespaces (`Nat` in
  // `Nat.succ`) land here too, which is the right answer often enough.
  // `[A-Z]`, not `\p{Lu}`: hljs recompiles every mode's regex into one
  // combined pattern WITHOUT the `u` flag, so a Unicode property escape is
  // read as a literal and silently matches nothing. Lean type names are
  // ASCII-initial in practice anyway — Greek here is lowercase type
  // variables (`α β γ`), which are not types to colour.
  const UPPER_TYPE = {
    scope: 'type',
    match: /\b[A-Z][\w'\u2080-\u209C]*/,
    relevance: 0,
  };

  // Binder variables: the run of names ahead of a `:` inside a binder group,
  // so `(fewer more : Finset α)` colours both. Three things this has to get
  // right, each of which it got wrong first:
  //   - `(?!=)` keeps `:=` out; that is an operator, not a binder.
  //   - the separator is `[ \t]`, not `\s`. With `\s` a run crosses a
  //     newline, and `where` at the end of one line joined `size` at the
  //     start of the next into a single bogus binder.
  //   - keywords are excluded up front. `example : Bool` is a command taking
  //     a colon directly, and without the guard `example` reads as a binder.
  //     Built from the generated keyword list so it tracks Lean releases.
  const IDENT = "[a-z_][\\w'\\u2080-\\u209C]*";
  const LOWER_KEYWORDS = KEYWORDS.keyword
    .filter((w) => /^[a-z_]/.test(w))
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const PARAMS = {
    scope: 'params',
    match: new RegExp(
      `\\b(?!(?:${LOWER_KEYWORDS})\\b)${IDENT}(?:[ \\t]+${IDENT})*(?=[ \\t]*:(?!=))`
    ),
    relevance: 0,
  };

  const NUMBER = {
    scope: 'number',
    match: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
    relevance: 0,
  };

  // After a definition command the next token is the name being defined.
  // The end lookahead is upstream's: stop at whatever begins the signature.
  const DEFINITION = {
    beginKeywords:
      'inductive coinductive structure theorem axiom abbrev lemma def instance class',
    end: /(?=\bwith\b|\bextends\b|\bwhere\b|[:|(\[{⦃<>])/,
    excludeEnd: true,
    contains: [
      ...COMMENTS,
      FRENCH_QUOTED,
      {
        scope: 'title.function',
        match: /[^:«»(){}\s=→λ∀?][^:«»(){}\s]*/,
        relevance: 0,
      },
    ],
    relevance: 0,
  };

  return {
    name: 'Lean 4',
    aliases: ['lean4'],
    keywords: { $pattern: KEYWORD_PATTERN, ...KEYWORDS },
    contains: [
      ...COMMENTS,
      ATTRIBUTE,
      INTERPOLATED_STRING,
      STRING,
      CHAR,
      FRENCH_QUOTED,
      DEFINITION,
      MATH_TYPE,
      BINDER,
      OPERATOR,
      // Before UPPER_TYPE: a binder run is lowercase, but keeping the pair
      // adjacent documents that they partition the identifier space.
      PARAMS,
      UPPER_TYPE,
      NUMBER,
    ],
  };
}
