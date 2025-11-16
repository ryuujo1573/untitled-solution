export type EdgeBase<
  EdgeAttr extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: string
  source: string
  target: string
  attr: EdgeAttr
}
