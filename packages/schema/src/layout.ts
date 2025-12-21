import { z } from 'zod'

export const LayoutContextSchema = z.enum(['flex', 'grid', 'block', 'scroll'])
export type LayoutContext = z.infer<typeof LayoutContextSchema>

export const ComponentCategorySchema = z.enum([
  'reusable',
  'library',
  'new',
  'primitive',
])
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>

// Responsive value can be a single value or an object with breakpoints
export const ResponsiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.record(z.string(), z.union([z.string(), z.number()])),
])
export type ResponsiveValue = z.infer<typeof ResponsiveValueSchema>

export interface LayoutBaseProps {
  direction?: 'row' | 'column'
  gap?: ResponsiveValue
  align?: string
  justify?: string
  flex?: ResponsiveValue
  width?: ResponsiveValue
  height?: ResponsiveValue
  padding?: ResponsiveValue
  columns?: string // for grid
  rows?: string // for grid
  axis?: 'x' | 'y' | 'both' // for scroll
  [key: string]: unknown
}

export type LayoutNode =
  | {
      id: string
      type: 'layout'
      context: LayoutContext
      props?: LayoutBaseProps
      children?: LayoutNode[]
    }
  | {
      id: string
      type: 'component'
      category: ComponentCategory
      name: string
      props?: Record<string, unknown>
      children?: LayoutNode[]
    }

export const LayoutNodeSchema: z.ZodType<LayoutNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      id: z.string(),
      type: z.literal('layout'),
      context: LayoutContextSchema,
      props: z
        .object({
          direction: z.enum(['row', 'column']).optional(),
          gap: ResponsiveValueSchema.optional(),
          align: z.string().optional(),
          justify: z.string().optional(),
          flex: ResponsiveValueSchema.optional(),
          width: ResponsiveValueSchema.optional(),
          height: ResponsiveValueSchema.optional(),
          padding: ResponsiveValueSchema.optional(),
          columns: z.string().optional(),
          rows: z.string().optional(),
          axis: z.enum(['x', 'y', 'both']).optional(),
        })
        .catchall(z.any())
        .optional(),
      children: z.array(LayoutNodeSchema).optional(),
    }),
    z.object({
      id: z.string(),
      type: z.literal('component'),
      category: ComponentCategorySchema,
      name: z.string(),
      props: z.record(z.string(), z.any()).optional(),
      children: z.array(LayoutNodeSchema).optional(),
    }),
  ]),
)

export const LayoutIRSchema = z.object({
  version: z.string(),
  root: LayoutNodeSchema,
})

export type LayoutIR = z.infer<typeof LayoutIRSchema>
