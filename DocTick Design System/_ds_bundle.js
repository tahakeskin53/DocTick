/* @ds-bundle: {"format":4,"namespace":"DocTickDesignSystem_a9eaee","components":[{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"Rating","sourcePath":"components/display/Rating.jsx"},{"name":"TimeSlot","sourcePath":"components/display/TimeSlot.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Tabs","sourcePath":"components/feedback/Tabs.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/display/Badge.jsx":"e47b73cec262","components/display/Card.jsx":"6e3526698f78","components/display/Icon.jsx":"ce93975718e6","components/display/Rating.jsx":"8e2126d8449d","components/display/TimeSlot.jsx":"600482c814cc","components/feedback/Dialog.jsx":"c263423bb319","components/feedback/Tabs.jsx":"0e36b24c0ead","components/feedback/Toast.jsx":"9e4a5b04087a","components/forms/Button.jsx":"9b9b4aa0e910","components/forms/Checkbox.jsx":"a5af5e26c0af","components/forms/IconButton.jsx":"ebbe4d303cf6","components/forms/Input.jsx":"3f1c12521986","components/forms/Radio.jsx":"a006291686c5","components/forms/Select.jsx":"47c43a6c4b08","components/forms/Switch.jsx":"4fefb0b35d7d","ui_kits/admin/AdminBolumler.jsx":"5aa267de9959","ui_kits/admin/AdminDoktorlar.jsx":"057cce81d302","ui_kits/admin/AdminEposta.jsx":"ceb92f6c5b25","ui_kits/admin/AdminPanel.jsx":"7bd9e26fa29b","ui_kits/admin/AdminSaatler.jsx":"725809d76a95","ui_kits/admin/AdminSidebar.jsx":"153c4a05d96d","ui_kits/admin/admin-app.jsx":"c47c3bd579c2","ui_kits/hasta/HastaBooking.jsx":"9a73431a2401","ui_kits/hasta/HastaHome.jsx":"d908c287abdb","ui_kits/hasta/HastaRandevular.jsx":"1ae77680cf45","ui_kits/hasta/HastaTopBar.jsx":"90c8f16e4223","ui_kits/hasta/data.js":"84ffbafc144f","ui_kits/hasta/hasta-app.jsx":"ee01a16e157d"},"inlinedExternals":[],"unexposedExports":[{"name":"dtInject","sourcePath":"components/forms/Button.jsx"}]} */

(() => {

const __ds_ns = (window.DocTickDesignSystem_a9eaee = window.DocTickDesignSystem_a9eaee || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Glyph path data copied from Lucide (ISC) — stroke 2, 24x24.
const P = {
  calendar: [['rect', {
    x: 3,
    y: 4,
    width: 18,
    height: 18,
    rx: 2
  }], ['path', {
    d: 'M16 2v4M8 2v4M3 10h18'
  }]],
  clock: [['circle', {
    cx: 12,
    cy: 12,
    r: 10
  }], ['path', {
    d: 'M12 6v6l4 2'
  }]],
  'chevron-right': [['path', {
    d: 'm9 18 6-6-6-6'
  }]],
  'chevron-left': [['path', {
    d: 'm15 18-6-6 6-6'
  }]],
  mail: [['rect', {
    x: 2,
    y: 4,
    width: 20,
    height: 16,
    rx: 2
  }], ['path', {
    d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'
  }]],
  user: [['path', {
    d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'
  }], ['circle', {
    cx: 12,
    cy: 7,
    r: 4
  }]],
  plus: [['path', {
    d: 'M5 12h14M12 5v14'
  }]],
  trash: [['path', {
    d: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6'
  }]],
  pencil: [['path', {
    d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'
  }]],
  check: [['path', {
    d: 'M20 6 9 17l-5-5'
  }]],
  x: [['path', {
    d: 'M18 6 6 18M6 6l12 12'
  }]],
  bell: [['path', {
    d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'
  }], ['path', {
    d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0'
  }]],
  star: [['path', {
    d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'
  }]],
  grid: [['rect', {
    x: 3,
    y: 3,
    width: 7,
    height: 7,
    rx: 1
  }], ['rect', {
    x: 14,
    y: 3,
    width: 7,
    height: 7,
    rx: 1
  }], ['rect', {
    x: 3,
    y: 14,
    width: 7,
    height: 7,
    rx: 1
  }], ['rect', {
    x: 14,
    y: 14,
    width: 7,
    height: 7,
    rx: 1
  }]],
  logout: [['path', {
    d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'
  }], ['path', {
    d: 'm16 17 5-5-5-5M21 12H9'
  }]]
};
function Icon({
  name,
  size = 18,
  style,
  ...rest
}) {
  const parts = P[name] || [];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style
  }, rest), parts.map(([t, a], i) => React.createElement(t, {
    key: i,
    ...a
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Icon.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;border-radius:var(--radius-md);font-family:var(--font-body);font-weight:600;cursor:pointer;border:1px solid transparent;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out);text-decoration:none}
.dt-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-btn[disabled]{opacity:.5;cursor:not-allowed}
.dt-btn-sm{padding:7px 14px;font-size:13px}.dt-btn-md{padding:9px 18px;font-size:14.5px}.dt-btn-lg{padding:12px 22px;font-size:15.5px}
.dt-btn-primary{background:var(--brand);color:var(--text-on-brand)}
.dt-btn-primary:hover:not([disabled]){background:var(--brand-strong)}
.dt-btn-primary:active:not([disabled]){background:var(--blue-800)}
.dt-btn-secondary{background:var(--surface-card);color:var(--text-body);border-color:var(--border-default)}
.dt-btn-secondary:hover:not([disabled]){background:var(--surface-sunken)}
.dt-btn-secondary:active:not([disabled]){background:var(--ink-100)}
.dt-btn-ghost{background:transparent;color:var(--brand)}
.dt-btn-ghost:hover:not([disabled]){background:var(--brand-soft)}
.dt-btn-danger{background:var(--red-600);color:#fff}
.dt-btn-danger:hover:not([disabled]){background:#A72F2B}
`;
function dtInject(id, text) {
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = text;
    document.head.appendChild(s);
  }
}
function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  ...rest
}) {
  dtInject('dt-button-css', css);
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `dt-btn dt-btn-${size} dt-btn-${variant}`,
    disabled: disabled
  }, rest), children);
}
Object.assign(__ds_scope, { dtInject, Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--radius-pill);font:var(--text-overline);letter-spacing:var(--overline-tracking);text-transform:uppercase;white-space:nowrap}
.dt-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
`;
const kinds = {
  confirmed: {
    bg: 'var(--status-confirmed-bg)',
    fg: 'var(--status-confirmed)'
  },
  pending: {
    bg: 'var(--status-pending-bg)',
    fg: 'var(--status-pending)'
  },
  cancelled: {
    bg: 'var(--status-cancelled-bg)',
    fg: 'var(--status-cancelled)'
  },
  done: {
    bg: 'var(--status-done-bg)',
    fg: 'var(--status-done)'
  },
  brand: {
    bg: 'var(--brand-soft)',
    fg: 'var(--brand-strong)'
  },
  neutral: {
    bg: 'var(--ink-100)',
    fg: 'var(--ink-500)'
  }
};
function Badge({
  status = 'neutral',
  dot = true,
  children,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-badge-css', css);
  const k = kinds[status] || kinds.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "dt-badge",
    style: {
      background: k.bg,
      color: k.fg,
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "dt-badge-dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-card{background:var(--surface-card);border:1px solid var(--border-soft);border-radius:var(--radius-lg);box-shadow:var(--shadow-card)}
.dt-card-pad{padding:var(--card-pad)}
.dt-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px var(--card-pad);border-bottom:1px solid var(--border-soft)}
.dt-card-title{font:var(--text-h3);color:var(--text-body)}
.dt-card-foot{padding:12px var(--card-pad);border-top:1px solid var(--border-soft);display:flex;justify-content:flex-end;gap:8px}
`;
function Card({
  title,
  actions,
  footer,
  padded = true,
  children,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-card-css', css);
  return /*#__PURE__*/React.createElement("section", _extends({
    className: "dt-card",
    style: style
  }, rest), title && /*#__PURE__*/React.createElement("header", {
    className: "dt-card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dt-card-title"
  }, title), actions), /*#__PURE__*/React.createElement("div", {
    className: padded ? 'dt-card-pad' : ''
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    className: "dt-card-foot"
  }, footer));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Rating.jsx
try { (() => {
const css = `
.dt-rating{display:inline-flex;gap:4px}
.dt-rating button{background:none;border:none;padding:2px;cursor:pointer;color:var(--ink-200);transition:color var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out)}
.dt-rating button.on{color:var(--amber-600)}
.dt-rating:not(.ro) button:hover{transform:scale(1.12)}
.dt-rating.ro button{cursor:default}
.dt-rating button:focus-visible{outline:none;border-radius:6px;box-shadow:var(--focus-ring)}
`;
const Star = ({
  size
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  stroke: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
}));
function Rating({
  value = 0,
  onChange,
  readOnly,
  size = 22,
  style
}) {
  __ds_scope.dtInject('dt-rating-css', css);
  return /*#__PURE__*/React.createElement("div", {
    className: `dt-rating ${readOnly ? 'ro' : ''}`,
    style: style,
    role: "radiogroup",
    "aria-label": "De\u011Ferlendirme"
  }, [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: n <= value ? 'on' : '',
    disabled: readOnly,
    "aria-label": `${n} yıldız`,
    onClick: () => onChange && onChange(n)
  }, /*#__PURE__*/React.createElement(Star, {
    size: size
  }))));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Rating.jsx", error: String((e && e.message) || e) }); }

// components/display/TimeSlot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-slot{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;min-width:74px;padding:8px 14px;border-radius:var(--radius-pill);border:1px solid var(--border-default);background:var(--surface-card);font:var(--text-time);color:var(--text-body);cursor:pointer;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),color var(--dur-fast) var(--ease-out)}
.dt-slot:hover{border-color:var(--blue-500);background:var(--brand-soft)}
.dt-slot:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-slot.sel{background:var(--brand);border-color:var(--brand);color:#fff}
.dt-slot.full{background:var(--surface-sunken);color:var(--ink-300);border-color:var(--border-soft);cursor:not-allowed;text-decoration:line-through}
`;
function TimeSlot({
  time,
  state = 'available',
  onClick,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-slot-css', css);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: `dt-slot ${state === 'selected' ? 'sel' : state === 'full' ? 'full' : ''}`,
    disabled: state === 'full',
    onClick: onClick,
    style: style
  }, rest), time);
}
Object.assign(__ds_scope, { TimeSlot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/TimeSlot.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
const css = `
.dt-scrim{position:fixed;inset:0;background:rgba(18,34,47,.45);display:flex;align-items:center;justify-content:center;z-index:50;padding:24px}
.dt-dialog{background:var(--surface-card);border-radius:var(--radius-lg);box-shadow:var(--shadow-pop);width:100%;max-width:440px;animation:dtDlgIn var(--dur-med) var(--ease-out)}
@keyframes dtDlgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.dt-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 0}
.dt-dialog-title{font:var(--text-h2);color:var(--text-body)}
.dt-dialog-body{padding:12px 20px 20px;font:var(--text-body-md);color:var(--text-secondary)}
.dt-dialog-foot{display:flex;justify-content:flex-end;gap:8px;padding:0 20px 20px}
.dt-dialog-x{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:20px;line-height:1;padding:4px;border-radius:6px}
.dt-dialog-x:hover{color:var(--text-body);background:var(--surface-sunken)}
`;
function Dialog({
  open,
  title,
  onClose,
  footer,
  children
}) {
  __ds_scope.dtInject('dt-dialog-css', css);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "dt-scrim",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt-dialog",
    role: "dialog",
    "aria-modal": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dt-dialog-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dt-dialog-title"
  }, title), /*#__PURE__*/React.createElement("button", {
    className: "dt-dialog-x",
    "aria-label": "Kapat",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "dt-dialog-body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "dt-dialog-foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tabs.jsx
try { (() => {
const css = `
.dt-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border-soft)}
.dt-tab{background:none;border:none;padding:10px 14px;font:var(--text-label);color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color var(--dur-fast) var(--ease-out)}
.dt-tab:hover{color:var(--text-body)}
.dt-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:6px}
.dt-tab.on{color:var(--brand);border-bottom-color:var(--brand)}
`;
function Tabs({
  tabs = [],
  active,
  onChange,
  style
}) {
  __ds_scope.dtInject('dt-tabs-css', css);
  return /*#__PURE__*/React.createElement("div", {
    className: "dt-tabs",
    role: "tablist",
    style: style
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    role: "tab",
    "aria-selected": t.id === active,
    className: `dt-tab ${t.id === active ? 'on' : ''}`,
    onClick: () => onChange && onChange(t.id)
  }, t.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const css = `
.dt-toast{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:var(--radius-md);background:var(--ink-900);color:#fff;font:var(--text-body-sm);box-shadow:var(--shadow-pop);max-width:380px;animation:dtToastIn var(--dur-med) var(--ease-out)}
@keyframes dtToastIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.dt-toast-bar{width:3px;align-self:stretch;border-radius:2px;flex:none}
.dt-toast-x{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:16px;line-height:1;padding:0}
.dt-toast-x:hover{color:#fff}
`;
const bars = {
  success: 'var(--green-600)',
  error: 'var(--red-600)',
  info: 'var(--blue-400)'
};
function Toast({
  kind = 'info',
  onClose,
  children,
  style
}) {
  __ds_scope.dtInject('dt-toast-css', css);
  return /*#__PURE__*/React.createElement("div", {
    className: "dt-toast",
    role: "status",
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "dt-toast-bar",
    style: {
      background: bars[kind] || bars.info
    }
  }), /*#__PURE__*/React.createElement("span", null, children), onClose && /*#__PURE__*/React.createElement("button", {
    className: "dt-toast-x",
    "aria-label": "Kapat",
    onClick: onClose
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-check{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-check input{appearance:none;width:18px;height:18px;margin:0;border:1.5px solid var(--border-default);border-radius:5px;background:var(--surface-card);cursor:pointer;display:grid;place-content:center;transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
.dt-check input:hover{border-color:var(--blue-500)}
.dt-check input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-check input:checked{background:var(--brand);border-color:var(--brand)}
.dt-check input:checked::before{content:'';width:10px;height:10px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/contain no-repeat}
.dt-check input:disabled{opacity:.5;cursor:not-allowed}
`;
function Checkbox({
  label,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-check-css', css);
  return /*#__PURE__*/React.createElement("label", {
    className: "dt-check",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox"
  }, rest)), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-iconbtn{display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-md);cursor:pointer;border:1px solid transparent;background:transparent;color:var(--text-secondary);transition:background var(--dur-fast) var(--ease-out)}
.dt-iconbtn:hover{background:var(--surface-sunken);color:var(--text-body)}
.dt-iconbtn:active{background:var(--ink-100)}
.dt-iconbtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-iconbtn-outline{border-color:var(--border-default);background:var(--surface-card)}
.dt-iconbtn-sm{width:30px;height:30px}.dt-iconbtn-md{width:36px;height:36px}
`;
function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  children,
  ...rest
}) {
  __ds_scope.dtInject('dt-iconbtn-css', css);
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `dt-iconbtn dt-iconbtn-${size} ${variant === 'outline' ? 'dt-iconbtn-outline' : ''}`,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-body)}
.dt-field-label{font:var(--text-label);color:var(--text-body)}
.dt-input{padding:9px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card);font:var(--text-body-md);color:var(--text-body);transition:border-color var(--dur-fast) var(--ease-out)}
.dt-input::placeholder{color:var(--text-muted)}
.dt-input:hover{border-color:var(--ink-300)}
.dt-input:focus{outline:none;border-color:var(--border-focus);box-shadow:var(--focus-ring)}
.dt-input-error{border-color:var(--red-600)}
.dt-field-hint{font:var(--text-caption);color:var(--text-muted)}
.dt-field-err{font:var(--text-caption);color:var(--red-600)}
`;
function Input({
  label,
  hint,
  error,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-input-css', css);
  return /*#__PURE__*/React.createElement("label", {
    className: "dt-field",
    style: style
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "dt-field-label"
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    className: `dt-input ${error ? 'dt-input-error' : ''}`
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "dt-field-err"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "dt-field-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-radio{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-radio input{appearance:none;width:18px;height:18px;margin:0;border:1.5px solid var(--border-default);border-radius:50%;background:var(--surface-card);cursor:pointer;display:grid;place-content:center;transition:border-color var(--dur-fast) var(--ease-out)}
.dt-radio input:hover{border-color:var(--blue-500)}
.dt-radio input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-radio input:checked{border:5.5px solid var(--brand)}
.dt-radio input:disabled{opacity:.5;cursor:not-allowed}
`;
function Radio({
  label,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-radio-css', css);
  return /*#__PURE__*/React.createElement("label", {
    className: "dt-radio",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio"
  }, rest)), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-select{appearance:none;padding:9px 34px 9px 12px;border-radius:var(--radius-md);border:1px solid var(--border-default);background:var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2351626F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;font:var(--text-body-md);color:var(--text-body);cursor:pointer}
.dt-select:hover{border-color:var(--ink-300)}
.dt-select:focus{outline:none;border-color:var(--border-focus);box-shadow:var(--focus-ring)}
`;
function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-select-css', css);
  return /*#__PURE__*/React.createElement("label", {
    className: "dt-field",
    style: style
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "dt-field-label"
  }, label), /*#__PURE__*/React.createElement("select", _extends({
    className: `dt-select ${error ? 'dt-input-error' : ''}`,
    defaultValue: rest.value === undefined ? '' : undefined
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), error ? /*#__PURE__*/React.createElement("span", {
    className: "dt-field-err"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "dt-field-hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.dt-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font:var(--text-body-md);color:var(--text-body)}
.dt-switch input{appearance:none;width:38px;height:22px;margin:0;border-radius:999px;background:var(--ink-200);cursor:pointer;position:relative;transition:background var(--dur-med) var(--ease-out)}
.dt-switch input::before{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:var(--shadow-sm);transition:transform var(--dur-med) var(--ease-out)}
.dt-switch input:checked{background:var(--brand)}
.dt-switch input:checked::before{transform:translateX(16px)}
.dt-switch input:focus-visible{outline:none;box-shadow:var(--focus-ring)}
.dt-switch input:disabled{opacity:.5;cursor:not-allowed}
`;
function Switch({
  label,
  style,
  ...rest
}) {
  __ds_scope.dtInject('dt-switch-css', css);
  return /*#__PURE__*/React.createElement("label", {
    className: "dt-switch",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch"
  }, rest)), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminBolumler.jsx
try { (() => {
function AdminBolumler() {
  const {
    Card,
    Button,
    Switch,
    IconButton,
    Icon,
    Input,
    Dialog
  } = window.DocTickDesignSystem_a9eaee;
  const [rows, setRows] = React.useState([{
    id: 1,
    name: 'Kardiyoloji',
    docs: 2,
    open: true
  }, {
    id: 2,
    name: 'Dermatoloji',
    docs: 1,
    open: true
  }, {
    id: 3,
    name: 'Göz Hastalıkları',
    docs: 1,
    open: true
  }, {
    id: 4,
    name: 'Ortopedi',
    docs: 1,
    open: false
  }, {
    id: 5,
    name: 'Kulak Burun Boğaz',
    docs: 1,
    open: true
  }]);
  const [add, setAdd] = React.useState(false);
  const [name, setName] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: 0
    }
  }, "B\xF6l\xFCmler"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setAdd(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), "B\xF6l\xFCm ekle")), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: '10px 20px',
      borderBottom: '1px solid var(--border-soft)',
      font: 'var(--text-overline)',
      letterSpacing: 'var(--overline-tracking)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "B\xD6L\xDCM"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110
    }
  }, "DOKTOR"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 150
    }
  }, "RANDEVUYA A\xC7IK"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 70
    }
  })), rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--text-h3)'
    }
  }, r.name), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 110,
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, r.docs, " doktor"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 150
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: r.open,
    onChange: () => setRows(a => a.map(x => x.id === r.id ? {
      ...x,
      open: !x.open
    } : x))
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 70,
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    label: "D\xFCzenle"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 15
  })), /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    label: "Sil"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 15
  })))))), /*#__PURE__*/React.createElement(Dialog, {
    open: add,
    title: "B\xF6l\xFCm ekle",
    onClose: () => setAdd(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAdd(false)
    }, "Vazge\xE7"), /*#__PURE__*/React.createElement(Button, {
      disabled: !name,
      onClick: () => {
        setRows(a => [...a, {
          id: Date.now(),
          name,
          docs: 0,
          open: false
        }]);
        setName('');
        setAdd(false);
      }
    }, "Ekle"))
  }, /*#__PURE__*/React.createElement(Input, {
    label: "B\xF6l\xFCm ad\u0131",
    placeholder: "\xF6r. N\xF6roloji",
    value: name,
    onChange: e => setName(e.target.value)
  })));
}
window.AdminBolumler = AdminBolumler;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminBolumler.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminDoktorlar.jsx
try { (() => {
function AdminDoktorlar() {
  const {
    Card,
    Button,
    Badge,
    IconButton,
    Icon,
    Input,
    Select,
    Dialog
  } = window.DocTickDesignSystem_a9eaee;
  const [rows, setRows] = React.useState([{
    id: 1,
    name: 'Uzm. Dr. Ayşe Demir',
    dept: 'Kardiyoloji',
    active: true
  }, {
    id: 2,
    name: 'Prof. Dr. Mehmet Kaya',
    dept: 'Kardiyoloji',
    active: true
  }, {
    id: 3,
    name: 'Dr. Zeynep Arslan',
    dept: 'Dermatoloji',
    active: true
  }, {
    id: 4,
    name: 'Doç. Dr. Murat Şahin',
    dept: 'Göz Hastalıkları',
    active: true
  }, {
    id: 5,
    name: 'Dr. Elif Çetin',
    dept: 'Ortopedi',
    active: false
  }, {
    id: 6,
    name: 'Uzm. Dr. Can Yılmaz',
    dept: 'Kulak Burun Boğaz',
    active: true
  }]);
  const [add, setAdd] = React.useState(false);
  const [name, setName] = React.useState('');
  const [dept, setDept] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: 0
    }
  }, "Doktorlar"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setAdd(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), "Doktor ekle")), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 20px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'var(--blue-100)',
      color: 'var(--blue-700)',
      display: 'grid',
      placeContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)',
      display: 'block'
    }
  }, r.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, r.dept)), /*#__PURE__*/React.createElement(Badge, {
    status: r.active ? 'confirmed' : 'neutral'
  }, r.active ? 'Randevuya açık' : 'Kapalı'), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    label: "D\xFCzenle"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 15
  })), /*#__PURE__*/React.createElement(IconButton, {
    size: "sm",
    label: "Sil"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 15
  })))))), /*#__PURE__*/React.createElement(Dialog, {
    open: add,
    title: "Doktor ekle",
    onClose: () => setAdd(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAdd(false)
    }, "Vazge\xE7"), /*#__PURE__*/React.createElement(Button, {
      disabled: !name || !dept,
      onClick: () => {
        setRows(a => [...a, {
          id: Date.now(),
          name,
          dept,
          active: true
        }]);
        setAdd(false);
        setName('');
        setDept('');
      }
    }, "Ekle"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Ad soyad (unvanla)",
    placeholder: "\xF6r. Uzm. Dr. Ali Veli",
    value: name,
    onChange: e => setName(e.target.value)
  }), /*#__PURE__*/React.createElement(Select, {
    label: "B\xF6l\xFCm",
    placeholder: "B\xF6l\xFCm se\xE7in",
    value: dept,
    onChange: e => setDept(e.target.value),
    options: ['Kardiyoloji', 'Dermatoloji', 'Göz Hastalıkları', 'Ortopedi', 'Kulak Burun Boğaz'].map(x => ({
      value: x,
      label: x
    }))
  }))));
}
window.AdminDoktorlar = AdminDoktorlar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminDoktorlar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminEposta.jsx
try { (() => {
function AdminEposta() {
  const {
    Card,
    Button,
    Switch,
    Select,
    Input
  } = window.DocTickDesignSystem_a9eaee;
  const [remind, setRemind] = React.useState(true);
  const [confirm, setConfirm] = React.useState(true);
  const [cancel, setCancel] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: '6px 0 0'
    }
  }, "E-posta ayarlar\u0131"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Bildirimler",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Randevu onay\u0131 e-postas\u0131",
    checked: confirm,
    onChange: e => setConfirm(e.target.checked)
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Randevu hat\u0131rlatma e-postas\u0131",
    checked: remind,
    onChange: e => setRemind(e.target.checked)
  }), remind && /*#__PURE__*/React.createElement(Select, {
    label: "Hat\u0131rlatma zaman\u0131",
    defaultValue: "24",
    options: [{
      value: '2',
      label: '2 saat önce'
    }, {
      value: '24',
      label: '24 saat önce'
    }, {
      value: '48',
      label: '48 saat önce'
    }],
    style: {
      maxWidth: 240
    }
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "\u0130ptal bilgilendirme e-postas\u0131",
    checked: cancel,
    onChange: e => setCancel(e.target.checked)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "G\xF6nderen adres",
    defaultValue: "randevu@doctick.example",
    hint: "Yan\u0131tlanmayan adres"
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Hat\u0131rlatma \u015Fablonu \u2014 \xF6nizleme",
    style: {
      flex: 1.2
    },
    footer: /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "\u015Eablonu kaydet")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-brand)',
      color: '#fff',
      padding: '14px 18px',
      font: '800 17px var(--font-display)',
      letterSpacing: '-.02em'
    }
  }, "DocTick"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-body)'
    }
  }, "Randevunuzu hat\u0131rlat\u0131r\u0131z"), /*#__PURE__*/React.createElement("span", null, "Say\u0131n Elif Yurt, yar\u0131nki randevunuz:"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-sunken)',
      borderRadius: 8,
      padding: '10px 14px',
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time)',
      color: 'var(--brand)'
    }
  }, "09:30"), /*#__PURE__*/React.createElement("span", null, "Uzm. Dr. Ay\u015Fe Demir \xB7 Kardiyoloji \xB7 24 Tem 2026, Cum")), /*#__PURE__*/React.createElement("span", null, "\u0130ptal i\xE7in randevudan en az 2 saat \xF6nce i\u015Flem yap\u0131n."))))));
}
window.AdminEposta = AdminEposta;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminEposta.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminPanel.jsx
try { (() => {
function AdminPanel() {
  const {
    Card,
    Badge
  } = window.DocTickDesignSystem_a9eaee;
  const stat = (n, l, extra) => /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '700 28px var(--font-display)',
      color: 'var(--brand)'
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, l), extra));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: '6px 0 0'
    }
  }, "Genel bak\u0131\u015F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, stat('128', 'Bu haftaki randevu'), stat('5', 'Açık bölüm'), stat('6', 'Aktif doktor'), stat('%96', 'Hatırlatma iletim oranı')), /*#__PURE__*/React.createElement(Card, {
    title: "Bug\xFCn\xFCn randevular\u0131",
    padded: false
  }, [['09:00', 'Uzm. Dr. Ayşe Demir', 'Kardiyoloji', 'confirmed', 'Onaylandı'], ['09:30', 'Uzm. Dr. Ayşe Demir', 'Kardiyoloji', 'confirmed', 'Onaylandı'], ['10:00', 'Dr. Zeynep Arslan', 'Dermatoloji', 'pending', 'Bekliyor'], ['10:30', 'Doç. Dr. Murat Şahin', 'Göz Hastalıkları', 'cancelled', 'İptal edildi']].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 20px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time)',
      color: 'var(--brand)',
      width: 50
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)',
      display: 'block'
    }
  }, r[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, r[2])), /*#__PURE__*/React.createElement(Badge, {
    status: r[3]
  }, r[4])))));
}
window.AdminPanel = AdminPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminSaatler.jsx
try { (() => {
function AdminSaatler() {
  const {
    Card,
    Button,
    Select,
    Icon
  } = window.DocTickDesignSystem_a9eaee;
  const hours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'];
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
  const [open, setOpen] = React.useState(() => {
    const s = new Set();
    days.forEach(d => hours.forEach(h => {
      if (!(d === 'Cum' && h > '14:00')) s.add(d + h);
    }));
    s.delete('Çar13:30');
    return s;
  });
  const toggle = k => setOpen(p => {
    const s = new Set(p);
    s.has(k) ? s.delete(k) : s.add(k);
    return s;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: 0
    }
  }, "Randevu saatleri"), /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: 'd1',
      label: 'Uzm. Dr. Ayşe Demir'
    }, {
      value: 'd2',
      label: 'Prof. Dr. Mehmet Kaya'
    }],
    defaultValue: "d1",
    style: {
      width: 240
    }
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Haftal\u0131k plan",
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-caption)',
        color: 'var(--text-muted)'
      }
    }, "H\xFCcreye t\u0131klay\u0131n: a\xE7\u0131k \u2194 kapal\u0131")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '56px repeat(10,1fr)',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", null), hours.map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    style: {
      font: '500 11px var(--font-mono)',
      color: 'var(--text-muted)',
      textAlign: 'center'
    }
  }, h)), days.map(d => /*#__PURE__*/React.createElement(React.Fragment, {
    key: d
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      color: 'var(--text-secondary)'
    }
  }, d), hours.map(h => {
    const k = d + h,
      on = open.has(k);
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => toggle(k),
      title: `${d} ${h}`,
      style: {
        height: 30,
        borderRadius: 6,
        border: '1px solid',
        borderColor: on ? 'var(--blue-300)' : 'var(--border-soft)',
        background: on ? 'var(--blue-100)' : 'var(--surface-sunken)',
        color: on ? 'var(--blue-700)' : 'var(--ink-300)',
        cursor: 'pointer',
        display: 'grid',
        placeContent: 'center'
      }
    }, on && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 12
    }));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Varsay\u0131lana d\xF6n"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Plan\u0131 kaydet"))));
}
window.AdminSaatler = AdminSaatler;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminSaatler.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminSidebar.jsx
try { (() => {
function AdminSidebar({
  page,
  go
}) {
  const {
    Icon
  } = window.DocTickDesignSystem_a9eaee;
  const item = (id, icon, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      padding: '10px 14px',
      borderRadius: 'var(--radius-md)',
      border: 'none',
      cursor: 'pointer',
      font: 'var(--text-label)',
      background: page === id ? 'rgba(255,255,255,.14)' : 'transparent',
      color: page === id ? '#fff' : 'rgba(255,255,255,.7)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), label);
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 220,
      flex: 'none',
      background: 'var(--surface-brand)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      gap: 4,
      minHeight: '100vh',
      position: 'sticky',
      top: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '800 20px var(--font-display)',
      letterSpacing: '-.02em',
      padding: '0 14px 6px'
    }
  }, "DocTick ", /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-overline)',
      letterSpacing: 'var(--overline-tracking)',
      opacity: .7,
      verticalAlign: 'middle'
    }
  }, "ADM\u0130N")), item('panel', 'grid', 'Genel bakış'), item('bolumler', 'plus', 'Bölümler'), item('doktorlar', 'user', 'Doktorlar'), item('saatler', 'clock', 'Randevu saatleri'), item('eposta', 'mail', 'E-posta ayarları'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: '0 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--text-body-sm)',
      color: 'rgba(255,255,255,.7)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    size: 15
  }), "\xC7\u0131k\u0131\u015F"));
}
window.AdminSidebar = AdminSidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminSidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/admin-app.jsx
try { (() => {
function AdminApp() {
  const [page, setPage] = React.useState('panel');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement(AdminSidebar, {
    page: page,
    go: setPage
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      padding: '18px 28px 56px',
      maxWidth: 980
    }
  }, page === 'panel' && /*#__PURE__*/React.createElement(AdminPanel, null), page === 'bolumler' && /*#__PURE__*/React.createElement(AdminBolumler, null), page === 'doktorlar' && /*#__PURE__*/React.createElement(AdminDoktorlar, null), page === 'saatler' && /*#__PURE__*/React.createElement(AdminSaatler, null), page === 'eposta' && /*#__PURE__*/React.createElement(AdminEposta, null)));
}
window.AdminApp = AdminApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/admin-app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hasta/HastaBooking.jsx
try { (() => {
function HastaBooking({
  onBooked
}) {
  const {
    Card,
    Button,
    Select,
    Icon,
    TimeSlot,
    Checkbox,
    Input
  } = window.DocTickDesignSystem_a9eaee;
  const D = window.DT_DATA;
  const [step, setStep] = React.useState(1);
  const [dept, setDept] = React.useState('');
  const [doc, setDoc] = React.useState(null);
  const [day, setDay] = React.useState('g1');
  const [time, setTime] = React.useState('');
  const [remind, setRemind] = React.useState(true);
  const docs = D.doctors.filter(d => d.dept === dept);
  const fulls = doc && D.full[doc.id + day] || [];
  const StepDot = ({
    n,
    label
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      display: 'grid',
      placeContent: 'center',
      font: '600 12px var(--font-body)',
      background: step >= n ? 'var(--brand)' : 'var(--ink-100)',
      color: step >= n ? '#fff' : 'var(--ink-400)'
    }
  }, step > n ? /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }) : n), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      color: step >= n ? 'var(--text-body)' : 'var(--text-muted)'
    }
  }, label));
  const dayChip = g => /*#__PURE__*/React.createElement("button", {
    key: g.id,
    onClick: () => {
      setDay(g.id);
      setTime('');
    },
    style: {
      whiteSpace: 'nowrap',
      padding: '8px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid',
      borderColor: day === g.id ? 'var(--brand)' : 'var(--border-default)',
      background: day === g.id ? 'var(--brand-soft)' : 'var(--surface-card)',
      color: day === g.id ? 'var(--brand-strong)' : 'var(--text-body)',
      font: 'var(--text-label)',
      cursor: 'pointer'
    }
  }, g.label);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)',
      paddingTop: 26
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: 0
    }
  }, "Randevu al"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(StepDot, {
    n: 1,
    label: "B\xF6l\xFCm & doktor"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 28px',
      height: 1,
      background: 'var(--border-default)'
    }
  }), /*#__PURE__*/React.createElement(StepDot, {
    n: 2,
    label: "Tarih & saat"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 28px',
      height: 1,
      background: 'var(--border-default)'
    }
  }), /*#__PURE__*/React.createElement(StepDot, {
    n: 3,
    label: "Onay"
  })), step === 1 && /*#__PURE__*/React.createElement(Card, {
    title: "B\xF6l\xFCm ve doktor se\xE7in"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "B\xF6l\xFCm",
    placeholder: "B\xF6l\xFCm se\xE7in",
    value: dept,
    options: D.depts.map(d => ({
      value: d.id,
      label: d.name
    })),
    onChange: e => {
      setDept(e.target.value);
      setDoc(null);
    },
    style: {
      maxWidth: 320
    }
  }), dept && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, docs.map(d => /*#__PURE__*/React.createElement("button", {
    key: d.id,
    onClick: () => setDoc(d),
    style: {
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid',
      borderColor: doc && doc.id === d.id ? 'var(--brand)' : 'var(--border-default)',
      background: doc && doc.id === d.id ? 'var(--brand-soft)' : 'var(--surface-card)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'var(--blue-100)',
      color: 'var(--blue-700)',
      display: 'grid',
      placeContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 17
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)',
      display: 'block'
    }
  }, d.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, d.exp))))))), step === 2 && doc && /*#__PURE__*/React.createElement(Card, {
    title: `Uygun saatler — ${doc.name}`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, D.days.map(dayChip)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, D.slots.map(t => /*#__PURE__*/React.createElement(TimeSlot, {
    key: t,
    time: t,
    state: fulls.includes(t) ? 'full' : time === t ? 'selected' : 'available',
    onClick: () => setTime(t)
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, "\xDCst\xFC \xE7izili saatler dolu."))), step === 3 && doc && /*#__PURE__*/React.createElement(Card, {
    title: "Randevu \xF6zeti"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'center',
      padding: '14px 16px',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time-lg)',
      color: 'var(--brand)'
    }
  }, time), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)',
      display: 'block'
    }
  }, doc.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, D.depts.find(x => x.id === dept).name, " \xB7 ", D.days.find(x => x.id === day).label))), /*#__PURE__*/React.createElement(Input, {
    label: "E-posta adresi",
    type: "email",
    defaultValue: "elif.yurt@eposta.com",
    hint: "Onay ve hat\u0131rlatma bu adrese g\xF6nderilir",
    style: {
      maxWidth: 340
    }
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Randevudan 24 saat \xF6nce hat\u0131rlatma e-postas\u0131 istiyorum",
    checked: remind,
    onChange: e => setRemind(e.target.checked)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end'
    }
  }, step > 1 && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setStep(step - 1)
  }, "Geri"), step < 3 && /*#__PURE__*/React.createElement(Button, {
    disabled: step === 1 ? !doc : !time,
    onClick: () => setStep(step + 1)
  }, "Devam et"), step === 3 && /*#__PURE__*/React.createElement(Button, {
    onClick: () => {
      const p = D.days.find(x => x.id === day).label.split(', ');
      onBooked({
        dept: D.depts.find(x => x.id === dept).name,
        doctor: doc.name,
        date: `${p[0]} 2026, ${p[1]}`,
        time
      });
    }
  }, "Randevuyu onayla")));
}
window.HastaBooking = HastaBooking;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/HastaBooking.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hasta/HastaHome.jsx
try { (() => {
function HastaHome({
  appts,
  go
}) {
  const {
    Card,
    Button,
    Badge,
    Icon
  } = window.DocTickDesignSystem_a9eaee;
  const next = appts.find(a => a.status === 'confirmed');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '26px 0 6px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-display)',
      letterSpacing: '-.02em',
      margin: 0
    }
  }, "Merhaba Elif,"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-lg)',
      color: 'var(--text-secondary)',
      margin: '8px 0 0'
    }
  }, "Randevular\u0131n\u0131z\u0131 buradan y\xF6netin; hat\u0131rlatmalar\u0131 DocTick g\xF6nderir.")), next ? /*#__PURE__*/React.createElement(Card, {
    title: "Yakla\u015Fan randevunuz",
    actions: /*#__PURE__*/React.createElement(Badge, {
      status: "confirmed"
    }, "Onayland\u0131")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time-lg)',
      color: 'var(--brand)'
    }
  }, next.time), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)'
    }
  }, next.doctor), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, next.dept, " \xB7 ", next.date)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => go('randevular')
  }, "Detaylar"))) : /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '14px 0',
      color: 'var(--text-secondary)',
      font: 'var(--text-body-md)'
    }
  }, "Hen\xFCz randevunuz yok. \u0130lk randevunuzu birka\xE7 ad\u0131mda al\u0131n.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 22
  })), /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)'
    }
  }, "Yeni randevu"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "B\xF6l\xFCm ve doktor se\xE7in, uygun saati ay\u0131rt\u0131n."), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go('booking')
  }, "Randevu al"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 22
  })), /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)'
    }
  }, "Hat\u0131rlatmalar"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Randevunuzdan 24 saat \xF6nce e-posta al\u0131rs\u0131n\u0131z."), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => go('randevular')
  }, "Randevular\u0131m"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 22
  })), /*#__PURE__*/React.createElement("b", {
    style: {
      font: 'var(--text-h3)'
    }
  }, "De\u011Ferlendirme"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Ge\xE7mi\u015F randevular\u0131n\u0131z i\xE7in hizmeti puanlay\u0131n."), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => go('randevular')
  }, "Ge\xE7mi\u015Fe git")))));
}
window.HastaHome = HastaHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/HastaHome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hasta/HastaRandevular.jsx
try { (() => {
function HastaRandevular({
  appts,
  onCancel,
  onRate
}) {
  const {
    Card,
    Button,
    Badge,
    Tabs,
    Dialog,
    Rating,
    Icon
  } = window.DocTickDesignSystem_a9eaee;
  const [tab, setTab] = React.useState('yaklasan');
  const [ask, setAsk] = React.useState(null);
  const [rate, setRate] = React.useState(null);
  const [stars, setStars] = React.useState(0);
  const labels = {
    confirmed: 'Onaylandı',
    pending: 'Bekliyor',
    cancelled: 'İptal edildi',
    done: 'Tamamlandı'
  };
  const list = appts.filter(a => tab === 'yaklasan' ? a.status === 'confirmed' || a.status === 'pending' : tab === 'gecmis' ? a.status === 'done' : a.status === 'cancelled');
  const row = a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 20px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time)',
      color: 'var(--brand)',
      width: 52
    }
  }, a.time), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)'
    }
  }, a.doctor), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-muted)'
    }
  }, a.dept, " \xB7 ", a.date, " \xB7 ", /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)'
    }
  }, a.code))), /*#__PURE__*/React.createElement(Badge, {
    status: a.status
  }, labels[a.status]), a.status === 'confirmed' && /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "sm",
    onClick: () => setAsk(a)
  }, "\u0130ptal et"), a.status === 'done' && (a.rating > 0 ? /*#__PURE__*/React.createElement(Rating, {
    value: a.rating,
    readOnly: true,
    size: 15
  }) : /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => {
      setRate(a);
      setStars(0);
    }
  }, "De\u011Ferlendir")));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--stack-gap)',
      paddingTop: 26
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: 'var(--text-h1)',
      margin: 0
    }
  }, "Randevular\u0131m"), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: [{
      id: 'yaklasan',
      label: 'Yaklaşan'
    }, {
      id: 'gecmis',
      label: 'Geçmiş'
    }, {
      id: 'iptal',
      label: 'İptal edilen'
    }],
    active: tab,
    onChange: setTab
  }), list.length ? list.map(row) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '26px 20px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      font: 'var(--text-body-sm)'
    }
  }, "Bu g\xF6r\xFCn\xFCmde randevu yok.")), /*#__PURE__*/React.createElement(Dialog, {
    open: !!ask,
    title: "Randevuyu iptal et",
    onClose: () => setAsk(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setAsk(null)
    }, "Vazge\xE7"), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      onClick: () => {
        onCancel(ask.id);
        setAsk(null);
      }
    }, "\u0130ptal et"))
  }, ask && /*#__PURE__*/React.createElement("span", null, ask.date, ", ", /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-time)'
    }
  }, ask.time), " \u2014 ", ask.doctor, " randevunuz iptal edilecek. \u0130ptal bilgisi e-posta ile g\xF6nderilir.")), /*#__PURE__*/React.createElement(Dialog, {
    open: !!rate,
    title: "Hizmeti de\u011Ferlendirin",
    onClose: () => setRate(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => setRate(null)
    }, "Vazge\xE7"), /*#__PURE__*/React.createElement(Button, {
      disabled: !stars,
      onClick: () => {
        onRate(rate.id, stars);
        setRate(null);
      }
    }, "G\xF6nder"))
  }, rate && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, rate.doctor, " \u2014 ", rate.dept, ", ", rate.date), /*#__PURE__*/React.createElement(Rating, {
    value: stars,
    onChange: setStars
  }))));
}
window.HastaRandevular = HastaRandevular;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/HastaRandevular.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hasta/HastaTopBar.jsx
try { (() => {
function HastaTopBar({
  page,
  go
}) {
  const {
    Icon
  } = window.DocTickDesignSystem_a9eaee;
  const tab = (id, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(id),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      font: 'var(--text-label)',
      color: page === id ? '#fff' : 'rgba(255,255,255,.65)',
      padding: '8px 12px',
      borderRadius: 8,
      background: page === id ? 'rgba(255,255,255,.12)' : 'none'
    }
  }, label);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'var(--surface-brand)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      padding: '0 var(--page-pad)',
      height: 58,
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '800 20px var(--font-display)',
      letterSpacing: '-.02em',
      cursor: 'pointer'
    },
    onClick: () => go('home')
  }, "DocTick"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, tab('home', 'Ana sayfa'), tab('booking', 'Randevu al'), tab('randevular', 'Randevularım')), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--text-body-sm)',
      color: 'rgba(255,255,255,.85)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 16
  }), "Elif Yurt")));
}
window.HastaTopBar = HastaTopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/HastaTopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hasta/data.js
try { (() => {
window.DT_DATA = {
  depts: [{
    id: 'kar',
    name: 'Kardiyoloji'
  }, {
    id: 'der',
    name: 'Dermatoloji'
  }, {
    id: 'goz',
    name: 'Göz Hastalıkları'
  }, {
    id: 'ort',
    name: 'Ortopedi'
  }, {
    id: 'kbb',
    name: 'Kulak Burun Boğaz'
  }],
  doctors: [{
    id: 'd1',
    name: 'Uzm. Dr. Ayşe Demir',
    dept: 'kar',
    exp: '12 yıl deneyim'
  }, {
    id: 'd2',
    name: 'Prof. Dr. Mehmet Kaya',
    dept: 'kar',
    exp: '24 yıl deneyim'
  }, {
    id: 'd3',
    name: 'Dr. Zeynep Arslan',
    dept: 'der',
    exp: '8 yıl deneyim'
  }, {
    id: 'd4',
    name: 'Doç. Dr. Murat Şahin',
    dept: 'goz',
    exp: '15 yıl deneyim'
  }, {
    id: 'd5',
    name: 'Dr. Elif Çetin',
    dept: 'ort',
    exp: '9 yıl deneyim'
  }, {
    id: 'd6',
    name: 'Uzm. Dr. Can Yılmaz',
    dept: 'kbb',
    exp: '11 yıl deneyim'
  }],
  days: [{
    id: 'g1',
    label: '22 Tem, Çar'
  }, {
    id: 'g2',
    label: '23 Tem, Per'
  }, {
    id: 'g3',
    label: '24 Tem, Cum'
  }],
  slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00'],
  full: {
    'd1g1': ['09:30', '13:30'],
    'd1g2': ['09:00', '10:00', '11:00'],
    'd2g1': ['10:30'],
    'd3g1': ['09:00', '14:00']
  },
  appts: [{
    id: 'a1',
    dept: 'Kardiyoloji',
    doctor: 'Uzm. Dr. Ayşe Demir',
    date: '24 Tem 2026, Cum',
    time: '09:30',
    status: 'confirmed',
    code: 'RND-2026-0421'
  }, {
    id: 'a2',
    dept: 'Dermatoloji',
    doctor: 'Dr. Zeynep Arslan',
    date: '10 Haz 2026, Çar',
    time: '14:00',
    status: 'done',
    code: 'RND-2026-0287',
    rating: 0
  }, {
    id: 'a3',
    dept: 'Ortopedi',
    doctor: 'Dr. Elif Çetin',
    date: '02 May 2026, Cmt',
    time: '10:00',
    status: 'cancelled',
    code: 'RND-2026-0198'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/data.js", error: String((e && e.message) || e) }); }

// ui_kits/hasta/hasta-app.jsx
try { (() => {
function HastaApp() {
  const {
    Toast
  } = window.DocTickDesignSystem_a9eaee;
  const [page, setPage] = React.useState('home');
  const [appts, setAppts] = React.useState(window.DT_DATA.appts);
  const [toast, setToast] = React.useState(null);
  const show = (kind, msg) => {
    setToast({
      kind,
      msg
    });
    setTimeout(() => setToast(null), 4200);
  };
  const booked = b => {
    setAppts(a => [{
      id: 'a' + Date.now(),
      dept: b.dept,
      doctor: b.doctor,
      date: b.date,
      time: b.time,
      status: 'confirmed',
      code: 'RND-2026-0' + (430 + a.length)
    }, ...a]);
    setPage('randevular');
    show('success', 'Randevunuz oluşturuldu. Onay e-postası adresinize gönderildi.');
  };
  const cancel = id => {
    setAppts(a => a.map(x => x.id === id ? {
      ...x,
      status: 'cancelled'
    } : x));
    show('info', 'Randevunuz iptal edildi. Bilgilendirme e-postası gönderildi.');
  };
  const rated = (id, n) => {
    setAppts(a => a.map(x => x.id === id ? {
      ...x,
      rating: n
    } : x));
    show('success', 'Değerlendirmeniz için teşekkürler.');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement(HastaTopBar, {
    page: page,
    go: setPage
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      padding: '0 var(--page-pad) 56px'
    }
  }, page === 'home' && /*#__PURE__*/React.createElement(HastaHome, {
    appts: appts,
    go: setPage
  }), page === 'booking' && /*#__PURE__*/React.createElement(HastaBooking, {
    onBooked: booked
  }), page === 'randevular' && /*#__PURE__*/React.createElement(HastaRandevular, {
    appts: appts,
    onCancel: cancel,
    onRate: rated
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 20,
      bottom: 20,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    kind: toast.kind,
    onClose: () => setToast(null)
  }, toast.msg)));
}
window.HastaApp = HastaApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hasta/hasta-app.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.TimeSlot = __ds_scope.TimeSlot;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

})();
