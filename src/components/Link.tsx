import { createLink, LinkComponent } from "@tanstack/solid-router"
import * as Solid from "solid-js"

type BasicLinkProps = Solid.JSX.IntrinsicElements["a"] & {
  activeClass?: string
  inactiveClass?: string
}

const BasicLinkComponent: Solid.Component<BasicLinkProps> = (props) => {
  return <a {...props}>{props.children}</a>
}

const CreatedLinkComponent = createLink(BasicLinkComponent)

export const Link: LinkComponent<typeof BasicLinkComponent> = (props) => {
  return (
    <CreatedLinkComponent
      preload={"intent"}
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
