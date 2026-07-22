import type { Ref } from 'vue'

export type ReactiveRecord =
  | Record<number, string>
  | Ref<Record<number, string>>

export function resolveScalar<T>(value: T | Ref<T>): T {
  if (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    !Array.isArray(value)
  ) {
    return (value as Ref<T>).value
  }
  return value as T
}

export function resolveRecord(value: ReactiveRecord): Record<number, string> {
  return resolveScalar(value)
}

export function setRecordValue(
  value: ReactiveRecord,
  updater: (prev: Record<number, string>) => Record<number, string>
): void {
  if (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    !Array.isArray(value)
  ) {
    const ref = value as Ref<Record<number, string>>
    ref.value = updater(ref.value)
    return
  }
  Object.assign(
    value as Record<number, string>,
    updater(value as Record<number, string>)
  )
}
