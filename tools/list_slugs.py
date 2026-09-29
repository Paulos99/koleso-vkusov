import json

w = json.load(open("assets/flavor-tree-wheel.json", encoding="utf-8"))
out = []
for sec in w:
    out.append(f"S\t{sec['id']}\t{sec['slug']}\t{sec['name']}")
    for ss in sec["subsectors"]:
        out.append(f"U\t{ss['id']}\t{ss['slug']}\t{ss['name']}\t{sec['slug']}")
        for d in ss["descriptors"]:
            hide = int(bool(d.get("hideFromWheel")))
            out.append(
                f"D\t{d['id']}\t{d['slug']}\t{d['name']}\t{sec['slug']}\t{ss['slug']}\t{hide}"
            )
open("tools/slugs.tsv", "w", encoding="utf-8").write("\n".join(out))
print(len(out))
