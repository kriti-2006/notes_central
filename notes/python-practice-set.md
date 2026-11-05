## How to use this practice set

Predict the output or write the code first, then open each question to check.

?? What is the output of print(7 // 2, 7 % 2, 2 ** 3)?
`3 1 8`. `//` is floor division, `%` gives the remainder and `**` is the power operator.

?? What does "notes"[::-1] return?
`"seton"`. A step of −1 walks the string backwards.

?? What is the difference between a list and a tuple?
A **list** is mutable, which means you can add, remove or change items. A **tuple** is immutable. Tuples are slightly faster and can be used as dictionary keys.

?? Write a function that returns True if a number is prime.
```
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
```

?? What happens with int(input()) if the user types "abc"?
Python raises a **ValueError**. Wrap the call in `try`/`except ValueError` to handle it gracefully.

?? How do you count how often each word appears in a sentence?
```
counts = {}
for word in sentence.split():
    counts[word] = counts.get(word, 0) + 1
```

?? Why is "with open(...)" preferred over calling open() and close() yourself?
The `with` statement closes the file automatically, even if an exception occurs, so files are never left open by mistake.
