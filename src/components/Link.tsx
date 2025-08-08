import { createLink, LinkComponent } from "@tanstack/solid-router"
import * as Solid from "solid-js"

type BasicLinkProps = Solid.JSX.IntrinsicElements["a"] & {
  // Add any additional props you want to pass to the anchor element
  activeClass?: string
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
      {...props}
    />
  )
}
