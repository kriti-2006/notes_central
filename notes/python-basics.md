## Why Python?

Python is an **interpreted, high-level, dynamically typed** language that is known for its readable syntax. It uses **indentation** instead of braces to mark blocks of code.

## Variables and data types

You do not declare a type; Python works it out from the value.

```
age = 20            # int
cgpa = 8.4          # float
name = "Asha"       # str
is_enrolled = True  # bool
```

| Type | Mutable? | Example |
| --- | --- | --- |
| list | Yes | [1, 2, 3] |
| tuple | No | (1, 2, 3) |
| set | Yes | {1, 2, 3} |
| dict | Yes | {"roll": 21} |
| str | No | "hello" |

Use `type(x)` to check a value's type.

## Operators

- **Arithmetic:** `+  -  *  /  //  %  **`. Note that `/` always returns a float and `//` is floor division.
- **Comparison:** `==  !=  <  >  <=  >=`
- **Logical:** `and  or  not`
- **Membership:** `in` and `not in`
- **Identity:** `is` and `is not`, which compare objects rather than values

## Input and output

```
name = input("Your name: ")
marks = int(input("Marks: "))
print(f"{name} scored {marks}")
```

`input()` always returns a **string**, so convert it before doing arithmetic.

## Control flow

```
if marks >= 90:
    grade = "A"
elif marks >= 75:
    grade = "B"
else:
    grade = "C"
```

### Loops

```
for i in range(1, 6):      # 1 to 5
    print(i)

count = 0
while count < 3:
    count += 1
```

- `break` exits the loop.
- `continue` skips to the next iteration.
- A loop's `else` block runs only if the loop finished without `break`.

## Strings

- Slicing: `s[start:stop:step]`. For example, `"python"[1:4]` is `"yth"`, and `s[::-1]` reverses a string.
- Useful methods: `upper()`, `lower()`, `strip()`, `split()`, `join()`, `replace()`, `find()`.
