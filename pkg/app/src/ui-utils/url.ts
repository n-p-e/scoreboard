type URLValue = string | number | boolean | UrlRawFragment

export function url(
  strings: TemplateStringsArray,
  ...values: URLValue[]
): string {
  let result = ""

  for (let i = 0; i < strings.length; i++) {
    result += strings[i]

    if (i < values.length) {
      const value = values[i]
      // Convert to string and encode the component
      let encodedValue: string
      if (isFragment(value)) {
        encodedValue = value.value
      } else {
        encodedValue = encodeURIComponent(String(value))
      }
      result += encodedValue
    }
  }

  // Clean up any double slashes (except after protocol)
  // result = result.replace(/([^:]\/)\/+/g, "$1")

  return result
}

interface UrlRawFragment {
  readonly _isRawFragment: true
  readonly value: string
}

export function fragment(value: string): UrlRawFragment {
  return {
    _isRawFragment: true,
    value,
  }
}

/**
 * Type guard to check if a value is a Fragment
 */
function isFragment(value: unknown): value is UrlRawFragment {
  return (
    typeof value === "object" &&
    value != null &&
    // biome-ignore lint/suspicious/noExplicitAny: type guarded
    (value as any)._isRawFragment === true
  )
}
