## Propositions

A **proposition** is a statement that is either true or false, but not both. For example, "7 is prime" is a proposition, while "Close the door" is not.

## Logical connectives

| Connective | Symbol | True when |
| --- | --- | --- |
| Negation | ¬p | p is false |
| Conjunction | p ∧ q | Both are true |
| Disjunction | p ∨ q | At least one is true |
| Implication | p → q | Except when p is true and q is false |
| Biconditional | p ↔ q | Both have the same truth value |

### Statements related to an implication p → q

- **Converse:** q → p
- **Inverse:** ¬p → ¬q
- **Contrapositive:** ¬q → ¬p, which is **logically equivalent** to p → q

## Tautology, contradiction and contingency

- **Tautology:** always true, for example p ∨ ¬p.
- **Contradiction:** always false, for example p ∧ ¬p.
- **Contingency:** neither of the above.

## Important equivalences

- p → q ≡ ¬p ∨ q
- ¬(p ∧ q) ≡ ¬p ∨ ¬q (De Morgan)
- ¬(p ∨ q) ≡ ¬p ∧ ¬q (De Morgan)
- p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r) (Distributive)

## Normal forms

- **CNF (conjunctive normal form):** an AND of ORs, for example (p ∨ q) ∧ (¬p ∨ r).
- **DNF (disjunctive normal form):** an OR of ANDs, for example (p ∧ q) ∨ (¬p ∧ r).

## Rules of inference

| Rule | Form |
| --- | --- |
| Modus ponens | p, p → q ⊢ q |
| Modus tollens | ¬q, p → q ⊢ ¬p |
| Hypothetical syllogism | p → q, q → r ⊢ p → r |
| Disjunctive syllogism | p ∨ q, ¬p ⊢ q |

## Predicate logic

- **Universal quantifier ∀x P(x):** P(x) holds for every x.
- **Existential quantifier ∃x P(x):** P(x) holds for at least one x.
- Negation swaps the quantifier: ¬∀x P(x) ≡ ∃x ¬P(x).
