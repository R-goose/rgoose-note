import { ref } from 'vue'

// 卡牌尺寸与扇面步进（px），布局计算与 CSS 变量同源
export const DECK_CARD_W = 168
export const DECK_CARD_H = 88
export const DECK_PEEK = 4
export const DECK_COLS = 3

const PEEK_X = 16
const PEEK_Y = 10
// 展开时卡牌之间的留白，避免扇开后彼此紧贴
export const FAN_GAP_X = 26
export const FAN_GAP_Y = 22
export const FAN_STEP_X = DECK_CARD_W + FAN_GAP_X
export const FAN_STEP_Y = DECK_CARD_H + FAN_GAP_Y

/** 展开态扇面的尺寸 */
export function deckFanSize(count) {
  const cols = Math.min(count, DECK_COLS)
  const rows = Math.ceil(count / DECK_COLS)
  return {
    width: DECK_CARD_W + (cols - 1) * FAN_STEP_X,
    height: DECK_CARD_H + (rows - 1) * FAN_STEP_Y
  }
}

/** 卡牌堆容器的几何变量 */
export function deckStackStyle(count) {
  const fan = deckFanSize(count)
  return {
    '--deck-w': `${DECK_CARD_W}px`,
    '--deck-h': `${DECK_CARD_H}px`,
    '--peek-x': `${PEEK_X}px`,
    '--peek-y': `${PEEK_Y}px`,
    '--fan-x': `${FAN_STEP_X}px`,
    '--fan-y': `${FAN_STEP_Y}px`,
    '--fan-w': `${fan.width}px`,
    '--fan-h': `${fan.height}px`
  }
}

/** 单张卡片的堆叠层与扇面行列 */
export function deckCardStyle(index, count) {
  return {
    '--cl': Math.min(index, DECK_PEEK - 1),
    '--col': index % DECK_COLS,
    '--row': Math.floor(index / DECK_COLS),
    '--z': count - index
  }
}

/** 展开时按可用宽度平移整片扇面，保证不撑出横向滚动条 */
export function useDeckFanShift(rowRef) {
  const fanShift = ref({})

  function pickFanShift(deckEl, key, count) {
    const row = rowRef.value
    if (!row || !deckEl) return
    const rowRect = row.getBoundingClientRect()
    // 平移量本身是作用在 deckEl 上的 transform，这里先还原成未平移的基准位置再判定，
    // 否则会自己影响自己的判定结果
    const current = parseFloat(fanShift.value[key]) || 0
    const baseLeft = deckEl.getBoundingClientRect().left - current
    const needed = deckFanSize(count).width
    const spaceRight = rowRect.right - baseLeft
    const spaceLeft = baseLeft - rowRect.left
    const shift = Math.round(Math.max(Math.min(0, spaceRight - needed), -Math.max(0, spaceLeft)))
    if (shift !== current) fanShift.value = { ...fanShift.value, [key]: `${shift}px` }
  }

  return { fanShift, pickFanShift }
}
