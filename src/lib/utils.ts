/**
 * 共通ユーティリティ関数
 */

/**
 * 重複しないユニークな名前を生成
 */
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  let counter = 1
  let name = `${baseName}${counter}`
  while (existingNames.includes(name)) {
    counter++
    name = `${baseName}${counter}`
  }
  return name
}

/**
 * バッジ値を正規化（undefined/null を空文字に変換）
 */
export function normalizeBadgeValue(value: string | undefined | null): string {
  return value || ''
}
