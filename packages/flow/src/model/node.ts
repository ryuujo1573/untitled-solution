export type NodeBase<
  NodeAttr extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: string
  position: Position
  attr: NodeAttr
}
