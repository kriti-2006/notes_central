## Sets

A **set** is a well-defined collection of distinct objects.

| Operation | Symbol | Meaning |
| --- | --- | --- |
| Union | A ∪ B | Elements in A or B |
| Intersection | A ∩ B | Elements in both A and B |
| Difference | A − B | Elements in A but not in B |
| Complement | A′ | Elements of the universal set that are not in A |
| Symmetric difference | A ⊕ B | (A − B) ∪ (B − A) |

- **Power set:** the set of all subsets. If |A| = n, then |P(A)| = 2ⁿ.
- **De Morgan's laws:** (A ∪ B)′ = A′ ∩ B′ and (A ∩ B)′ = A′ ∪ B′.
- **Inclusion–exclusion:** |A ∪ B| = |A| + |B| − |A ∩ B|.

## Relations

A **relation** R from A to B is a subset of the Cartesian product A × B.

### Properties of a relation on a set A

- **Reflexive:** (a, a) ∈ R for every a ∈ A.
- **Symmetric:** if (a, b) ∈ R, then (b, a) ∈ R.
- **Antisymmetric:** if (a, b) ∈ R and (b, a) ∈ R, then a = b.
- **Transitive:** if (a, b) ∈ R and (b, c) ∈ R, then (a, c) ∈ R.

### Special relations

- **Equivalence relation:** reflexive, symmetric and transitive. It divides the set into **equivalence classes**.
- **Partial order:** reflexive, antisymmetric and transitive. A set with a partial order is called a **poset**.

## Functions

A **function** f : A → B assigns **exactly one** element of B to each element of A.

| Type | Condition |
| --- | --- |
| One-one (injective) | f(a₁) = f(a₂) implies a₁ = a₂ |
| Onto (surjective) | Every element of B has a pre-image |
| Bijective | Both one-one and onto |

- Only bijective functions have an **inverse**.
- **Composition:** (g ∘ f)(x) = g(f(x)).

> **Exam tip:** To prove a relation is an equivalence relation, check all three properties separately, and give a counterexample whenever a property fails.
