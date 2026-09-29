from pathlib import Path
p = Path("assets/wheel-level2-pryanosti-koritsa-rendered.svg").read_text(encoding="utf-8")
i = p.find('aria-pressed="true"')
print(p[i-200:i+900])
print("---GLOW---")
j = p.find('opacity:1', i)
print(p[j-120:j+80])
