---
reviewed: false
sources:
  - design/source/resume.md
  - https://github.com/Kushal-Shr/Zenith (README)
---

## the problem

Data structures are easy to draw on a whiteboard and hard to see in your own code. When a pointer goes wrong in C++, you're staring at text and trying to picture the nodes in your head.

## what I built

Zenith, the "Ghost Visualizer", is a VS Code extension. It opens a transparent panel next to your C++ code and draws the data structure that code is building: linked lists, binary trees, arrays and stacks. It updates as you type and as you move the cursor.

- **live trace:** shows the state at exactly the line your cursor is on. Pointer variables (`curr`, `left`, `slow`, `fast`…) are drawn as labeled arrows that glide between nodes.
- **full playback:** after 2 seconds without typing, it generates a step-by-step trace of the whole algorithm and plays it back. Discarded nodes dim out.
- **Big-O heatmap:** nodes warm from blue to red the more they're accessed, with an estimated complexity badge, such as `O(log n)` for a search in a binary search tree.
- **best-practice mentor:** flags crashes (null dereference, use-after-free, out-of-bounds) in red, and softer issues like memory leaks in amber. A one-click fix applies the suggestion to the editor.
- **learning roadmap:** when you're done, it suggests the next topic, with three LeetCode problems and starter pseudocode.

## how it works

1. Cursor moves and edits are debounced, at 100 ms and 200 ms.
2. The code and the current line go to Gemini, prompted to act as a C++ execution engine. For files over 100 lines, only a window around the cursor is sent.
3. Gemini answers with structured JSON: nodes, edges, pointers, variables, the highlighted node and the complexity.
4. The extension posts that JSON to a webview, where p5.js renders it with spring animations, so nothing snaps.
5. Layouts and playbacks are cached by a hash of the code, so revisiting the same code doesn't call the model again.

## what was hard

Making it feel live. Every view depends on a model call, so the extension debounces input, sends only the code near the cursor in large files, and caches every result.

<!-- TODO(kushal): what was the hardest part for you? Getting consistent JSON back? Animation timing? Was Zenith built for a hackathon (the repo is from March 7–8, 2026)? -->
