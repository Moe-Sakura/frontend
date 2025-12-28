/**
 * Vite 插件：Service Worker 版本自动注入
 * 
 * 在构建时自动将版本信息注入到 sw.js 中
 * 版本格式：构建时间戳的 base36 编码（如 "m5x7k9a"）
 */

import type { Plugin } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

interface SwVersionPluginOptions {
  /** sw.js 文件路径（相对于 public 目录） */
  swPath?: string
  /** 是否包含 git commit hash */
  includeGitHash?: boolean
  /** 自定义版本前缀 */
  prefix?: string
}

/**
 * 生成版本号
 * 格式：时间戳base36 + 可选的git短hash
 */
function generateVersion(includeGitHash: boolean, prefix: string): string {
  const timestamp = Date.now().toString(36)
  
  let gitHash = ''
  if (includeGitHash) {
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    } catch {
      // git 不可用时忽略
    }
  }
  
  const parts = [prefix, timestamp, gitHash].filter(Boolean)
  return parts.join('-')
}

/**
 * 获取构建信息
 */
function getBuildInfo(): Record<string, string> {
  const info: Record<string, string> = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
  }
  
  try {
    info.gitBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
    info.gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    // git 不可用时忽略
  }
  
  return info
}

export function swVersionPlugin(options: SwVersionPluginOptions = {}): Plugin {
  const {
    swPath = 'sw.js',
    includeGitHash = true,
    prefix = '',
  } = options
  
  let version: string
  let outDir: string
  
  return {
    name: 'sw-version-plugin',
    
    // 配置阶段获取输出目录
    configResolved(config) {
      outDir = config.build.outDir
    },
    
    // 构建开始时生成版本号
    buildStart() {
      version = generateVersion(includeGitHash, prefix)
      const buildInfo = getBuildInfo()
      
      console.info('\n📦 SW Version Plugin')
      console.info(`   Version: ${version}`)
      console.info(`   Build Time: ${buildInfo.buildTime}`)
      if (buildInfo.gitCommit) {
        console.info(`   Git: ${buildInfo.gitBranch}@${buildInfo.gitCommit}`)
      }
      console.info('')
    },
    
    // 构建完成后注入版本到 sw.js
    closeBundle() {
      const swFilePath = resolve(outDir, swPath)
      
      if (!existsSync(swFilePath)) {
        console.warn(`[sw-version-plugin] Warning: ${swPath} not found in ${outDir}`)
        return
      }
      
      let content = readFileSync(swFilePath, 'utf-8')
      
      // 注入版本号
      // 方式1：替换 self.__SW_VERSION__
      content = content.replace(
        /self\.__SW_VERSION__/g,
        `'${version}'`,
      )
      
      // 方式2：替换旧的硬编码版本（如果有）
      content = content.replace(
        /const SW_VERSION = ['"][^'"]*['"]/,
        `const SW_VERSION = '${version}'`,
      )
      
      writeFileSync(swFilePath, content)
      
      console.info(`✅ SW version injected: ${version}`)
    },
  }
}

export default swVersionPlugin

