/**
 * 消息格式化工具
 * 将 AI 回复的 markdown 文本转换为干净的聊天消息格式
 */

/**
 * 格式化助手消息 - 移除 markdown 残留，输出干净的聊天文本
 * @param text 原始文本
 * @returns 格式化后的干净文本
 */
export function formatAssistantMessage(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. 移除代码围栏 ``` 和 ```
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    // 提取代码块内容，去除语言标识
    const code = match.replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
    return code || '';
  });

  // 2. 移除行内代码 `...`
  result = result.replace(/`([^`]+)`/g, '$1');

  // 3. 移除加粗和斜体标记
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');  // **加粗**
  result = result.replace(/__([^_]+)__/g, '$1');       // __加粗__
  result = result.replace(/\*([^*]+)\*/g, '$1');       // *斜体*
  result = result.replace(/_([^_]+)_/g, '$1');          // _斜体_

  // 4. 移除标题 # ## ###
  result = result.replace(/^#{1,6}\s+/gm, '');

  // 5. 移除水平线 --- 或 *** 或 ___
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // 6. 移除 markdown 表格分隔符行 |---|:---|---|
  result = result.replace(/^\|?[\s:\-\|]+\|?\s*$/gm, '');

  // 7. 移除链接 [text](url)，保留文字
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 8. 清理列表前多余空格，保持缩进
  result = result.replace(/^(\s*)([-*+]\s+)/gm, '$2');  // - 列表
  result = result.replace(/^(\s*)(\d+\.)\s+/gm, '$2 ');  // 1. 列表

  // 9. 把连续 3 个以上空行压缩成 1 个
  result = result.replace(/\n{4,}/g, '\n\n\n');
  result = result.replace(/\n{3}/g, '\n\n');

  // 10. 移除每行末尾的多余空格
  result = result.split('\n').map(line => line.trimEnd()).join('\n');

  // 11. 移除开头和结尾的空白
  result = result.trim();

  return result;
}

/**
 * 检查文本是否为表格格式
 * @param text 文本
 * @returns 是否为表格
 */
export function isTableFormat(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim());

  // | 分隔的表格
  const hasPipeTable = lines.length >= 2 && lines.some(line => {
    const cells = line.split('|').filter(c => c.trim());
    return line.includes('|') && cells.length >= 2;
  });

  // 空格分隔的表格（每行有多个连续空格分隔的列）
  const hasSpaceTable = lines.length >= 2 && lines.every(line => {
    const parts = line.trim().split(/\s{2,}/);
    return parts.length >= 2;
  });

  return hasPipeTable || hasSpaceTable;
}

/**
 * 解析表格为二维数组
 * @param text 表格文本
 * @returns 二维数组
 */
export function parseTable(text: string): string[][] {
  // 过滤掉分隔符行 (如 |---|:---|)
  const lines = text.split('\n').filter(l => {
    const trimmed = l.trim();
    // 跳过空的或只有分隔符的行
    if (!trimmed) return false;
    // 跳过 markdown 表格分隔符行
    if (trimmed.match(/^[\|:\-\s]+$/)) return false;
    return true;
  });

  if (lines.length === 0) return [];

  // 检测表格格式：优先检查第一行是否包含 |
  const firstRow = lines[0];
  const usePipeFormat = firstRow.includes('|');

  return lines.map(line => {
    if (usePipeFormat && line.includes('|')) {
      // | 分割的表格
      return line.split('|').filter(c => c.trim());
    } else {
      // 空格分割的表格
      return line.trim().split(/\s{2,}/).filter(c => c.trim());
    }
  });
}

/**
 * 解析属性-值格式
 * @param text 文本
 * @returns 是否为属性-值格式
 */
export function isKeyValueFormat(text: string): boolean {
  const lines = text.split('\n');
  if (lines.length <= 1) return false;

  return lines.every(line => {
    const trimmed = line.trim();
    return /^[\u4e00-\u9fa5a-zA-Z]+[:：]\s*/.test(trimmed);
  });
}

/**
 * 提取属性-值对
 * @param text 属性-值格式文本
 * @returns 属性-值数组
 */
export function parseKeyValue(text: string): { key: string; value: string }[] {
  const lines = text.split('\n');
  return lines.map(line => {
    const match = line.trim().match(/^([\u4e00-\u9fa5a-zA-Z]+[:：]\s*)(.*)$/);
    if (match) {
      return { key: match[1].trim(), value: match[2].trim() };
    }
    return { key: '', value: line.trim() };
  }).filter(item => item.key);
}

export default {};