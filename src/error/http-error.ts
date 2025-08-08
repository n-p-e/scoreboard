import { AppError, type AppErrorInfo } from "~/error/app-error"

export class HttpStatusError extends AppError {
  readonly httpStatus: number

  constructor(status: number, message: string, data?: string | AppErrorInfo) {
    super(message, data)
    this.httpStatus = status
  }

  toString(): string {
    return `[${this.httpStatus}] ${this.message}`
  }
}
