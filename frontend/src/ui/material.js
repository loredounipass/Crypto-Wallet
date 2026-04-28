import React from "react";
import { defaultTheme, mergeStyles, sxToStyle } from "./sx";

const cx = (...values) => values.filter(Boolean).join(" ");

const resolveComponent = (component) => component || "div";

export const Box = ({ component, sx, style, className, children, ...props }) => {
  const Component = resolveComponent(component);
  // Extract MUI system props so they don't leak to the DOM
  const {
    display, alignItems, justifyContent, flexDirection, flexWrap, flex, gap,
    p, m, mb, mt, ml, mr, px, py, pt, pb, pl, pr,
    bgcolor, borderRadius, overflow, position,
    width, height, minWidth, maxWidth, minHeight, maxHeight, textAlign,
    ...domProps
  } = props;
  const spacingVal = (v) => (typeof v === 'number' ? `${v * 8}px` : v);
  const systemStyle = {};
  if (display != null) systemStyle.display = display;
  if (alignItems != null) systemStyle.alignItems = alignItems;
  if (justifyContent != null) systemStyle.justifyContent = justifyContent;
  if (flexDirection != null) systemStyle.flexDirection = flexDirection;
  if (flexWrap != null) systemStyle.flexWrap = flexWrap;
  if (flex != null) systemStyle.flex = flex;
  if (gap != null) systemStyle.gap = spacingVal(gap);
  if (p != null) systemStyle.padding = spacingVal(p);
  if (m != null) systemStyle.margin = spacingVal(m);
  if (mb != null) systemStyle.marginBottom = spacingVal(mb);
  if (mt != null) systemStyle.marginTop = spacingVal(mt);
  if (ml != null) systemStyle.marginLeft = spacingVal(ml);
  if (mr != null) systemStyle.marginRight = spacingVal(mr);
  if (px != null) { systemStyle.paddingLeft = spacingVal(px); systemStyle.paddingRight = spacingVal(px); }
  if (py != null) { systemStyle.paddingTop = spacingVal(py); systemStyle.paddingBottom = spacingVal(py); }
  if (pt != null) systemStyle.paddingTop = spacingVal(pt);
  if (pb != null) systemStyle.paddingBottom = spacingVal(pb);
  if (pl != null) systemStyle.paddingLeft = spacingVal(pl);
  if (pr != null) systemStyle.paddingRight = spacingVal(pr);
  if (bgcolor != null) systemStyle.backgroundColor = bgcolor;
  if (borderRadius != null) systemStyle.borderRadius = typeof borderRadius === 'number' ? `${borderRadius * 4}px` : borderRadius;
  if (overflow != null) systemStyle.overflow = overflow;
  if (position != null) systemStyle.position = position;
  if (width != null) systemStyle.width = width;
  if (height != null) systemStyle.height = height;
  if (minWidth != null) systemStyle.minWidth = minWidth;
  if (maxWidth != null) systemStyle.maxWidth = maxWidth;
  if (minHeight != null) systemStyle.minHeight = minHeight;
  if (maxHeight != null) systemStyle.maxHeight = maxHeight;
  if (textAlign != null) systemStyle.textAlign = textAlign;
  return (
    <Component className={className} style={{ ...systemStyle, ...mergeStyles(sx, style) }} {...domProps}>
      {children}
    </Component>
  );
};

export const Container = ({ maxWidth = "lg", sx, style, className, children, ...props }) => {
  const maxWidthMap = { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" };
  return (
    <div
      className={cx("mx-auto w-full", className)}
      style={{ maxWidth: maxWidthMap[maxWidth] || maxWidthMap.lg, ...mergeStyles(sx, style) }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CssBaseline = () => null;

export const Toolbar = ({ sx, style, children, ...props }) => (
  <div className="min-h-16 w-full" style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);

export const Typography = ({ component, variant = "body1", color, sx, style, children, ...props }) => {
  const Component = component || (variant.startsWith("h") ? variant : "p");
  const variantClass = {
    h4: "text-3xl font-semibold",
    h5: "text-2xl font-semibold",
    h6: "text-xl font-semibold",
    body1: "text-base",
    body2: "text-sm",
    caption: "text-xs",
    subtitle1: "text-lg",
  }[variant] || "text-base";
  return (
    <Component className={variantClass} style={{ color, ...mergeStyles(sx, style) }} {...props}>
      {children}
    </Component>
  );
};

export const Link = ({ component: Component, href, to, sx, style, children, ...props }) => {
  const Tag = Component || "a";
  return (
    <Tag href={href || to} to={to} style={mergeStyles(sx, style)} {...props}>
      {children}
    </Tag>
  );
};

export const Button = ({ variant = "contained", color = "primary", fullWidth, sx, style, children, ...props }) => {
  const colorMap = {
    primary: "bg-blue-600 text-white border-blue-600",
    secondary: "bg-slate-700 text-white border-slate-700",
    error: "bg-red-600 text-white border-red-600",
    info: "bg-cyan-600 text-white border-cyan-600",
    inherit: "bg-transparent text-inherit border-current",
  };
  const base = "inline-flex items-center justify-center rounded px-4 py-2 border transition disabled:opacity-60";
  const variantClass =
    variant === "outlined"
      ? "bg-transparent"
      : variant === "text"
      ? "bg-transparent border-transparent"
      : colorMap[color] || colorMap.primary;
  return (
    <button className={cx(base, variantClass, fullWidth && "w-full")} style={mergeStyles(sx, style)} {...props}>
      {children}
    </button>
  );
};

export const IconButton = ({ sx, style, children, ...props }) => (
  <button
    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent hover:bg-slate-100"
    style={mergeStyles(sx, style)}
    {...props}
  >
    {children}
  </button>
);

export const Avatar = ({ src, alt, sx, style, imgProps = {}, children, ...props }) => (
  <div
    className="inline-flex items-center justify-center overflow-hidden rounded-full bg-slate-300 text-sm font-semibold"
    style={{ width: 32, height: 32, ...mergeStyles(sx, style) }}
    {...props}
  >
    {src ? <img src={src} alt={alt} className="h-full w-full object-cover" {...imgProps} /> : children}
  </div>
);

export const Tooltip = ({ children, title }) => (
  <span title={typeof title === "string" ? title : undefined}>{children}</span>
);

export const Divider = ({ sx, style, ...props }) => (
  <hr className="border-0 border-t border-slate-200" style={mergeStyles(sx, style)} {...props} />
);

export const Paper = ({ sx, style, children, ...props }) => (
  <div className="rounded-lg bg-white shadow" style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);

export const Card = Paper;
export const CardContent = ({ sx, style, children, ...props }) => (
  <div style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);
export const CardHeader = ({ title, sx, style, ...props }) => (
  <div className="border-b border-slate-200 px-4 py-3 text-lg font-semibold" style={mergeStyles(sx, style)} {...props}>
    {title}
  </div>
);

export const Grid = ({ container, item, spacing = 0, xs, sm, md, lg, direction, alignItems, justifyContent, wrap, children, sx, style, ...props }) => {
  const gap = `${Number(spacing || 0) * 8}px`;
  const widthPct = (n) => `${(Number(n || 12) / 12) * 100}%`;
  const itemStyle = item
    ? {
        width: widthPct(xs),
      }
    : {};
  const flexProps = {};
  if (direction) flexProps.flexDirection = direction;
  if (alignItems) flexProps.alignItems = alignItems;
  if (justifyContent) flexProps.justifyContent = justifyContent;
  if (wrap) flexProps.flexWrap = wrap;
  return (
    <div
      style={{
        ...(container ? { display: "flex", flexWrap: "wrap", gap } : {}),
        ...flexProps,
        ...itemStyle,
        ...mergeStyles(sx, style),
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Stack = ({ direction = "column", spacing = 0, sx, style, children, ...props }) => (
  <div
    style={{
      display: "flex",
      flexDirection: direction,
      gap: `${Number(spacing) * 8}px`,
      ...mergeStyles(sx, style),
    }}
    {...props}
  >
    {children}
  </div>
);

export const Alert = ({ severity = "info", children, sx, style, ...props }) => {
  const map = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <div className={cx("rounded border px-3 py-2 text-sm", map[severity])} style={mergeStyles(sx, style)} {...props}>
      {children}
    </div>
  );
};

const ModalShell = ({ open, onClose, children, style }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-4 shadow-xl" style={style} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const Dialog = ({ open, onClose, children, PaperProps = {} }) => (
  <ModalShell open={open} onClose={onClose} style={sxToStyle(PaperProps.sx)}>
    {children}
  </ModalShell>
);
export const DialogTitle = ({ children, sx, style, ...props }) => (
  <h3 className="mb-2 text-lg font-semibold" style={mergeStyles(sx, style)} {...props}>
    {children}
  </h3>
);
export const DialogContent = ({ children, sx, style, ...props }) => (
  <div className="mb-3" style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);
export const DialogActions = ({ children, sx, style, ...props }) => (
  <div className="flex items-center justify-end gap-2" style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);

export const List = ({ children, sx, style, ...props }) => (
  <ul className="list-none p-0 m-0" style={mergeStyles(sx, style)} {...props}>
    {children}
  </ul>
);
export const ListItem = ({ children, button, selected, sx, style, ...props }) => (
  <li
    className={cx(button && "cursor-pointer", selected && "bg-blue-50")}
    style={mergeStyles(sx, style)}
    {...props}
  >
    {children}
  </li>
);
export const ListItemText = ({ primary, children, sx, style, ...props }) => (
  <span style={mergeStyles(sx, style)} {...props}>
    {primary || children}
  </span>
);
export const ListItemIcon = ({ children, sx, style, ...props }) => (
  <span className="mr-2 inline-flex items-center" style={mergeStyles(sx, style)} {...props}>
    {children}
  </span>
);

export const Drawer = ({ open, onClose, children, sx, style, PaperProps = {} }) => {
  if (!open) return null;

  const rootSx = { ...sx };
  const paperSx = { ...PaperProps.sx };

  if (rootSx['& .MuiDrawer-paper']) {
    Object.assign(paperSx, rootSx['& .MuiDrawer-paper']);
    delete rootSx['& .MuiDrawer-paper'];
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40" style={mergeStyles(rootSx, style)} onClick={onClose}>
      <div className="h-full bg-white shadow-xl overflow-hidden" style={{ width: 240, ...sxToStyle(paperSx) }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const Menu = ({ open, anchorEl, children, onClose, sx, style }) => {
  if (!open) return null;
  const rect = anchorEl?.getBoundingClientRect?.();
  return (
    <div
      className="fixed z-50 min-w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
      style={{
        top: rect ? rect.bottom + 8 : 16,
        left: rect ? rect.left : 16,
        ...mergeStyles(sx, style),
      }}
      onMouseLeave={onClose}
    >
      {children}
    </div>
  );
};

export const MenuItem = ({ children, sx, style, ...props }) => (
  <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-100" style={mergeStyles(sx, style)} {...props}>
    {children}
  </button>
);

export const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  fullWidth,
  multiline,
  rows,
  placeholder,
  sx,
  style,
  InputProps = {},
  InputLabelProps,
  error,
  helperText,
  ...props
}) => {
  const inputStyle = mergeStyles(InputProps.sx, {});
  return (
    <label className={cx("block", fullWidth && "w-full")} style={mergeStyles(sx, style)}>
      {label && (
        <span className="mb-1 block text-sm text-slate-700" style={InputLabelProps?.style}>
          {label}
        </span>
      )}
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            rows={rows || 3}
            placeholder={placeholder}
            className={cx("w-full rounded border px-3 py-2", error ? "border-red-500" : "border-slate-300")}
            style={inputStyle}
            {...props}
          />
        ) : (
          <input
            value={value}
            onChange={onChange}
            type={type}
            placeholder={placeholder}
            className={cx("w-full rounded border px-3 py-2", error ? "border-red-500" : "border-slate-300")}
            style={inputStyle}
            {...props}
          />
        )}
        {InputProps.endAdornment && <span className="absolute right-2 top-1/2 -translate-y-1/2">{InputProps.endAdornment}</span>}
      </div>
      {helperText && <span className="mt-1 block text-xs text-red-600">{helperText}</span>}
    </label>
  );
};

export const InputAdornment = ({ children }) => <span>{children}</span>;

export const FormControl = ({ children, fullWidth, sx, style, ...props }) => (
  <div className={cx(fullWidth && "w-full")} style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);
export const InputLabel = ({ children, ...props }) => <label {...props}>{children}</label>;
export const Select = ({ value, onChange, children, sx, style, ...props }) => (
  <select value={value} onChange={onChange} className="w-full rounded border border-slate-300 px-3 py-2" style={mergeStyles(sx, style)} {...props}>
    {children}
  </select>
);

export const Checkbox = ({ checked, onChange, ...props }) => <input type="checkbox" checked={checked} onChange={onChange} {...props} />;
export const Switch = ({ checked, onChange, disabled, ...props }) => <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} {...props} />;
export const FormControlLabel = ({ control, label, sx, style, ...props }) => (
  <label className="inline-flex items-center gap-2" style={mergeStyles(sx, style)} {...props}>
    {control}
    <span>{label}</span>
  </label>
);

export const CircularProgress = ({ size = 20 }) => (
  <span
    className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    style={{ width: size, height: size }}
  />
);
export const LinearProgress = () => <div className="h-1 w-full animate-pulse bg-blue-500" />;

export const Snackbar = ({ open, children, anchorOrigin }) =>
  open ? (
    <div
      className="fixed z-50"
      style={{
        bottom: anchorOrigin?.vertical === "bottom" ? 16 : undefined,
        top: anchorOrigin?.vertical === "top" ? 16 : undefined,
        left: anchorOrigin?.horizontal === "left" ? 16 : undefined,
        right: anchorOrigin?.horizontal === "right" ? 16 : undefined,
      }}
    >
      {children}
    </div>
  ) : null;

export const Chip = ({ label }) => <span className="inline-flex rounded-full border px-2 py-0.5 text-xs">{label}</span>;
export const Zoom = ({ children }) => <>{children}</>;
export const Slide = React.forwardRef(({ children }, ref) => <div ref={ref}>{children}</div>);

export const TableContainer = ({ children, sx, style, ...props }) => (
  <div className="overflow-auto" style={mergeStyles(sx, style)} {...props}>
    {children}
  </div>
);
export const Table = ({ children, size, sx, style, ...props }) => (
  <table className={cx("w-full border-collapse", size === "small" && "text-sm")} style={mergeStyles(sx, style)} {...props}>
    {children}
  </table>
);
export const TableHead = ({ children }) => <thead>{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children, style, ...props }) => <tr style={style} {...props}>{children}</tr>;
export const TableCell = ({ children, sx, style, ...props }) => (
  <td className="border-b border-slate-200 px-2 py-2 align-top" style={mergeStyles(sx, style)} {...props}>
    {children}
  </td>
);

export const useTheme = () => defaultTheme;

export const useMediaQuery = (queryOrFn) => {
  const query = typeof queryOrFn === "function" ? queryOrFn(defaultTheme) : queryOrFn;
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mql = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", listener);
    else mql.addListener(listener);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", listener);
      else mql.removeListener(listener);
    };
  }, [query]);

  return matches;
};

export const AppBar = ({ position = "relative", sx, style, children, ...props }) => (
  <div
    className={position === "fixed" ? "fixed top-0 left-0 right-0 z-50" : position === "absolute" ? "absolute top-0 left-0 right-0 z-50" : "relative"}
    style={mergeStyles(sx, style)}
    {...props}
  >
    {children}
  </div>
);
