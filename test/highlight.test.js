import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import hljs from 'highlight.js/lib/core';
import lean4 from '../src/languages/lean4.js';

hljs.registerLanguage('lean4', lean4);

const source = readFileSync(new URL('./fixtures.lean', import.meta.url), 'utf8');
const { value: html } = hljs.highlight(source, { language: 'lean4' });

const scopeOf = (token) => {
  const re = new RegExp(`<span class="hljs-([\\w.-]+)">${token}\\b`);
  return (html.match(re) || [])[1];
};

test('registers and highlights without throwing', () => {
  assert.ok(html.length > source.length);
});

test('commands and modifiers are keywords', () => {
  for (const kw of ['theorem', 'structure', 'abbrev', 'namespace', 'deriving'])
    assert.equal(scopeOf(kw), 'keyword', kw);
});

test('Lean 4 vocabulary the Lean 3 grammar lacks', () => {
  for (const kw of ['deriving', 'abbrev', 'where', 'set_option'])
    assert.equal(scopeOf(kw), 'keyword', kw);
});

test('Prop is a type, #eval a built_in, true a literal', () => {
  assert.equal(scopeOf('Prop'), 'type');
  assert.equal(scopeOf('#eval'), 'built_in');
  assert.equal(scopeOf('true'), 'literal');
});

test('sorry gets its own scope', () => {
  assert.match(html, /<span class="hljs-sorry">sorry<\/span>/);
});

test('nested block comments close at the outer -/', () => {
  // The inner `/- ... -/` opens a comment span *inside* the outer one; a flat
  // begin/end mode would instead end the comment at the inner `-/` and leave
  // "that must survive." unhighlighted.
  assert.match(
    html,
    /^<span class="hljs-comment">\/- A nesting <span class="hljs-comment">\/- block comment -\/<\/span> that must survive\. -\/<\/span>/
  );
});

test('the defined name is a title', () => {
  assert.match(html, /hljs-title[\w .-]*">urgency_principle/);
});

test('guillemet identifiers survive their spaces', () => {
  assert.match(html, /hljs-title[\w .-]*">«a quoted name»/);
});

test('interpolation holes are substitutions', () => {
  assert.match(html, /hljs-subst/);
});

test('hex literals are numbers', () => {
  assert.match(html, /<span class="hljs-number">0x1F<\/span>/);
});

test('binders are keywords', () => {
  for (const b of ['∀', '∃', 'λ'])
    assert.match(html, new RegExp(`<span class="hljs-keyword">${b}</span>`), b);
});

test('logical and set notation are operators', () => {
  for (const op of ['→', '∈', '∉', '≤', '∧'])
    assert.match(html, new RegExp(`<span class="hljs-operator">${op}</span>`), op);
});

test('ASCII := is an operator', () => {
  assert.match(html, /<span class="hljs-operator">:=<\/span>/);
});

test('number sets are types', () => {
  assert.match(html, /<span class="hljs-type">ℕ<\/span>/);
});
