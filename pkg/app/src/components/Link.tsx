import { createLink, LinkComponent } from "@tanstack/solid-router"
import * as Solid from "solid-js"

type CustomLinkProps = Solid.JSX.IntrinsicElements["a"] & {
  activeClass?: string
  inactiveClass?: string
}

const BasicLinkComponent: Solid.Component<
  CustomLinkProps & { isActive?: boolean }
> = (props) => {
  const [, linkProps] = Solid.splitProps(props, [
    "activeClass",
    "inactiveClass",
    "isActive",
  ])
  return <a {...linkProps}>{props.children}</a>
}

const CreatedLinkComponent = createLink(BasicLinkComponent)

export const Link: LinkComponent<Solid.Component<CustomLinkProps>> = (
  props
) => {
  // The styles and classes are merged by tanstack router
  return (
    <CreatedLinkComponent
      activeProps={{
        class: props.activeClass,
      }}
      inactiveProps={{
        class: props.inactiveClass,
      }}
      {...props}
    />
  )
}
