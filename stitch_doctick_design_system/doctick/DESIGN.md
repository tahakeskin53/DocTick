---
name: DocTick
colors:
  surface: '#f7f9ff'
  surface-dim: '#cbdcee'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf4ff'
  surface-container: '#e2efff'
  surface-container-high: '#d9eafc'
  surface-container-highest: '#d4e4f6'
  on-surface: '#0d1d2a'
  on-surface-variant: '#424750'
  inverse-surface: '#223240'
  inverse-on-surface: '#e7f2ff'
  outline: '#727781'
  outline-variant: '#c2c6d2'
  surface-tint: '#2a5f9f'
  primary: '#003d73'
  on-primary: '#ffffff'
  primary-container: '#1b5493'
  on-primary-container: '#a7c9ff'
  inverse-primary: '#a6c8ff'
  secondary: '#375f95'
  on-secondary: '#ffffff'
  secondary-container: '#9cc3ff'
  on-secondary-container: '#255084'
  tertiary: '#003d70'
  on-tertiary: '#ffffff'
  tertiary-container: '#005498'
  on-tertiary-container: '#a4c9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#014786'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a6c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#1b477c'
  tertiary-fixed: '#d3e3ff'
  tertiary-fixed-dim: '#a3c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#f7f9ff'
  on-background: '#0d1d2a'
  surface-variant: '#d4e4f6'
  surface-page: '#F7F9FB'
  surface-card: '#FFFFFF'
  surface-sunken: '#EEF2F6'
  brand-soft: '#EEF4FB'
  brand-line: '#AFCCEE'
  border-default: '#CAD4DC'
  border-soft: '#E3E9EE'
  status-confirmed: '#1B8354'
  status-confirmed-bg: '#DCF2E7'
  status-pending: '#A16814'
  status-pending-bg: '#FAEEDA'
  status-cancelled: '#C03B36'
  status-cancelled-bg: '#F9E4E3'
  status-neutral: '#51626F'
  status-neutral-bg: '#E3E9EE'
  text-secondary: '#51626F'
  text-muted: '#70808C'
typography:
  display:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: -0.02em
  h1:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
  h2:
    fontFamily: Sora
    fontSize: 19px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.35'
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.55'
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14.5px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.45'
  label:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.2'
  overline:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  time:
    fontFamily: IBM Plex Mono
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.0'
  time-lg:
    fontFamily: IBM Plex Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  stack-gap: 16px
  card-pad: 20px
  page-pad: 24px
  max-width-patient: 1080px
  max-width-admin: 1200px
  sidebar-width: 220px
---

## Brand & Style

The design system embodies a **Corporate / Modern** aesthetic with a specific focus on **Clinical Minimalism**. The brand personality is calm, professional, and reassuring, designed to instill trust in a medical context. It avoids decorative clutter, opting instead for a "data-first" approach where clarity and precision are paramount.

The visual narrative is driven by generous whitespace, a strict "navy and paper" palette, and a high degree of typographic structure. The interface should feel organized and efficient, utilizing subtle depth to separate layers without breaking the clean, professional atmosphere. All visible text must remain in **Turkish** as specified.

**Design Principles:**
- **Clinical Precision:** Use of monospace fonts for temporal data to emphasize accuracy.
- **Calm Authority:** A dominant deep blue brand color paired with soft, off-white surfaces.
- **Functional Simplicity:** No marketing fluff, hero graphics, or unnecessary illustrations.
- **Trust through Clarity:** Clear status indicators and structured layout models.

## Colors

The color strategy uses a **Primary + Secondary** model. The primary brand color (`#1B5493`) is reserved for interactive elements and highlights, while the secondary brand color (`#164478`) defines the structural surfaces like the top header and side navigation.

**Usage Guidance:**
- **Backgrounds:** Use `surface-page` for the main canvas. Content containers always use `surface-card`.
- **Typography:** `text-primary` (Neutral) is used for maximum readability. `text-secondary` and `text-muted` are used to establish hierarchy in descriptions and captions.
- **Semantic Status:** Use the specific semantic pairs for appointment statuses. Never mix these:
    - **Onaylandı (Green):** Confirmed status.
    - **Beklemede (Amber):** Pending status.
    - **İptal/Reddedildi (Red):** Cancelled or error states.
- **Interactive:** `primary` for main actions; `secondary` for headers and sidebars.

## Typography

This system employs a functional tripartite typography system. **Sora** provides a modern, authoritative feel for all headings. **IBM Plex Sans** is the utilitarian workhorse for all body text, labels, and UI controls. **IBM Plex Mono** is used exclusively for "data" elements—specifically appointment times and alphanumeric appointment codes—to ensure they stand out as precise, fixed values.

**Implementation Notes:**
- **Headings:** Use Sora for all `display` and `h1-h3` levels.
- **Data Points:** Every appointment time (e.g., `09:30`) and code (e.g., `RND-2026`) must use the `time` or `time-lg` role with **IBM Plex Mono**.
- **Tables:** Use `overline` (uppercase) for column headers to create a professional, tabular feel.
- **Mobile:** Scale `display` down to `h1` size for mobile screens.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** approach for internal content sections to maintain a high-end, editorialized clinical feel.

**Layout Models:**
- **Patient Interface:** Uses a top-bar navigation with a centered content column. The maximum content width is `1080px` with `24px` horizontal margins.
- **Admin Interface:** Employs a two-column layout. A fixed `220px` sidebar on the left with the main content area on the right.

**Spacing Rhythm:**
A strict 4px base unit is used. Vertical spacing between logical blocks/cards defaults to `16px`. Internal card padding is consistently `20px` to provide enough "breathability" for medical data. Tables and lists should use a comfortable row height that allows for clear vertical scanning.

## Elevation & Depth

The system uses **Tonal Layers** combined with **Ambient Shadows** to create a focused, low-distraction hierarchy.

- **Base Layer:** The `surface-page` (`#F7F9FB`) serves as the foundation.
- **Surface Layer:** White cards (`#FFFFFF`) sit on top with a very subtle, diffused dual-layer shadow: `0 1px 2px rgba(14,42,74,.05)` and `0 4px 14px rgba(14,42,74,.07)`.
- **Interactive Depth:** Depth is primarily communicated through borders and color shifts rather than shadow height. A `3px` focus ring in `border-focus` with 28% opacity is used for active inputs.
- **Overlays:** Modal dialogs use a backdrop scrim of `rgba(18,34,47,.45)` to pull focus, with the dialog card itself receiving a slightly more pronounced shadow.

## Shapes

The shape language is **Rounded**, avoiding both the clinical coldness of sharp corners and the playfulness of heavy pill-shaping for primary containers.

- **Standard Radius:** 8px (`sm`) for buttons, inputs, and small UI elements.
- **Card Radius:** 10px (`md`) for standard content containers.
- **Large Containers:** 14px (`lg`) for modal dialogs and major sections.
- **Pills:** Used exclusively for status badges and time slots (`999px`).
- **Circles:** Reserved for user/doctor avatarlar and stepper step numbers.

## Components

### Buttons
- **Primary:** Solid `#1B5493` background, white text. No borders.
- **Secondary:** White background, `#CAD4DC` border, `#12222F` text.
- **Danger:** Solid `#C03B36` background, white text.
- **Ghost:** Transparent background, `#1B5493` text.

### Cards
- White background, `md` roundedness, subtle dual-shadow. Include a `border-soft` top or bottom divider for header/footer sections within the card.

### Input Fields
- Vertical alignment: Label (`label` style, `#70808C`) above the input. Input has a white background, `#CAD4DC` border, and `sm` roundedness. Focus state uses `#2568AE` border.

### Status Badges (Rozetler)
- Small pill shapes using semantic background/text pairs (e.g., `status-confirmed-bg` and `status-confirmed`). Always include a 6px circular dot indicator of the same text color inside the badge.

### Time Slots
- Pill-shaped chips using `IBM Plex Mono`.
- **Available:** White background, `#CAD4DC` border.
- **Selected:** Solid `#1B5493` background, white text.
- **Full:** `surface-sunken` background, `text-muted` color with a strikethrough.

### Stepper
- A horizontal sequence of numbered circles. Active step is the brand color; completed steps show a checkmark icon. Steps are connected by a thin `border-soft` line.

### Navigation
- **Patient Top Bar:** Solid `#164478` background. Brand name on the left (Sora 800), navigation links in the center/right using `label` style in white.
- **Admin Sidebar:** Solid `#164478` background. Active items use a subtle semi-transparent white overlay (`rgba(255,255,255,.14)`).