from pathlib import Path

path = Path("src/programme.js")
text = path.read_text()
old = """        if (alternative) {
          // With 1,324 records available, prefer weekly variety over repeating
          // the same exercise in another workout.
          selection = alternative;
        }"""
new = """        if (alternative && selectionQuality(alternative) <= selectionQuality(selection)) {
          // Prefer weekly variety only when it does not downgrade the requested
          // muscle, role, or difficulty fit. Exact programme coverage outranks novelty.
          selection = alternative;
        }"""
if new in text:
    print("planner candidate policy already applied")
elif old in text:
    path.write_text(text.replace(old, new, 1))
    print("planner candidate policy applied")
else:
    raise SystemExit("candidate patch target not found")
