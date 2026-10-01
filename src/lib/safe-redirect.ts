const BASE = 'http://interno.invalid';

/**
 * Destino de `?voltar=` depois do login. Só aceita caminhos do próprio site; qualquer outra coisa
 * vira "/". A checagem final pela origem cobre truques que o parser de URL normaliza (tabs, barras invertidas).
 */
export function safeRedirectPath(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
