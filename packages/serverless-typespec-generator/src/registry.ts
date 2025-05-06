export class Registry<T> {
  private store: Map<string, T>

  constructor() {
    this.store = new Map<string, T>()
  }

  register(key: string, value: T): void {
    if (this.store.has(key)) {
      throw new Error(`Registry already contains key "${String(key)}"`)
    }

    this.store.set(key, value)
  }

  get(key: string): T | undefined {
    return this.store.get(key)
  }

  has(key: string): boolean {
    return this.store.has(key)
  }

  values(): MapIterator<T> {
    return this.store.values()
  }
}
