import { vi } from 'vitest';

export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = () => [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  trigger() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

export function installFakeIntersectionObserver() {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  return {
    get instances() {
      return FakeIntersectionObserver.instances;
    },
    /** Dispara o observer ativo mais recente. */
    trigger() {
      const active = FakeIntersectionObserver.instances.filter(
        (o) => o.disconnect.mock.calls.length === 0,
      );
      active.at(-1)?.trigger();
    },
  };
}
