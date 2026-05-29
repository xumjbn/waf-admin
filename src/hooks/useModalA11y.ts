import { useEffect, RefObject } from 'react'

// useModalA11y —— 把模态弹层升级到符合 WAI-ARIA 的最小行为集：
//
//  1. ESC 调 onClose（任何模态都应该能按 Esc 取消）；
//  2. 打开时焦点自动落到弹层内第一个可聚焦元素（避免回车走到 page 上的按钮）；
//  3. Tab / Shift+Tab 在弹层内循环（focus trap），不让键盘穿出到背景；
//  4. open 期间锁住 body 滚动，关闭后恢复。
//
// 使用：在 modal 组件里加 `const ref = useRef<HTMLDivElement>(null);
//       useModalA11y({ open: true, onClose, containerRef: ref })`
// 然后把 ref 绑到 .modal-overlay 或 .modal-panel 容器上。
//
// 不依赖 react-focus-lock / @react-aria，零体积，覆盖 90% 模态需要。
export function useModalA11y(opts: {
  open: boolean
  onClose?: () => void
  containerRef: RefObject<HTMLElement>
}) {
  const { open, onClose, containerRef } = opts

  useEffect(() => {
    if (!open) return
    const container = containerRef.current
    if (!container) return

    // -- 1. lock body scroll --
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // -- 2. initial focus --
    const focusables = () => getFocusable(container)
    const list = focusables()
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (list.length > 0) {
      list[0].focus()
    } else {
      // 弹层里没可聚焦元素时，焦点放到 container 本身（让 ESC 仍能触发）
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    // -- 3. ESC + Tab trap --
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      // 恢复打开前的焦点（点击按钮 → 模态 → 关闭 → 焦点回到按钮）
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [open, onClose, containerRef])
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  // 过掉隐藏元素（display:none / visibility:hidden / aria-hidden 容器）
  return Array.from(nodes).filter(el => {
    if (el.hasAttribute('hidden')) return false
    if (el.closest('[aria-hidden="true"]')) return false
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return true
  })
}
