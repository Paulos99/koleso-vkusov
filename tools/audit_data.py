import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = json.loads((root / "flavor-wheel" / "flavor-data.json").read_text(encoding="utf-8"))
print("keys", list(data.keys()))
notes = data.get("notes") or []
print("notes", len(notes))
levels = {}
for n in notes:
    levels[n.get("level")] = levels.get(n.get("level"), 0) + 1
print("levels", levels)
orbits = sorted({n.get("orbitElement") for n in notes})
print("orbit keys", len(orbits))
print("\n".join(orbits))
print("categoryOrbit", data.get("categoryOrbit"))
# missing texts
bad = [n["slug"] for n in notes if not n.get("short") or not n.get("howInCoffee") or not n.get("result")]
print("bad texts", len(bad))
