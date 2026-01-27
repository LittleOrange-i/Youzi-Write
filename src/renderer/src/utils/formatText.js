/**
 * 文本格式化工具函数
 * 提供一键排版功能
 */

/**
 * 应用文本格式化
 * @param {string} text - 原始文本
 * @param {object} options - 格式化选项
 * @returns {string} - 格式化后的文本
 */
export function formatText(text, options) {
  let result = text

  // 1. 去掉行尾空白字符
  if (options.removeTrailingSpaces) {
    result = result.replace(/[ \t]+$/gm, '')
  }

  // 2. 去掉行首及行尾空白字符
  if (options.trimLines) {
    result = result.split('\n').map(line => line.trim()).join('\n')
  }

  // 3. 移除所有空格（优先级高，会覆盖其他空格相关设置）
  if (options.removeAllSpaces) {
    result = result.replace(/\s+/g, (match) => {
      // 保留换行符
      return match.includes('\n') ? '\n' : ''
    })
  } else {
    // 4. 合并多个连续空格
    if (options.mergeMultipleSpaces) {
      result = result.replace(/[^\S\n]+/g, ' ')
    }

    // 5. 在中文和英文之间添加一个空格
    if (options.addSpaceBetweenChineseAndEnglish) {
      // 中文后面跟英文
      result = result.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
      // 英文后面跟中文
      result = result.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
    }

    // 6. 去掉中文和英文之间的空格
    if (options.removeSpaceBetweenChineseAndEnglish) {
      // 中文和英文之间的空格
      result = result.replace(/([\u4e00-\u9fa5])\s+([a-zA-Z0-9])/g, '$1$2')
      result = result.replace(/([a-zA-Z0-9])\s+([\u4e00-\u9fa5])/g, '$1$2')
    }
  }

  // 7. 去掉空行（优先级最高）
  if (options.removeAllEmptyLines) {
    result = result.replace(/\n\s*\n/g, '\n')
  } else {
    // 8. 移除文首空行
    if (options.removeLeadingEmptyLines) {
      result = result.replace(/^\s*\n+/, '')
    }

    // 9. 移除文末空行
    if (options.removeTrailingEmptyLines) {
      result = result.replace(/\n\s*\n*$/, '')
    }

    // 10. 移除单独的空行（保留两个及以上空行）
    if (options.removeSingleEmptyLines) {
      // 匹配单个空行，但不匹配多个连续空行
      result = result.replace(/([^\n])\n\s*\n([^\n])/g, '$1\n$2')
    }

    // 11. 合并多个连续空行
    if (options.mergeMultipleEmptyLines) {
      result = result.replace(/\n\s*\n\s*\n+/g, '\n\n')
    }

    // 12. 确保段落之间至少有一个空行
    if (options.ensureEmptyLineBetweenParagraphs) {
      // 匹配非空行后直接跟另一个非空行的情况
      result = result.replace(/([^\n])\n([^\n\s])/g, '$1\n\n$2')
    }
  }

  // 13. 将半角逗号替换为全角逗号
  if (options.replaceHalfWidthComma) {
    result = result.replace(/,/g, '，')
  }

  // 14. 将半角句号替换为全角句号
  if (options.replaceHalfWidthPeriod) {
    result = result.replace(/\./g, '。')
  }

  // 15. 将半角引号替换为全角引号
  if (options.replaceHalfWidthQuotes) {
    let quoteCount = 0
    result = result.replace(/"/g, () => {
      quoteCount++
      return quoteCount % 2 === 1 ? '"' : '"'
    })
  }

  // 16. 引号修正（"aaa" → "aaa"）
  if (options.fixQuotes) {
    // 处理英文引号包裹的内容
    result = result.replace(/"([^"]*)"/g, '"$1"')
  }

  // // 17. 段首缩进 2 个空白字符
  // if (options.indentParagraphs) {
  //   result = result.split('\n').map(line => {
  //     // 只对非空行且不是以空格开头的行添加缩进
  //     if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
  //       return '  ' + line
  //     }
  //     return line
  //   }).join('\n')
  // }

  return result
}

/**
 * 导出格式化选项的默认值
 */
export const defaultFormatOptions = {
  // 空白字符处理
  removeTrailingSpaces: false,
  trimLines: false,
  ensureEmptyLineBetweenParagraphs: false,
  mergeMultipleEmptyLines: false,
  removeLeadingEmptyLines: false,
  removeTrailingEmptyLines: false,
  removeSingleEmptyLines: false,
  removeAllEmptyLines: false,
  mergeMultipleSpaces: false,
  
  // 中英文空格处理
  addSpaceBetweenChineseAndEnglish: false,
  removeSpaceBetweenChineseAndEnglish: false,
  removeAllSpaces: false,
  
  // 标点符号处理
  replaceHalfWidthComma: false,
  replaceHalfWidthPeriod: false,
  replaceHalfWidthQuotes: false,
  fixQuotes: false,
  
  // 段落格式
  indentParagraphs: false
}
