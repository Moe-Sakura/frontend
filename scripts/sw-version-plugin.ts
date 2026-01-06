/**
 * Vite 插件：Service Worker 版本注入
 * 构建时自动将版本号注入到 sw.js
 */

import type { Plugin } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

interface Options {
  /** sw.js 路径（相对于输出目录） */
  swPath?: string
  /** 是否包含 git commit hash */
  includeGitHash?: boolean
}

/** 获取 git 短 hash，失败返回空 */
function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

/** 生成版本号：时间戳base36[-gitHash] */
function generateVersion(includeGitHash: boolean): string {
  const timestamp = Date.now().toString(36)
  const gitHash = includeGitHash ? getGitHash() : ''
  return gitHash ? `${timestamp}-${gitHash}` : timestamp
}

export function swVersionPlugin(options: Options = {}): Plugin {
  const { swPath = 'sw.js', includeGitHash = true } = options
  
  let version = ''
  let outDir = 'dist'
  
  return {
    name: 'sw-version',
    
    configResolved(config) {
      outDir = config.build.outDir
    },
    
    buildStart() {
      version = generateVersion(includeGitHash)
      console.info(`\n📦 SW Version: ${version}\n`)
    },
    
    closeBundle() {
      const filePath = resolve(outDir, swPath)
      
      if (!existsSync(filePath)) {
        console.warn(`[sw-version] ${swPath} not found`)
        return
      }
      
      // 替换版本占位符
      const content = readFileSync(filePath, 'utf-8')
        .replace(/self\.__SW_VERSION__/g, `'${version}'`)
      
      writeFileSync(filePath, content)
      console.info(`✅ SW version: ${version}`)
    },
  }
}

export default swVersionPlugin
