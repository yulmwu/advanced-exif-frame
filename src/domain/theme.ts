export type ThemeValue = string | number | boolean
export type ThemeOptionInput = Map<string, ThemeValue>
export type ThemeOption = { id: string; description?: string } & (
    | { type: 'string' | 'color'; default: string }
    | { type: 'number'; default: number }
    | { type: 'boolean'; default: boolean }
    | { type: 'select'; default: string; options: string[] }
    | {
          type: 'range-slider'
          default: number
          min: number
          max: number
          step: number
      }
)
