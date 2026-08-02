/**
 * VNDB 数据的展示格式化
 *
 * 整块从 VndbPanel.vue 搬出（原 L846-L1031）。全部是无副作用的纯函数：
 * 输入一个 VNDB 原始值，输出给用户看的文案或 Tailwind 类名，与渲染无关，
 * 组件里只剩渲染逻辑。
 *
 * renderDescription 涉及 v-html，转义与 URL 协议白名单的逻辑原样保留 ——
 * 它是这里唯一有安全含义的函数，改动前请确认转义顺序（先转义 & < >，
 * 再还原 BBCode 标签）没有被打乱。
 */

export function formatDate(dateString: string): string {
  if (!dateString) {return '未知'}
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {return dateString}
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}年${month}月${day}日`
}

// 格式化平台名称
export function formatPlatform(platform: string): string {
  const platformMap: Record<string, string> = {
    'win': 'Windows',
    'lin': 'Linux',
    'mac': 'macOS',
    'web': '网页',
    'and': 'Android',
    'ios': 'iOS',
    'dvd': 'DVD',
    'bdp': 'Blu-ray',
    'dos': 'DOS',
    'ps1': 'PlayStation',
    'ps2': 'PlayStation 2',
    'ps3': 'PlayStation 3',
    'ps4': 'PlayStation 4',
    'ps5': 'PlayStation 5',
    'psp': 'PSP',
    'psv': 'PS Vita',
    'xb1': 'Xbox One',
    'xb3': 'Xbox 360',
    'xbs': 'Xbox Series X/S',
    'swi': 'Nintendo Switch',
    'wii': 'Wii',
    'wiu': 'Wii U',
    'n3d': 'Nintendo 3DS',
    'drc': 'Dreamcast',
    'sfc': 'Super Famicom',
    'fm7': 'FM-7',
    'fm8': 'FM-8',
    'msx': 'MSX',
    'nec': 'PC-98',
    'x68': 'X68000',
  }
  
  return platformMap[platform] || platform.toUpperCase()
}

// 格式化语言名称
export function formatLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    'ja': '日语',
    'en': '英语',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
    'zh': '中文',
    'ko': '韩语',
    'ru': '俄语',
    'de': '德语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'pt-br': '葡萄牙语(巴西)',
    'pt-pt': '葡萄牙语',
    'vi': '越南语',
    'th': '泰语',
    'id': '印尼语',
    'pl': '波兰语',
    'tr': '土耳其语',
    'uk': '乌克兰语',
    'cs': '捷克语',
    'hu': '匈牙利语',
    'ar': '阿拉伯语',
  }
  
  return langMap[lang] || lang.toUpperCase()
}

// BBCode 渲染函数（VNDB 格式）
export function renderDescription(text: string): string {
  if (!text) {
    return ''
  }
  
  // 安全 URL 验证函数（只允许 http/https 协议，防止 javascript: XSS）
  const isSafeUrl = (url: string): boolean => {
    const trimmed = url.trim().toLowerCase()
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
  }
  
  const html = text
    // 转义 HTML 特殊字符（防止 XSS）
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 链接 [url=链接]文字[/url]（只允许安全协议）
    .replace(/\[url=([^\]]+)\](.+?)\[\/url\]/gi, (_, url: string, text: string) => {
      return isSafeUrl(url) 
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-theme-primary hover:underline">${text}</a>`
        : text // 不安全 URL 只显示文字
    })
    // 链接 [url]链接[/url]（只允许安全协议）
    .replace(/\[url\](.+?)\[\/url\]/gi, (_, url: string) => {
      return isSafeUrl(url)
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-theme-primary hover:underline">${url}</a>`
        : url // 不安全 URL 只显示原文
    })
    // 粗体 [b]文字[/b]
    .replace(/\[b\](.+?)\[\/b\]/gi, '<strong>$1</strong>')
    // 斜体 [i]文字[/i]
    .replace(/\[i\](.+?)\[\/i\]/gi, '<em>$1</em>')
    // 下划线 [u]文字[/u]
    .replace(/\[u\](.+?)\[\/u\]/gi, '<u>$1</u>')
    // 删除线 [s]文字[/s]
    .replace(/\[s\](.+?)\[\/s\]/gi, '<del>$1</del>')
    // 剧透 [spoiler]文字[/spoiler]
    .replace(/\[spoiler\](.+?)\[\/spoiler\]/gi, '<span class="spoiler-text">$1</span>')
    // 引用 [quote]文字[/quote]
    .replace(/\[quote\](.+?)\[\/quote\]/gis, '<blockquote class="border-l-2 border-theme-primary pl-3 my-2 text-gray-600 dark:text-slate-400 italic">$1</blockquote>')
    // 代码 [code]文字[/code]
    .replace(/\[code\](.+?)\[\/code\]/gis, '<code class="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm">$1</code>')
    // 原始文本 [raw]文字[/raw]
    .replace(/\[raw\](.+?)\[\/raw\]/gis, '$1')
    // 换行保持
    .replace(/\n/g, '<br>')
  
  return html
}

// 计算渲染后的描述

// 格式化开发状态
export function formatDevStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: '已完成',
    1: '开发中',
    2: '已取消',
  }
  return statusMap[status] || '未知'
}

// 获取开发状态颜色
export function getDevStatusColor(status: number): string {
  const colorMap: Record<number, string> = {
    0: 'text-emerald-600 dark:text-emerald-400',
    1: 'text-amber-600 dark:text-amber-400',
    2: 'text-red-600 dark:text-red-400',
  }
  return colorMap[status] || 'text-gray-600 dark:text-gray-400'
}

// 获取标签分类样式
export function getTagCategoryClass(category: string): string {
  const categoryMap: Record<string, string> = {
    'cont': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    'tech': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'ero': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }
  return categoryMap[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
}

// 格式化关系类型
export function formatRelation(relation: string): string {
  const relationMap: Record<string, string> = {
    'seq': '续作',
    'preq': '前作',
    'set': '同一设定',
    'alt': '替代版本',
    'char': '角色共享',
    'side': '外传',
    'par': '父作品',
    'fan': '同人作品',
    'orig': '原作',
    'ser': '同系列',
  }
  return relationMap[relation] || relation
}
