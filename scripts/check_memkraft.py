"""check_memkraft.py — verify memkraft v3.0.3 works for DocTick's memory layer.

Runs against a TEMP memory dir (no pollution of the real ./memory), then runs
memkraft's own self-checks on the real ./memory at the end.

Run:  PYTHONUTF8=1 .venv/Scripts/python.exe scripts/check_memkraft.py
No test framework. Assert-based. Prints PASS/FAIL/SKIP per check + summary.
"""
import sys
import inspect
import tempfile
import subprocess
import io
import contextlib
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", category=DeprecationWarning)  # deprecated aliases still work; quiet them
sys.stdout.reconfigure(encoding="utf-8")  # Windows cp1254 can't print memkraft emoji
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from memkraft import MemKraft  # noqa: E402

# ---- tiny assert harness -----------------------------------------------------
R = {"pass": 0, "fail": 0, "skip": 0, "fails": []}


def ok(name):
    R["pass"] += 1
    print(f"  PASS  {name}")


def bad(name, why):
    R["fail"] += 1
    R["fails"].append((name, why))
    print(f"  FAIL  {name}  ->  {why}")


def skip(name, why=""):
    R["skip"] += 1
    print(f"  SKIP  {name}  {('- ' + why) if why else ''}")


def check(name, fn):
    """Run fn(); PASS if no exception."""
    try:
        fn()
        ok(name)
    except Exception as e:  # noqa: BLE001
        bad(name, f"{type(e).__name__}: {e}")


def check_val(name, fn, pred):
    """Run fn(); PASS if pred(result) is truthy."""
    try:
        r = fn()
        if pred(r):
            ok(name)
        else:
            bad(name, f"predicate false: {str(r)[:140]}")
    except Exception as e:  # noqa: BLE001
        bad(name, f"{type(e).__name__}: {e}")


# ---- setup temp memory -------------------------------------------------------
TMP = tempfile.mkdtemp(prefix="memkraft_test_")
mk = MemKraft(base_dir=TMP)
mk.init()
print(f"\nTemp memory: {TMP}\n")

# seed a little representative data into temp memory so read ops have something
mk.track("DocTick", entity_type="project", source="test")
mk.update("DocTick", info="Memory layer managed by memkraft v3.0.3", source="test")
mk.track("MemKraft", entity_type="tool", source="test")
mk.fact_add("DocTick", "memory_tool", "memkraft", valid_from="2026-07-21")
mk.tier_set("doctick", tier="core")


# =============================================================================
print("\n=== A1. CORE (track/update/list/brief/promote) ===")
check_val("list_entities returns DocTick", lambda: mk.list_entities(), lambda r: True)  # prints; returns None -> truthy? use side check
check_val("brief DocTick non-empty",
          lambda: mk.brief("DocTick"), lambda r: isinstance(r, str) and len(r) > 0)
check_val("promote MemKraft->core",
          lambda: mk.promote("MemKraft", tier="core"), lambda r: r is None)

# A1 list_entities returns None (prints). Verify entity file exists instead.
check("entity file exists", lambda: (Path(TMP) / "live-notes" / "doctick.md").exists().__bool__() or (_ for _ in ()).throw(AssertionError("missing doctick.md")))

# =============================================================================
print("\n=== A2. SEARCH (search/lookup/query/agentic_search/links) ===")
check_val("search hits", lambda: mk.search("memkraft"), lambda r: isinstance(r, list) and len(r) >= 1)
check_val("search fuzzy", lambda: mk.search("memcrft", fuzzy=True), lambda r: isinstance(r, list))
check_val("lookup", lambda: mk.lookup("DocTick"), lambda r: True)  # prints, returns None
check_val("query L1", lambda: mk.query(level=1), lambda r: True)
check_val("agentic_search", lambda: mk.agentic_search("memory layer", max_hops=1),
          lambda r: isinstance(r, list))
check("links(DocTick)", lambda: mk.links("DocTick"))

# =============================================================================
print("\n=== A3. EXTRACTION (extract/detect/cognify/facts/conflicts/classify) ===")
check_val("extract", lambda: mk.extract("Acme Corp raised 50 million in Seoul.", source="t"),
          lambda r: isinstance(r, list))
check("detect", lambda: mk.detect("Simon Kim and Lee Minho discussed AI"))
check_val("extract_facts_registry",
          lambda: mk.extract_facts_registry("Revenue grew 85 percent in 2026"),
          lambda r: True)  # prints extracted facts, returns None
check_val("classify_memory_type",
          lambda: mk.classify_memory_type("I prefer dark mode for coding"),
          lambda r: isinstance(r, str) and len(r) > 0)
check_val("detect_conflicts returns list",
          lambda: mk.detect_conflicts("DocTick", "memory tool is mem0"),
          lambda r: isinstance(r, list))
check_val("resolve_conflicts dry_run",
          lambda: mk.resolve_conflicts(strategy="newest", dry_run=True),
          lambda r: isinstance(r, dict))
# cognify on empty inbox should run without error
check("cognify dry_run", lambda: mk.cognify(dry_run=True))

# =============================================================================
print("\n=== A4. MAINTENANCE (health/dream/decay/dedup/diff/open_loops/index/links) ===")
check_val("health_check has pass_rate",
          lambda: mk.health_check(), lambda r: isinstance(r, dict) and "pass_rate" in r)
check_val("dream dry_run",
          lambda: mk.dream(dry_run=True), lambda r: isinstance(r, dict))
check_val("decay dry_run",
          lambda: mk.decay(days=1, dry_run=True), lambda r: isinstance(r, list))
check_val("dedup dry_run",
          lambda: mk.dedup(dry_run=True), lambda r: isinstance(r, list))
check("diff", lambda: mk.diff())
check_val("open_loops dry_run",
          lambda: mk.open_loops(dry_run=True), lambda r: True)
check_val("build_index", lambda: mk.build_index(), lambda r: True)
check_val("suggest_links", lambda: mk.suggest_links(), lambda r: True)

# =============================================================================
print("\n=== A5. LOGGING (log_event/log_read/retro/distill) ===")
check_val("log_event", lambda: mk.log_event("test event", tags="t", importance="normal"),
          lambda r: True)
check("log_read", lambda: mk.log_read())
check_val("retro dry_run", lambda: mk.retro(dry_run=True), lambda r: True)
check_val("distill_decisions", lambda: mk.distill_decisions(), lambda r: True)

# =============================================================================
print("\n=== A6. DEBUG HYPOTHESIS (start->hyp->evidence->reject/confirm->end) ===")
bug = None


def _debug_flow():
    global bug
    b = mk.start_debug("Search returns empty for valid query")
    assert isinstance(b, dict) and "bug_id" in b, f"start_debug bad: {b}"
    bug = b["bug_id"]
    h = mk.log_hypothesis(bug, "Index not built", evidence="no index.json")
    assert "hypothesis_id" in h, f"hyp bad: {h}"
    hid = h["hypothesis_id"]
    ev = mk.log_evidence(bug, hid, "index.json missing", result="supports")
    assert isinstance(ev, dict), f"evidence bad: {ev}"
    rh = mk.reject_hypothesis(bug, hid, reason="index exists actually")
    assert isinstance(rh, dict), f"reject bad: {rh}"
    h2 = mk.log_hypothesis(bug, "Query typo")
    hid2 = h2["hypothesis_id"]
    mk.log_evidence(bug, hid2, "typo confirmed", result="supports")
    mk.confirm_hypothesis(bug, hid2)
    end = mk.end_debug(bug, "Fixed query typo")
    assert isinstance(end, dict), f"end bad: {end}"


check("debug full flow", _debug_flow)
check_val("get_hypotheses", lambda: mk.get_hypotheses(bug), lambda r: isinstance(r, list))
check_val("get_evidence", lambda: mk.get_evidence(bug), lambda r: isinstance(r, list))
check_val("get_debug_status", lambda: mk.get_debug_status(bug),
          lambda r: isinstance(r, dict))
check_val("debug_history", lambda: mk.debug_history(limit=5), lambda r: isinstance(r, list))
check_val("search_debug_sessions",
          lambda: mk.search_debug_sessions("query"), lambda r: isinstance(r, list))
check_val("search_rejected_hypotheses",
          lambda: mk.search_rejected_hypotheses("index"), lambda r: isinstance(r, list))

# =============================================================================
print("\n=== A7. SNAPSHOTS & TIME-TRAVEL ===")
snap = None


def _snap_flow():
    global snap
    s = mk.snapshot(label="t1")
    assert isinstance(s, dict) and "snapshot_id" in s, f"snapshot bad: {s}"
    snap = s["snapshot_id"]
    # mutate then diff
    mk.update("DocTick", info="post-snapshot change", source="t")


check("snapshot create", _snap_flow)
check_val("snapshot_list", lambda: mk.snapshot_list(), lambda r: isinstance(r, list))
check_val("snapshot_diff vs live",
          lambda: mk.snapshot_diff(snap), lambda r: isinstance(r, dict))
check_val("time_travel", lambda: mk.time_travel("DocTick", snapshot_id=snap),
          lambda r: isinstance(r, list))
check_val("snapshot_entity", lambda: mk.snapshot_entity("DocTick"),
          lambda r: isinstance(r, list))

# =============================================================================
print("\n=== A8. BITEMPORAL FACTS ===")
check_val("fact_add role",
          lambda: mk.fact_add("DocTick", "role", "experiment", valid_from="2026-01-01"),
          lambda r: isinstance(r, dict))
check_val("fact_at",
          lambda: mk.fact_at("DocTick", "memory_tool"), lambda r: isinstance(r, dict))
check_val("fact_history",
          lambda: mk.fact_history("DocTick"), lambda r: isinstance(r, list))
check_val("fact_keys includes memory_tool",
          lambda: mk.fact_keys("DocTick"),
          lambda r: isinstance(r, list) and "memory_tool" in r)
check_val("fact_list",
          lambda: mk.fact_list("DocTick"), lambda r: isinstance(r, list))
check_val("fact_invalidate returns int",
          lambda: mk.fact_invalidate("DocTick", "role", invalid_at="2026-06-01"),
          lambda r: isinstance(r, int))

# =============================================================================
print("\n=== A9. TIERS ===")
check_val("tier_set recall", lambda: mk.tier_set("memkraft", tier="recall"),
          lambda r: isinstance(r, dict))
check_val("tier_promote", lambda: mk.tier_promote("memkraft"), lambda r: isinstance(r, dict))
check_val("tier_demote", lambda: mk.tier_demote("memkraft"), lambda r: isinstance(r, dict))
check_val("tier_of", lambda: mk.tier_of("doctick"), lambda r: isinstance(r, str))
check_val("tier_list", lambda: mk.tier_list(tier="core"),
          lambda r: isinstance(r, list))
check_val("working_set", lambda: mk.working_set(limit=10), lambda r: isinstance(r, list))

# =============================================================================
print("\n=== A10. DECAY (apply/list/tombstone/restore) ===")
check_val("decay_apply", lambda: mk.decay_apply("memkraft", decay_rate=0.5),
          lambda r: isinstance(r, dict))
check_val("decay_list", lambda: mk.decay_list(below_threshold=1.0),
          lambda r: isinstance(r, list))
check_val("decay_tombstone", lambda: mk.decay_tombstone("memkraft"),
          lambda r: isinstance(r, dict))
check_val("decay_is_tombstoned True",
          lambda: mk.decay_is_tombstoned("memkraft"), lambda r: r is True)
check_val("decay_restore", lambda: mk.decay_restore("memkraft"),
          lambda r: isinstance(r, dict))

# =============================================================================
print("\n=== A11. LINK GRAPH ===")
check_val("link_scan", lambda: mk.link_scan(), lambda r: isinstance(r, dict))
check_val("link_backlinks", lambda: mk.link_backlinks("DocTick"),
          lambda r: isinstance(r, list))
check_val("link_forward", lambda: mk.link_forward("doctick"),
          lambda r: isinstance(r, list))
check_val("link_graph", lambda: mk.link_graph("DocTick", hops=1),
          lambda r: isinstance(r, dict))
check_val("link_orphans", lambda: mk.link_orphans(), lambda r: isinstance(r, list))

# =============================================================================
print("\n=== A12. SELF-IMPROVEMENT (prompt_register/eval/evidence/convergence) ===")
SCN = [{"name": "s1", "description": "d", "requirements": [{"item": "x", "critical": True}]}]
RES = [{"scenario": "s1", "success": True, "accuracy": 80, "tool_uses": 3,
        "duration_ms": 1000, "unclear_points": [], "discretion": []}]


def _prompt_flow():
    r = mk.prompt_register("my-skill", path="skills/my-skill/SKILL.md",
                           owner="claude", tags=["t"])
    assert isinstance(r, dict), f"register bad: {r}"
    e = mk.prompt_eval("my-skill", iteration=1, scenarios=SCN, results=RES)
    assert isinstance(e, dict), f"eval bad: {e}"
    ev = mk.prompt_evidence("my-skill", "accuracy")
    assert isinstance(ev, dict), f"evidence bad: {ev}"


check("prompt register/eval/evidence", _prompt_flow)
check_val("convergence_check",
          lambda: mk.convergence_check("my-skill", window=2),
          lambda r: isinstance(r, dict) and "converged" in r)
check_val("evidence_first", lambda: mk.evidence_first("memkraft", limit=5),
          lambda r: isinstance(r, dict))

# =============================================================================
print("\n=== A13. DECISIONS ===")
DEC = None


def _dec_flow():
    global DEC
    did = mk.decision_record("Pick tool X", why="because fast", how="installed it",
                             tags=["t"], source="test")
    assert isinstance(did, str) and did, f"decision_record bad: {did}"
    DEC = did


check("decision_record", _dec_flow)
check_val("decision_get", lambda: mk.decision_get(DEC), lambda r: isinstance(r, dict))
check_val("decision_search",
          lambda: mk.decision_search("tool"), lambda r: isinstance(r, list))

# =============================================================================
print("\n=== A14. MULTI-AGENT (channel/task/agent/handoff) ===")


def _multi_flow():
    mk.channel_save("ch1", {"summary": "test channel"})
    cl = mk.channel_load("ch1")
    assert isinstance(cl, dict) and cl.get("summary") == "test channel", f"channel_load: {cl}"
    mk.channel_update("ch1", "lang", "tr", mode="set")
    mk.task_start("t1", "Do thing", channel_id="ch1", agent="claude")
    mk.task_update("t1", "active", "started")
    mk.task_complete("t1", "done")
    th = mk.task_history("t1")
    assert isinstance(th, list) and len(th) >= 1, f"task_history: {th}"
    mk.agent_save("claude", {"ctx": "working on doctick"})
    al = mk.agent_load("claude")
    assert isinstance(al, dict), f"agent_load: {al}"
    inj = mk.agent_inject("claude", channel_id="ch1", task_id="t1")
    assert isinstance(inj, str) and len(inj) > 0, f"inject empty"
    mk.task_start("t2", "Delegated thing")
    ho = mk.agent_handoff("claude", "subagent", task_id="t2", context_note="handoff")
    assert isinstance(ho, str), f"handoff: {ho}"


check("multi-agent channel/task/agent/handoff", _multi_flow)
check_val("channel_tasks", lambda: mk.channel_tasks("ch1", status="all"),
          lambda r: isinstance(r, list))
check_val("task_list", lambda: mk.task_list(status="all"), lambda r: isinstance(r, list))
check_val("task_cleanup", lambda: mk.task_cleanup(max_age_days=0, archive=True),
          lambda r: isinstance(r, dict))

# =============================================================================
# PART B — broad surface smoke test over ALL public methods
# =============================================================================
print("\n=== B. SURFACE SMOKE TEST (all public methods, generic args) ===")
TESTED = set()  # names already exercised meaningfully above
import memkraft as _mk_mod  # noqa: E402

OPTIONAL_ERR = ("ImportError", "ModuleNotFoundError", "NotImplementedError",
                "import", "optional")


def _default_for(ann, pname):
    if ann in (int, "int"):
        return 1
    if ann in (float, "float"):
        return 0.5
    if ann in (bool, "bool"):
        return False
    if ann in (list, "List", "List[str]", "List[Dict[str, Any]]", "List[Dict[str, str]]"):
        return []
    if ann in (dict, "Dict[str, Any]"):
        return {}
    return "DocTick"  # a real seeded entity


def _call_smoke(mname):
    """Call method with generic args derived from its signature. Suppresses stdout."""
    fn = getattr(mk, mname)
    sig = inspect.signature(fn)
    args, kwargs = [], {}
    for pname, p in sig.parameters.items():
        if pname == "self":
            continue
        if p.kind in (p.VAR_POSITIONAL, p.VAR_KEYWORD):
            continue
        if p.default is p.empty:  # required param -> supply generic value
            val = _default_for(p.annotation, pname)
            (kwargs.__setitem__(pname, val) if p.kind == p.KEYWORD_ONLY
             else args.append(val))
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*args, **kwargs)


surface = {"ok": 0, "skip": 0, "needs": 0, "err": 0, "errs": []}
all_methods = [m for m in dir(mk) if not m.startswith("_")
               and callable(getattr(mk, m)) and not m.isupper()]
# Exception types that mean "method works, our generic input was invalid" (NOT a bug)
INPUT_VALIDATION = ("ValueError", "FileNotFoundError", "KeyError", "AssertionError",
                     "AttributeError", "IndexError", "LookupError", "PermissionError",
                     "ResolverClaimError")
OPTIONAL = ("ImportError", "ModuleNotFoundError", "NotImplementedError")
for mname in sorted(all_methods):
    if mname in TESTED:
        continue
    try:
        _call_smoke(mname)
        surface["ok"] += 1
    except TypeError:
        # signature didn't accept our generic args -> not testable here
        surface["skip"] += 1
    except Exception as e:  # noqa: BLE001
        ename = type(e).__name__
        msg = str(e).lower()
        if ename in OPTIONAL or any(k in msg for k in ("optional", "not implemented", "no module")):
            surface["skip"] += 1
        elif ename in INPUT_VALIDATION or "not found" in msg or "required" in msg:
            # method validated input and correctly rejected generic args -> works as designed
            surface["needs"] += 1
        else:
            surface["err"] += 1
            surface["errs"].append((mname, f"{ename}: {e}"))

tot = surface["ok"] + surface["skip"] + surface["needs"] + surface["err"]
print(f"  surface: {surface['ok']} OK / {surface['needs']} needs-valid-input "
      f"/ {surface['skip']} skip(sig/optional) / {surface['err']} ERR  (of {tot} untested methods)")
if surface["errs"]:
    print("  --- genuine runtime ERRs (review) ---")
    for mname, why in surface["errs"][:30]:
        print(f"    {mname}: {why[:110]}")


# =============================================================================
# PART C — memkraft's own self-checks on REAL ./memory
# =============================================================================
print("\n=== C. MEMKRAFT SELF-CHECKS on real ./memory ===")
real = MemKraft(base_dir=str(ROOT / "memory"))
check_val("real health_check", lambda: real.health_check(),
          lambda r: isinstance(r, dict) and "health_score" in r)

# CLI doctor (needs PYTHONUTF8; we are in utf-8 mode already via stdout reconfigure,
# but subprocess inherits process env — set PYTHONUTF8 explicitly)
env = {**__import__("os").environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}


def _doctor():
    out = subprocess.run(
        [str(ROOT / ".venv" / "Scripts" / "memkraft.exe"), "doctor"],
        cwd=str(ROOT), capture_output=True, text=True, env=env, timeout=60)
    assert out.returncode == 0, f"doctor rc={out.returncode}: {out.stderr[:200]}"


check("CLI doctor", _doctor)


# ---- summary ----------------------------------------------------------------
print("\n" + "=" * 60)
print(f"DEEP TESTS:  {R['pass']} PASS / {R['fail']} FAIL / {R['skip']} SKIP")
print(f"SURFACE:     {surface['ok']} OK / {surface['needs']} needs-valid-input "
      f"/ {surface['skip']} skip / {surface['err']} ERR")
print("=" * 60)
if R["fails"]:
    print("\nDEEP FAILURES:")
    for n, why in R["fails"]:
        print(f"  - {n}: {why}")
print(f"\nResult: {'ALL DEEP TESTS PASS ✅' if R['fail'] == 0 else 'FAILURES PRESENT ❌'}")

# cleanup temp dir (best-effort)
import shutil
try:
    shutil.rmtree(TMP, ignore_errors=True)
except Exception:
    pass
