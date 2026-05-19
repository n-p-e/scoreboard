import clsx from "clsx"
import { JSX, splitProps } from "solid-js"

export const Input = (props: JSX.InputHTMLAttributes<HTMLInputElement>) => {
  const [custom, inputProps] = splitProps(props, ["class"])
  return <input {...inputProps} class={clsx("ui-input", custom.class)} />
}
