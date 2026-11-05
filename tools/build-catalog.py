"""Build data/resources.json from the subject list below and the Markdown files in notes/.

Reading time is computed from each file's real word count (200 words per minute).
Run after adding or editing notes:  python3 tools/build-catalog.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

SUBJECTS = [
    # id, title, short, category, hue, description, keywords
    ("data-structure", "Data Structure", "DS", "Core CS", "teal",
     "Arrays, linked lists, stacks, queues, trees and graphs, and the algorithms that work on them.", "ds dsa algorithms"),
    ("technical-communication", "Technical Communication", "TC", "Humanities", "rose",
     "Writing, presentation and professional communication skills for engineers.", "tc english writing"),
    ("dstl", "DSTL", "DSTL", "Mathematics", "violet",
     "Discrete Structures & Theory of Logic: sets, relations, functions and logic.", "discrete structures theory of logic discrete mathematics"),
    ("python", "Python", "PY", "Programming", "blue",
     "Python programming fundamentals: data types, control flow, functions, files and modules.", "python programming coding"),
    ("laser", "Laser", "LS", "Science", "red",
     "Principles of lasers, types of laser systems and their engineering applications.", "laser physics optics"),
    ("operating-system", "Operating System", "OS", "Core CS", "green",
     "Processes, CPU scheduling, memory management, file systems and deadlocks.", "os operating systems"),
    ("coa", "Computer Organisation and Architecture", "COA", "Core CS", "orange",
     "How a computer works inside: CPU design, instruction sets, memory hierarchy and I/O.", "coa computer organization architecture"),
    ("mathematics-3", "Mathematics-3", "M3", "Mathematics", "indigo",
     "Advanced engineering mathematics topics for second-year students.", "maths math mathematics 3 m3"),
    ("universal-human-values", "Universal Human Values", "UHV", "Humanities", "olive",
     "Self-exploration, harmony in family, society and nature, and professional ethics.", "uhv ethics values"),
]

RESOURCES = [
    # id (= file name), subject, title, type, topics, summary, featured
    ("ds-complexity-arrays-linked-lists", "data-structure", "Complexity, Arrays & Linked Lists", "Notes",
     ["big-o", "arrays", "linked list"], "Big-O notation, how arrays are stored, and singly, doubly and circular linked lists compared.", True),
    ("ds-stacks-queues", "data-structure", "Stacks & Queues", "Notes",
     ["stack", "queue", "postfix", "circular queue"], "LIFO and FIFO structures, postfix evaluation, circular queues, deques and priority queues.", False),
    ("ds-trees-graphs-revision", "data-structure", "Trees & Graphs Revision Sheet", "Revision sheet",
     ["binary tree", "bst", "heap", "bfs", "dfs"], "Traversals, BSTs, heaps, graph representations, BFS, DFS and key graph algorithms at a glance.", False),
    ("tc-process-of-communication", "technical-communication", "The Communication Process & Barriers", "Notes",
     ["communication process", "barriers", "7 cs"], "The elements of the communication cycle, levels of communication, barriers and the 7 Cs.", False),
    ("tc-technical-writing", "technical-communication", "Technical Writing: Reports, Letters & Emails", "Notes",
     ["report", "letter", "email", "resume"], "Features of technical writing, report structure, formal letters, professional emails and resumes.", False),
    ("dstl-sets-relations-functions", "dstl", "Sets, Relations & Functions", "Notes",
     ["sets", "relations", "functions", "equivalence"], "Set operations, the properties of relations, equivalence relations, posets and types of functions.", False),
    ("dstl-propositional-logic", "dstl", "Propositional & Predicate Logic", "Notes",
     ["logic", "tautology", "inference", "quantifiers"], "Connectives, equivalences, normal forms, rules of inference and quantifiers.", True),
    ("dstl-practice-set", "dstl", "Sets & Logic Practice Set", "Practice set",
     ["practice", "sets", "logic"], "Seven exam-style questions on sets, relations, functions and logic, with worked answers.", False),
    ("python-basics", "python", "Python Basics: Types, Operators & Control Flow", "Notes",
     ["data types", "operators", "loops", "strings"], "Variables, built-in types, operators, input and output, conditionals, loops and strings.", True),
    ("python-functions-files", "python", "Functions, Modules & File Handling", "Notes",
     ["functions", "recursion", "files", "exceptions"], "Arguments, scope, lambdas, recursion, modules, file modes and exception handling.", False),
    ("python-practice-set", "python", "Python Practice Set", "Practice set",
     ["practice", "output questions"], "Output prediction and short coding questions with answers.", False),
    ("laser-fundamentals", "laser", "Laser Fundamentals", "Notes",
     ["stimulated emission", "population inversion", "einstein coefficients"], "Properties of laser light, absorption and emission, population inversion and laser components.", False),
    ("laser-types-applications", "laser", "Types of Lasers & Applications", "Revision sheet",
     ["ruby laser", "he-ne laser", "semiconductor laser"], "Ruby, He-Ne and semiconductor lasers compared, plus their applications.", False),
    ("os-processes-scheduling", "operating-system", "Processes & CPU Scheduling", "Notes",
     ["process", "pcb", "scheduling", "round robin"], "Process states, PCBs, threads, scheduling criteria and FCFS, SJF, priority and round robin.", True),
    ("os-memory-deadlocks", "operating-system", "Memory Management & Deadlocks", "Notes",
     ["paging", "virtual memory", "deadlock", "banker's algorithm"], "Allocation strategies, paging, page replacement, thrashing and deadlock handling.", False),
    ("coa-data-representation-cpu", "coa", "Data Representation & CPU Organisation", "Notes",
     ["number systems", "2's complement", "registers", "addressing modes"], "Number systems, signed and floating-point numbers, registers, the instruction cycle and addressing modes.", False),
    ("coa-memory-hierarchy", "coa", "Memory Hierarchy & Cache", "Notes",
     ["cache", "mapping", "locality"], "Locality of reference, cache performance, mapping techniques and write policies.", False),
    ("m3-fourier-series", "mathematics-3", "Fourier Series", "Notes",
     ["fourier series", "euler's formulas", "half-range"], "Euler's formulas, Dirichlet's conditions, even and odd functions, change of interval and half-range series.", False),
    ("m3-laplace-transform-revision", "mathematics-3", "Laplace Transform Revision Sheet", "Revision sheet",
     ["laplace transform", "inverse laplace", "differential equations"], "Standard transforms, key properties, inverses and solving ODEs on one page.", False),
    ("uhv-self-exploration", "universal-human-values", "Self-Exploration & Human Aspirations", "Notes",
     ["self-exploration", "happiness", "prosperity"], "Value education, natural acceptance, basic human aspirations and the self and body.", False),
    ("uhv-harmony-family-society-nature", "universal-human-values", "Harmony in Family, Society & Nature", "Notes",
     ["harmony", "relationships", "four orders"], "The nine feelings, harmony in society and the four orders of nature.", False),
]

ADDED = "2026-11-05"


def main():
    subject_ids = {s[0] for s in SUBJECTS}
    resources = []
    for rid, subject, title, rtype, topics, summary, featured in RESOURCES:
        assert subject in subject_ids, rid
        path = ROOT / "notes" / f"{rid}.md"
        words = len(re.findall(r"\w+", path.read_text(encoding="utf-8")))
        resources.append({
            "id": rid, "subject": subject, "title": title, "type": rtype,
            "topics": topics, "summary": summary, "file": f"notes/{rid}.md",
            "minutes": max(1, round(words / 200)), "added": ADDED, "featured": featured,
        })
    catalog = {
        "years": [
            {"year": 1, "label": "1st year", "status": "coming-soon"},
            {"year": 2, "label": "2nd year", "status": "available"},
            {"year": 3, "label": "3rd year", "status": "coming-soon"},
        ],
        "subjects": [
            {"id": i, "title": t, "short": sh, "category": c, "hue": h, "year": 2, "description": d, "keywords": k}
            for i, t, sh, c, h, d, k in SUBJECTS
        ],
        "resources": resources,
    }
    out = ROOT / "data" / "resources.json"
    out.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(resources)} resources for {len(SUBJECTS)} subjects to {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
