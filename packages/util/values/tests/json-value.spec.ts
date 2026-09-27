import { afterEach, describe, expect, it, vi } from 'vitest'
import { isJsonValue, snapshotJsonValue } from '../src/index.ts'

/** Render native constructors the way JavaScriptCore (Safari) does; every other function reads as user source. */
function useJavaScriptCoreNativeSource(): void {
  vi.spyOn(Function.prototype, 'toString').mockImplementation(function (this: { name: string }) {
    return this === Object || this === Array ? `function ${this.name}() {\n    [native code]\n}` : 'function () {}'
  })
}

describe('lossless JSON across engines', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts plain objects and arrays when native source spans lines', () => {
    useJavaScriptCoreNativeSource()
    const chunk = { type: 'finish', usage: { inputTokens: 1 }, parts: [1, { a: null }] }

    expect(isJsonValue(chunk)).toBe(true)
    expect(snapshotJsonValue(chunk)).toEqual(chunk)
  })

  it('still rejects a forged constructor named Object', () => {
    useJavaScriptCoreNativeSource()
    const prototype = Object.create(null) as { constructor?: unknown }
    function Forged(): void {}
    Object.defineProperty(Forged, 'name', { value: 'Object' })
    Forged.prototype = prototype
    prototype.constructor = Forged

    expect(isJsonValue(Object.create(prototype))).toBe(false)
  })
})
