# DocTick Memory Katmanı — memkraft Entegrasyonu (Tasarım)

- **Tarih:** 2026-07-21
- **Durum:** Onaylandı (uygulamada)
- **Sahip:** DocTick projesi
- **İlgili repo:** https://github.com/seojoonkim/memkraft (v1.0.2, MIT, zero-dependency)

## 1. Amaç

DocTick projesi için kalıcı, git-friendly, offline bir **memory (bellek) katmanı** kurmak.
Bu katman `memkraft` ile yönetilecek: agent (Claude Code) projede çalışırken öğrendiği
varlıkları, kararları, debug oturumlarını ve snapshot'ları düz Markdown dosyalarında
tutacak; sonraki oturumlarda `search` / `brief` / `time-travel` ile geri çağırabilecek.

## 2. Kararlar (kullanıcı onayı)

| Konu | Karar | Gerekçe |
| --- | --- | --- |
| Kurulum yeri | **Proje-local `.venv/`** | "Global değil" isteği; global Python'a hiçbir şey bulaşmaz |
| Entegrasyon modeli | **CLI + Python API + `agents-hint`** | Tüm özellikleri test et + kalıcı CLAUDE.md wiring |
| MCP server | **Hayır** (şimdilik) | MCP sadece 4 temel tool sunar; tüm özellik için CLI/Python yeterli |
| Git | **`git init`** | memkraft git-friendly; memory Markdown'ı versiyonlanır |

## 3. Mimari / Bileşenler

### 3.1 Python ortamı
- `.venv/` (Windows: `.venv\Scripts\python.exe`) içine `pip install memkraft`.
- Zero-dependency (stdlib: re, difflib, json, pathlib) → Python 3.14.4'te sorunsuz çalışmalı.

### 3.2 memkraft store
- `memkraft init --template claude-code` → `memory/` dizini + yapı (RESOLVER.md,
  TEMPLATES.md, entities/, live-notes/, decisions/, debug/, sessions/, ...).
- **Güvenlik:** mevcut `CLAUDE.md` (ponytail kuralları) yedeklenir; template'in CLAUDE.md'ye
  dokunup dokunmadığı diff'lenir. Zarar görürse yedek restore edilip `agents-hint` çıktısı
  elle eklenir (template idempotent olduğu için normalde güvenli).

### 3.3 Agent wiring
- `memkraft agents-hint claude-code` çıktısı CLAUDE.md'ye (mevcut içeriği bozmadan) eklenir.
- Böylece Claude Code DocTick'te çalışırken memory'yi kullanması gerektiğini bilir.

### 3.4 Seed (temel bilgi)
- `track`: DocTick (project), ponytail (methodology), memkraft (tool).
- `extract`: CLAUDE.md / PONYTAIL-KILAVUZ.md içeriğinden otomatik fact çıkarımı.
- `decision_record`: "memkraft memory katmanı seçildi", "venv tercih edildi", vb.
- `log_event`: kurulum oturumu kaydı.

### 3.5 Test harness — `scripts/check_memkraft.py`
Framework'süz, assert-tabanlı tek dosya (ponytail kuralı: "non-trivial logic leaves ONE
runnable check behind, no frameworks, no fixtures"). Tüm alt sistemleri gerçek çağrılarla
dener, her biri için PASS/FAIL basar. Kapsam:

- **Core:** track, update, brief, promote, list_entities
- **Extraction:** extract, detect, cognify, extract_facts_registry, detect_conflicts, resolve_conflicts, classify_memory_type
- **Search:** search, agentic_search, lookup, query, links
- **Maintenance:** dream, health_check, decay, dedup, summarize, diff, open_loops, build_index, suggest_links
- **Logging:** log_event, log_read, retro, distill_decisions
- **Debug:** start_debug → hypothesis → evidence → reject/confirm → end_debug, debug_history, search_rejected
- **Snapshots/Time-travel:** snapshot, snapshot_list, snapshot_diff, time_travel, snapshot_entity
- **Bitemporal/Tier/Decay/Links (v0.8):** fact_add/at/history/invalidate, tier_set/list/working_set, decay_apply/tombstone/restore, link_scan/backlinks/forward/graph/orphans
- **Self-improvement (v1.0):** prompt_register/eval/evidence/convergence_check, decision_record, evidence_first
- **Multi-agent (v0.5–0.7):** channel_save/load/update, task_start/update/complete/history/list, agent_save/load/inject, task_delegate, agent_handoff
- **CLI paritesi:** önemli CLI komutlarının Python API ile aynı sonucu verdiğinin doğrulanması
- **memkraft self-check:** `memkraft doctor --fix --yes` + `memkraft health-check` (A/B/C/D)

## 4. Dosya Düzeni

```
DocTick/
├── .venv/                                  # (gitignored)
├── .git/  .gitignore                        # yeni
├── CLAUDE.md                                # mevcut + memkraft wiring
├── PONYTAIL-KILAVUZ.md                      # mevcut
├── .claude/skills/ponytail/*                # mevcut
├── memory/                                  # memkraft store (tracked, seed'li)
│   ├── .memkraft/  RESOLVER.md  TEMPLATES.md
│   └── entities/ live-notes/ decisions/ debug/ sessions/ ...
├── scripts/check_memkraft.py                # test harness
└── docs/superpowers/specs/2026-07-21-memkraft-memory-layer-design.md  # bu doküman
```

## 5. Uygulama Adımları (sıralı)

1. `.venv/` oluştur + `pip install memkraft`; `memkraft --version` doğrula.
2. `CLAUDE.md` yedekle → `memkraft init --template claude-code` → diff kontrolü → gerekirse geri al.
3. `memkraft agents-hint claude-code` çıktısını CLAUDE.md'ye ekle.
4. Seed: track/extract/decision_record/log_event ile temel bilgiyi doldur.
5. `scripts/check_memkraft.py` yaz → çalıştır → tüm PASS olana kadar debug et/düzelt.
6. `memkraft doctor --fix --yes` + `memkraft health-check` ile self-check.
7. Commit'ler: kurulum → wiring+seed → test → final.

## 6. Başarı Kriterleri

- [ ] `memkraft --version` venv içinde çalışıyor.
- [ ] `memory/` doğru yapıda oluştu, CLAUDE.md ponytail kuralları korunuyor.
- [ ] CLAUDE.md'de memkraft wiring'i var.
- [ ] `scripts/check_memkraft.py` tüm özellikler PASS.
- [ ] `memkraft health-check` ≥ B (tercihen A).
- [ ] memory'de DocTick/ponytail/memkraft seed'li.
- [ ] Her şey commit'li.

## 7. Riskler & Mitigasyon

| Risk | Mitigasyon |
| --- | --- |
| Python 3.14 uyumsuzluğu | Zero-dep olduğu için düşük ihtimal; `memkraft doctor` ile doğrula, sorun olursa not düş |
| Template CLAUDE.md'yi bozar | Önce yedek, sonra diff; bozarsa restore + manuel agents-hint |
| Bir özellik 3.14'te hata verir | Test adımında debug et, gerçek root cause'u bul, düzelt; çalışır halde bitir |
| Test script çok uzun olur | Tek dosya, assert-based, kategori bazlı; framework yok |

## 8. Kapsam Dışı

- **MCP server** kurulumu (kullanıcı seçmedi; ileride istenirse `memkraft[mcp]` + `.mcp.json`).
- Claude Code'un kendi harness memory'si (`~/.claude/projects/.../memory/`) — bu ayrı bir
  mekanizma, memkraft proje-local store'u ile paralel yaşar, dokunulmaz.
- DocTick uygulama kodu (henüz yok) — memory katmanı bağımsız çalışır.

## 9. Notlar

- Ponytail (lazy senior dev) kuralları aktif: en az kod, en kısa diff, framework'süz self-check.
- Bu spec aynı zamanda implementation plan olarak hizmet eder; ayrı bir plan dokümanı yazılmaz
  (ponytail: gereksiz boilerplate yok).
