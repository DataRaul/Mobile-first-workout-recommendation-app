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
if old not in text:
    raise SystemExit("candidate patch target not found")
path.write_text(text.replace(old, new, 1))
