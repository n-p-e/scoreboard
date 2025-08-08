export type AppErrorInfo = {
  tag?: string
  [key: string]: string | number | object | null | undefined
}

export class AppError extends Error {
  readonly info: AppErrorInfo

  constructor(message: string, data?: string | AppErrorInfo) {
    super(message)
    if (typeof data === "object") {
      this.info = data
    } else {
      this.info = { tag: data }
    }

    if (this.info.tag == null) {
      this.info.tag = message
    }
  }

  toString(): string {
    return this.message
  }
}
