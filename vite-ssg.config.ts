// vite-ssg.config.ts
import type { ViteSSGOptions } from 'vite-ssg'

export default {
  includedRoutes(paths: string[]) {
    return paths.filter((i: string) => !i.includes(':'))
  }
} satisfies ViteSSGOptions