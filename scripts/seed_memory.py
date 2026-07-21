"""DocTick memory seed — populates ./memory with foundational project knowledge.

Re-runnable: track/update are append-based, so re-running just adds timeline entries.
Run:  PYTHONUTF8=1 .venv/Scripts/python.exe scripts/seed_memory.py
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")  # Windows cp1254 can't print memkraft's emoji

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from memkraft import MemKraft

mk = MemKraft(base_dir="memory")


def step(label, fn):
    try:
        out = fn()
        print(f"✅ {label}")
        return out
    except Exception as e:
        print(f"❌ {label}: {type(e).__name__}: {e}")
        return None


# --- 1. Core entities (live-notes, tier=core) ---
step("track DocTick", lambda: mk.track("DocTick", entity_type="project", source="seed"))
step("track ponytail", lambda: mk.track("Ponytail", entity_type="methodology", source="seed"))
step("track memkraft", lambda: mk.track("MemKraft", entity_type="tool", source="seed"))

# --- 2. Accumulate info on each ---
step("update DocTick #1",
     lambda: mk.update("DocTick", info="Internship (staj) project. Memory layer managed by memkraft.", source="seed"))
step("update DocTick #2",
     lambda: mk.update("DocTick", info="Tech: project-local Python venv (.venv); git repo on main.", source="seed"))
step("update Ponytail",
     lambda: mk.update("Ponytail", info="Lazy senior dev methodology: YAGNI ladder, reuse-first, shortest working diff, root-cause fixes, one self-check for non-trivial logic.", source="CLAUDE.md"))
step("update MemKraft",
     lambda: mk.update("MemKraft", info="Zero-dependency compound memory system. v3.0.3 installed. 229 public methods. Stores memory as plain Markdown in ./memory.", source="seed"))

# --- 3. Bitemporal facts ---
step("fact memory_tool",
     lambda: mk.fact_add("DocTick", "memory_tool", "memkraft", valid_from="2026-07-21"))
step("fact install_scope",
     lambda: mk.fact_add("DocTick", "install_scope", "project-venv", valid_from="2026-07-21"))
step("fact python_version",
     lambda: mk.fact_add("DocTick", "python_version", "3.14.4", valid_from="2026-07-21"))

# --- 4. Decisions (what / why / how) ---
step("decision: memkraft",
     lambda: mk.decision_record(
         what="Use memkraft as DocTick's memory layer",
         why="Zero-dependency, git-friendly, offline, plain-Markdown; user explicitly requested this repo.",
         how="pip install into project .venv; memkraft init --template claude-code; wire via agents-hint.",
         tags=["memory", "architecture"], source="seed"))
step("decision: venv not global",
     lambda: mk.decision_record(
         what="Install memkraft in project venv, not globally",
         why="User wanted project-specific ('global değil'). Keeps global Python clean.",
         how="python -m venv .venv; .venv/Scripts/pip install memkraft.",
         tags=["environment"], source="seed"))
step("decision: CLI+Python over MCP",
     lambda: mk.decision_record(
         what="Integrate via CLI+Python+agents-hint, not MCP",
         why="MCP exposes only 4 tools; CLI/Python covers the full 229-method surface the user wanted to test.",
         how="memkraft agents-hint claude-code --base-dir ./memory appended to CLAUDE.md.",
         tags=["integration"], source="seed"))

# --- 5. Auto-extract facts from a project blurb ---
blurb = (
    "DocTick is a 2026 internship project. It uses memkraft v3.0.3 for its memory layer. "
    "memkraft stores everything as Markdown in the memory folder. The project follows the "
    "Ponytail lazy-senior-dev methodology. Claude Code is the agent."
)
step("extract from blurb", lambda: mk.extract(blurb, source="seed", confidence="verified"))

# --- 6. Tiers ---
step("tier core: doctick", lambda: mk.tier_set("doctick", tier="core"))
step("tier core: ponytail", lambda: mk.tier_set("ponytail", tier="core"))
step("tier recall: memkraft", lambda: mk.tier_set("memkraft", tier="recall"))

# --- 7. Wiki-link scan (entities now reference each other) ---
step("link_scan", lambda: mk.link_scan())

# --- 8. Session log ---
step("log_event", lambda: mk.log_event(
    "memkraft memory layer seeded for DocTick (entities, facts, decisions)",
    tags="setup", importance="high", entity="DocTick"))

print("\n--- entities ---")
mk.list_entities()
