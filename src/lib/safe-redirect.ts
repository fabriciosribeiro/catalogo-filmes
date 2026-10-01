const BASE = 'http://interno.invalid';

/**
 * Destino de `?voltar=` depois do login. Só aceita caminhos do próprio site; qualquer outra coisa
 * vira "/". Valida a entrada e também o caminho já normalizado pelo parser de URL (tabs, barras
 * invertidas, segmentos "." e "..").
 */
export function safeRedirectPath(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return '/';
    const path = `${url.pathname}${url.search}${url.hash}`;
    // A normalização (ex.: "/.//evil.com") pode produzir "//host", que o navegador lê como outra origem
    return path.startsWith('//') || path.startsWith('/\\') ? '/' : path;
  } catch {
    return '/';
  }
}
