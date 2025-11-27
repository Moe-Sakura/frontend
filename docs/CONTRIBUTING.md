# 贡献指南

感谢你考虑为 SearchGal Frontend 做出贡献！

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue 并包含以下信息：

1. **Bug 描述** - 清晰简洁地描述问题
2. **复现步骤** - 详细的步骤来复现问题
3. **预期行为** - 你期望发生什么
4. **实际行为** - 实际发生了什么
5. **环境信息** - 浏览器版本、操作系统等
6. **截图** - 如果适用，添加截图帮助解释问题

### 提出新功能

如果你有新功能的想法：

1. 先检查 [Issues](https://github.com/Moe-Sakura/frontend/issues) 看是否已有类似建议
2. 创建一个新的 Issue，标记为 `enhancement`
3. 详细描述功能的用途和实现思路
4. 等待维护者的反馈

### 提交代码

#### 开发流程

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/frontend.git
   cd frontend
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/Moe-Sakura/frontend.git
   ```

4. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

5. **安装依赖**
   ```bash
   pnpm install
   ```

6. **开发**
   ```bash
   pnpm run dev
   ```

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add some feature"
   ```

8. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述

#### Commit 规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响代码运行的变动）
- `refactor:` - 重构（既不是新增功能，也不是修改 bug 的代码变动）
- `perf:` - 性能优化
- `test:` - 增加测试
- `chore:` - 构建过程或辅助工具的变动

示例：
```
feat: add search history feature
fix: resolve background image loading issue
docs: update README with new API endpoints
style: format code with prettier
refactor: extract search logic to separate module
perf: optimize image caching strategy
```

## 📝 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为函数参数和返回值添加类型注解
- 避免使用 `any` 类型
- 使用接口（interface）定义数据结构

```typescript
// ✅ 好的示例
interface SearchResult {
  platform: string
  title: string
  url: string
  tags?: string[]
}

function searchGame(query: string): Promise<SearchResult[]> {
  // ...
}

// ❌ 不好的示例
function searchGame(query: any): any {
  // ...
}
```

### Vue 组件

- 使用 Vue 3 Composition API
- 使用 `<script setup>` 语法
- 组件名使用 PascalCase
- Props 和 Emits 使用 TypeScript 类型

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  update: [value: string]
}>()
</script>
```

### CSS/Tailwind

- 优先使用 Tailwind CSS 工具类
- 自定义样式使用 `<style scoped>`
- 避免使用内联样式
- 使用语义化的类名

```vue
<!-- ✅ 好的示例 -->
<template>
  <div class="flex items-center gap-2 p-4 rounded-lg bg-white shadow-md">
    <span class="text-gray-700 font-medium">{{ title }}</span>
  </div>
</template>

<!-- ❌ 不好的示例 -->
<template>
  <div style="display: flex; padding: 16px;">
    <span>{{ title }}</span>
  </div>
</template>
```

### 文件命名

- 组件文件：`PascalCase.vue` (例如：`SearchHeader.vue`)
- 工具函数：`camelCase.ts` (例如：`imageDB.ts`)
- 类型定义：`camelCase.d.ts` (例如：`pace-js.d.ts`)
- 常量文件：`UPPER_CASE.ts` (例如：`API_CONSTANTS.ts`)

### 目录结构

```
src/
├── api/              # API 接口
├── components/       # Vue 组件
├── stores/           # Pinia 状态管理
├── utils/            # 工具函数
├── types/            # TypeScript 类型定义
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 🧪 测试

目前项目还没有测试，但我们欢迎添加测试的贡献：

- 单元测试使用 Vitest
- 组件测试使用 Vue Test Utils
- E2E 测试使用 Playwright

## 📚 文档

- 为新功能添加文档
- 更新 README.md
- 添加代码注释（特别是复杂逻辑）
- 使用 JSDoc 注释函数

```typescript
/**
 * 搜索游戏资源
 * @param query - 搜索关键词
 * @param mode - 搜索模式（game 或 patch）
 * @returns Promise<SearchResult[]>
 */
async function searchGame(query: string, mode: 'game' | 'patch'): Promise<SearchResult[]> {
  // ...
}
```

## ✅ Pull Request 检查清单

在提交 PR 之前，请确保：

- [ ] 代码遵循项目的代码规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 代码可以正常运行
- [ ] 没有引入新的 lint 错误
- [ ] Commit 信息符合规范
- [ ] PR 描述清晰，说明了改动内容

## 🎯 开发建议

### 性能优化

- 使用 `computed` 而不是 `watch` 来计算派生状态
- 避免不必要的响应式数据
- 使用 `v-memo` 优化列表渲染
- 图片使用懒加载

### 用户体验

- 添加加载状态指示
- 提供错误提示
- 使用平滑的过渡动画
- 确保响应式设计

### 代码质量

- 保持函数简短（< 50 行）
- 单一职责原则
- 避免深层嵌套
- 使用有意义的变量名

## 💬 交流

- GitHub Issues - 报告 Bug 和功能请求
- GitHub Discussions - 一般讨论和问题

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🎉

