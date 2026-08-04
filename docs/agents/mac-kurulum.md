# Yeni Mac'e Claude Code Kurulumu (iOS/DocTick App)

Bu dosya, Windows'taki DocTick kurulumunun **birebir envanteri** ve yeni Mac'te
(iPhone uygulaması projesi için) aynı ortamı kurma adımlarıdır.

Kaynak makine: Windows 11, `C:\Users\tahak\...\DocTick`. Tarih: 2026-08-04.

---

## 0. Envanter — bu makinede ne kurulu?

| Katman | Ne | Nerede | Nasıl kurulmuş |
|---|---|---|---|
| Global ayar | model=opus, effortLevel=high, theme, plugin aktivasyonu | `~/.claude/settings.json` | elle |
| Plugin | **superpowers v5.0.7** (14 skill + SessionStart hook) | `~/.claude/plugins/.../superpowers` | Desktop app'ten local upload |
| Marketplace | `claude-plugins-official` (kayıtlı, içinden plugin kurulmamış) | `~/.claude/plugins/marketplaces` | `/plugin marketplace add` |
| Proje skill (41) | **mattpocock/skills** | `.claude/skills/` + `.agents/skills/` + `skills/` | `npx skills --copy` → `skills-lock.json` |
| Proje skill (6) | **ponytail** (+review/audit/debt/gain/help) | `.claude/skills/ponytail*` | markdown kopyalama (instruction-only) |
| Proje skill (1) | **impeccable v3.9.1** (+ PostToolUse hook) | `.claude/skills/impeccable/` | `npx impeccable install` |
| Kural seti | Ponytail merdiveni + memkraft kuralları | `CLAUDE.md` | elle |
| Memory | **memkraft v3.0.3** | `.venv/` + `./memory/` | pip (proje venv'i) |
| Kişisel komut | `/chatimi-sync-et` | `~/.claude/commands/chatimi-sync-et.md` | elle + `~/.claude/sync/CLAUDE-SYNC` git reposu |
| Hook | impeccable UI dedektörü (Edit/Write/MultiEdit) | `.claude/settings.local.json` | `npx impeccable install` kurar |
| MCP | **yerelde hiç yok** | — | claude-in-chrome = Chrome eklentisi; Pleator/YargiMCP/Gmail/Tripadvisor = claude.ai connector'ları, login ile gelir |

> Not: `skills/`, `.agents/skills/` ve `.claude/skills/` içinde mattpocock skill'lerinin **üç kopyası** var
> (installer'ın `--copy` modunun yan etkisi). Yeni projede tek kopya yeter — Claude Code sadece
> `.claude/skills/` altını okur.

---

## 1. Ön koşullar (Mac)

```bash
# Homebrew yoksa: https://brew.sh
brew install node git python@3.12
npm install -g @anthropic-ai/claude-code
claude   # ilk açılışta login → claude.ai connector'ların (Pleator, YargiMCP, Gmail, Tripadvisor) otomatik gelir
```

iOS tarafı için ayrıca: Xcode (App Store) + `xcode-select --install`.

---

## 2. Global ayarlar — `~/.claude/settings.json`

```json
{
  "model": "opus",
  "effortLevel": "high",
  "theme": "light",
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true
  }
}
```

> Windows'ta `"skipDangerousModePermissionPrompt": true` de var — `--dangerously-skip-permissions`
> uyarısını bastırıyor. İstersen ekle, güvenlik açısından **isteğe bağlı**.
> `enabledPlugins` anahtarını 3. adımdaki kurulum zaten kendi yazar; elle yazman şart değil.

---

## 3. superpowers plugin

Claude Code içinde:

```
/plugin install superpowers@claude-plugins-official
```

Resmi marketplace'te bulamazsan:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Getirdiği skill'ler: `brainstorming`, `writing-plans`, `executing-plans`,
`test-driven-development`, `systematic-debugging`, `verification-before-completion`,
`using-git-worktrees`, `requesting-code-review`, `receiving-code-review`,
`subagent-driven-development`, `dispatching-parallel-agents`,
`finishing-a-development-branch`, `writing-skills`, `using-superpowers`.
Ayrıca her oturum başında çalışan bir SessionStart hook'u kurar (bu oturumda gördüğün
"You have superpowers" bloğu).

---

## 4. mattpocock/skills (41 skill)

Yeni iOS proje klasörünün içinde:

```bash
npx skills@latest        # interaktif seçici; hedef agent'ı 'claude-code' ile sınırla
```

Güncelleme (CLAUDE.md'de de yazılı):

```bash
npx skills@latest update -p -y
```

**Alternatif / garantili yol:** bu repodaki hazır kopyayı taşı —
`DocTick/.claude/skills/` içindeki mattpocock klasörleri + `skills-lock.json` düz markdown,
git'e commitli. Yeni repoya kopyalayıp `npx skills@latest update -p -y` demek yeter.

**iOS projesinde işe yaramayacaklar** (TypeScript'e özel, kurmasan da olur):
`migrate-to-shoehorn`, `setup-ts-deep-modules`, `scaffold-exercises`, `setup-pre-commit`.
Asıl işine yarayacaklar: `diagnosing-bugs`, `code-review`, `codebase-design`, `tdd`,
`domain-modeling`, `grilling`, `prototype`, `research`, `qa`, `triage`, `to-spec`, `to-tickets`.

---

## 5. ponytail (kural seti — en önemlisi)

Plugin değil, düz markdown. İki parça:

1. **`CLAUDE.md`** — "Ponytail, lazy senior dev mode" bloğu. Bu repodaki `CLAUDE.md`'nin
   ilk yarısını (`# Ponytail, lazy senior dev mode` … `intensite seviyeleri` satırına kadar)
   yeni projenin `CLAUDE.md`'sine kopyala. Her oturumda otomatik okunur.
2. **`.claude/skills/ponytail*/SKILL.md`** — 6 klasör: `ponytail`, `ponytail-review`,
   `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`. Tek dosyalık skill'ler,
   bu repodan kopyala.

Kaynak repo: https://github.com/DietrichGebert/ponytail (MIT).
Detaylı Türkçe kılavuz: bu repodaki `PONYTAIL-KILAVUZ.md`.

---

## 6. impeccable (UI/UX skill + hook)

Yeni proje klasöründe:

```bash
npx --yes impeccable@latest install --providers=claude --scope=project
```

Bu komut `.claude/skills/impeccable/` (skill + detector script'leri) ve
`.claude/settings.local.json` içindeki PostToolUse hook'unu kurar.
Güncelleme: aynı komut `install` yerine `update` ile.

**iOS için önemli:** impeccable'ın `reference/ios.md` ve `adapt.native.md` referansları var —
SwiftUI/native arayüz eleştirisinde de çalışır, sadece web'e özel değil.
İlk kurulumdan sonra `/impeccable init` çalıştır (PRODUCT.md + DESIGN.md üretir).

Kaynak: pbakaus/impeccable (Apache 2.0). Türkçe kılavuz: `IMPECCABLE-KILAVUZ.md`.

---

## 7. memkraft (memory katmanı)

```bash
cd <yeni-proje>
python3 -m venv .venv
.venv/bin/pip install memkraft==3.0.3
.venv/bin/memkraft agents-hint claude-code --base-dir ./memory
```

> macOS'ta `PYTHONUTF8=1` **gerekmez** — o, Windows'un cp1254 konsolundaki emoji
> `UnicodeEncodeError`'ı içindi. CLI yolu da `.venv/Scripts/` değil `.venv/bin/`.

Sonra `CLAUDE.md`'ye bu repodaki "🧠 MemKraft — Memory API first" bölümünü kopyala
(yolları `.venv/bin/` olacak şekilde düzelt).

---

## 8. `/chatimi-sync-et` komutu (isteğe bağlı)

Sohbet geçmişini private CLAUDE-SYNC reposuyla senkronlayan kişisel komut:

```bash
mkdir -p ~/.claude/commands ~/.claude/sync
# Windows'tan kopyala:
#   ~/.claude/commands/chatimi-sync-et.md
#   ~/.claude/sync/redact-secrets.ps1   (mac'te .sh'e çevirmen gerekir)
git clone <CLAUDE-SYNC-repo-url> ~/.claude/sync/CLAUDE-SYNC
```

`redact-secrets.ps1` PowerShell — Mac'te ya `pwsh` kur (`brew install --cask powershell`)
ya da bash'e çevir. Sohbet geçmişi Mac'te ayrı bir proje olacağı için bu adımı
en sona bırakabilirsin.

---

## 9. iOS'a özel ek öneriler (bu makinede yok, orada işine yarar)

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install swift-lsp@claude-plugins-official
```

`swift-lsp` Swift dilinde tanıma-git / referans bulma / diagnostics verir — iOS projesinde
tek başına en yüksek getirili eklenti. `claude-plugins-official` marketplace'i bu makinede
zaten kayıtlı ama içinden hiçbir plugin kurulmamış durumda.

---

## 10. Tek seferde kurulum bloğu

Node + Claude Code + login yapıldıktan sonra, yeni proje klasöründe:

```bash
set -e
cd <yeni-ios-proje-klasoru>

# 4. mattpocock skills
npx --yes skills@latest update -p -y   # skills-lock.json'ı önce kopyaladıysan
# 6. impeccable
npx --yes impeccable@latest install --providers=claude --scope=project
# 7. memkraft
python3 -m venv .venv && .venv/bin/pip install memkraft==3.0.3

mkdir -p .claude/skills
# ponytail + (istersen) mattpocock skill klasörlerini DocTick reposundan kopyala:
# cp -R /path/to/DocTick/.claude/skills/ponytail* .claude/skills/
```

Claude Code içinde (slash komutları, terminalden çalışmaz):

```
/plugin install superpowers@claude-plugins-official
/plugin install swift-lsp@claude-plugins-official
/impeccable init
```

---

## Kontrol listesi

- [ ] `claude` açılıyor, login olmuş
- [ ] `/plugin` → superpowers "enabled" görünüyor
- [ ] Oturum başında "You have superpowers" bloğu geliyor
- [ ] `/ponytail-help` çalışıyor
- [ ] `/impeccable` skill listesinde
- [ ] `.venv/bin/memkraft --help` çalışıyor
- [ ] `CLAUDE.md` içinde ponytail merdiveni + memkraft kuralı var
