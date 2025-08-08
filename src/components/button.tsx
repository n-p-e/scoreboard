import clsx from "clsx"
import { type JSX, splitProps } from "solid-js"

export const Button = (
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "destructive" | "confirm"
  }
) => {
  const [custom, buttonProps] = splitProps(props, ["type", "class", "variant"])

  return (
    <button
      {...buttonProps}
      type={custom.type ?? "button"}
      class={clsx(
        "ui-button",
        {
          "ui-button-outline": custom.variant === "outline",
          "ui-button-destructive": custom.variant === "destructive",
          "ui-button-confirm": custom.variant === "confirm",
        },
        custom.class
      )}
    />
  )
}
