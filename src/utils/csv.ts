// CSV cell formatter with formula-injection guard.
//
// Excel/Numbers/LibreOffice 会把以 = + - @ TAB CR 开头的单元格当作公式执行 ——
// 即便外面包了双引号也照执行。攻击者把 `=HYPERLINK("evil","click")` 放到自己
// 控制的字段（如 site 名 / URI / IP 标签）后，下载 CSV 的运营会被钓鱼。
// 防御：在危险首字符前补单引号 `'`，文本含义不变但禁用公式。
// 同时对内部双引号做 RFC 4180 escape（"" 双写）。
const DANGER_PREFIXES = new Set(['=', '+', '-', '@', '\t', '\r'])

export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  const safe = s.length > 0 && DANGER_PREFIXES.has(s[0]) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',')
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  return [csvRow(headers), ...rows.map(csvRow)].join('\n')
}
