export function createExecutionId(): string {
  return `ex_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createSessionId(): string {
  return `ses_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function unitRandom(seed: string): number {
  return hash32(seed) / 0xffffffff;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
