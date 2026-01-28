<template>
  <Teleport to="body">
    <!-- 设置面板 - 模态框 -->
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 scale-[0.98] translate-y-10"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-[0.98] translate-y-10"
    >
      <div
        v-show="isOpen"
        class="fixed z-[100] flex flex-col settings-page shadow-2xl shadow-black/20 inset-0 md:inset-6 md:m-auto md:w-[800px] md:max-w-[calc(100%-3rem)] md:h-[700px] md:max-h-[calc(100%-3rem)] md:rounded-3xl"
      >
        <!-- 顶部导航栏 -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none md:rounded-t-3xl"
        >
          <!-- 返回按钮 - 仅移动端 -->
          <button
            class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors active:scale-95 md:hidden"
            @click="close"
          >
            <ChevronLeft :size="24" />
            <span class="text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2 md:ml-0">
            <SettingsIcon :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
            <h1 class="text-lg font-bold text-gray-800 dark:text-white">设置</h1>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
            <!-- 保存按钮 -->
            <button
              class="px-4 py-1.5 rounded-full text-white text-sm font-semibold bg-[#ff1493] hover:bg-[#e0117f] active:scale-95 transition-all shadow-lg shadow-pink-500/25"
              @click="save"
            >
              保存
            </button>
          
            <!-- 关闭按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="关闭"
              @click="close"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            <!-- 音效设置卡片 -->
            <div class="settings-card">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                    <Volume2 :size="20" class="text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-gray-800 dark:text-white">音效</h2>
                    <p class="text-sm text-gray-500 dark:text-slate-400">界面交互音效</p>
                  </div>
                </div>
                <!-- 开关 -->
                <button
                  type="button"
                  role="switch"
                  :aria-checked="localEnableSound"
                  :class="[
                    'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    localEnableSound
                      ? 'bg-[#ff1493]'
                      : 'bg-gray-300 dark:bg-slate-600'
                  ]"
                  @click="toggleSound"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      localEnableSound ? 'translate-x-5' : 'translate-x-0'
                    ]"
                  />
                </button>
              </div>
            </div>

            <!-- 搜索历史管理卡片 -->
            <div class="settings-card">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <History :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">搜索历史</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    共 {{ historyStore.historyCount }} 条记录
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <!-- 导出导入按钮 -->
                <div class="flex gap-3">
                  <button
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/60 active:scale-[0.98] transition-all text-sm"
                    @click="exportHistory"
                  >
                    <Download :size="18" />
                    <span>导出记录</span>
                  </button>
                  <button
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950/60 active:scale-[0.98] transition-all text-sm"
                    @click="triggerImport"
                  >
                    <Upload :size="18" />
                    <span>导入记录</span>
                  </button>
                  <!-- 隐藏的文件输入框 -->
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept=".json"
                    class="hidden"
                    @change="handleImportFile"
                  />
                </div>

                <!-- 状态提示 -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 translate-y-1"
                >
                  <div
                    v-if="importStatus !== 'idle'"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                      importStatus === 'success'
                        ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                    ]"
                  >
                    <component
                      :is="importStatus === 'success' ? CheckCircle2 : AlertCircle"
                      :size="16"
                    />
                    <span>{{ importMessage }}</span>
                  </div>
                </Transition>

                <!-- 说明 -->
                <div class="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-gray-500 dark:text-slate-400">
                  <FileJson :size="14" class="flex-shrink-0 mt-0.5 text-amber-500" />
                  <p>导出为 JSON 格式，可用于备份或迁移到其他设备。导入时会自动去重。</p>
                </div>
              </div>
            </div>

            <!-- API 设置卡片 -->
            <div
              class="settings-card"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Server :size="20" class="text-white" />
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-gray-800 dark:text-white">聚搜 API 后端</h2>
                    <p class="text-sm text-gray-500 dark:text-slate-400">选择或自定义 URL 地址</p>
                  </div>
                </div>
                <!-- 部署后端 & 贡献 API 按钮 -->
                <div class="flex items-center gap-2">
                  <a
                    :href="deployUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-95 transition-all"
                    @click="playTap"
                  >
                    <Github :size="14" />
                    <span class="hidden sm:inline">部署后端</span>
                    <span class="sm:hidden">部署</span>
                  </a>
                  <a
                    :href="contributeUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-95 transition-all"
                    @click="playTap"
                  >
                    <Plus :size="14" />
                    <span class="hidden sm:inline">贡献 API</span>
                    <span class="sm:hidden">贡献</span>
                  </a>
                </div>
              </div>

              <!-- API 选项列表 -->
              <div class="space-y-2">
                <button
                  v-for="option in apiOptions"
                  :key="option.value"
                  type="button"
                  :class="[
                    'w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 text-left',
                    selectedApiOption === option.value
                      ? 'bg-gradient-to-r from-[#ff1493]/10 to-[#d946ef]/10 border-2 border-[#ff1493] dark:border-[#ff69b4]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-900'
                  ]"
                  @click="selectApiOption(option.value)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
                        selectedApiOption === option.value
                          ? 'border-[#ff1493] bg-[#ff1493]'
                          : 'border-gray-300 dark:border-slate-600'
                      ]"
                    >
                      <Check v-if="selectedApiOption === option.value" :size="12" class="text-white" />
                    </div>
                    <span
                      :class="[
                        'font-medium text-sm sm:text-base',
                        selectedApiOption === option.value
                          ? 'text-[#ff1493] dark:text-[#ff69b4]'
                          : 'text-gray-700 dark:text-slate-300'
                      ]"
                    >
                      {{ option.label }}
                    </span>
                    <!-- 延迟显示 -->
                    <span 
                      v-if="option.value !== 'custom'"
                      :class="['text-xs font-mono tabular-nums', getLatencyClass(option.value)]"
                    >
                      {{ getLatencyText(option.value) }}
                    </span>
                  </div>
                  <!-- 移动端：URL 显示在第二行；桌面端：显示在右侧靠右 -->
                  <span 
                    v-if="option.value !== 'custom'" 
                    v-text-scroll
                    class="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1.5 sm:mt-0 ml-8 sm:ml-auto sm:text-right truncate max-w-[50%]"
                  >
                    {{ getApiUrl(option.value) }}
                  </span>
                </button>
              </div>

              <!-- 自定义 API 输入 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-40"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-40"
                leave-to-class="opacity-0 max-h-0"
              >
                <div
                  v-if="selectedApiOption === 'custom'"
                  class="overflow-hidden"
                >
                  <div class="mt-4">
                    <div class="relative">
                      <LinkIcon :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        v-model="customApiInput"
                        type="url"
                        placeholder="https://api.example.com"
                        class="api-input w-full pl-12 pr-4 py-4 text-base rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-pink-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-[#ff1493] text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                        @input="handleTyping"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- 自定义代码卡片 - IDE 风格 -->
            <div class="settings-card !p-0 overflow-hidden">
              <!-- IDE 风格顶部栏 -->
              <div class="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3c3c3c]">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Code :size="16" class="text-white" />
                  </div>
                  <div>
                    <h2 class="text-sm font-semibold text-white">自定义代码</h2>
                    <p class="text-xs text-gray-400">CSS · JavaScript · HTML</p>
                  </div>
                </div>
                <!-- 窗口控制按钮装饰 -->
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div class="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div class="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
              </div>

              <!-- IDE 风格 Tab 栏 -->
              <div class="flex bg-[#2d2d2d] border-b border-[#3c3c3c]">
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-r border-[#3c3c3c]',
                    activeCodeTab === 'css'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('css')"
                >
                  <Paintbrush :size="14" :class="activeCodeTab === 'css' ? 'text-[#ff1493]' : 'text-gray-500 group-hover:text-[#ff1493]'" />
                  <span>style.css</span>
                  <div v-if="activeCodeTab === 'css'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1493]" />
                </button>
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-r border-[#3c3c3c]',
                    activeCodeTab === 'js'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('js')"
                >
                  <Terminal :size="14" :class="activeCodeTab === 'js' ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'" />
                  <span>script.js</span>
                  <div v-if="activeCodeTab === 'js'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                </button>
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all',
                    activeCodeTab === 'html'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('html')"
                >
                  <FileCode :size="14" :class="activeCodeTab === 'html' ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'" />
                  <span>custom.html</span>
                  <div v-if="activeCodeTab === 'html'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                </button>
              </div>

              <!-- 编辑器区域 -->
              <div class="relative">
                <!-- CSS 编辑器 -->
                <div v-show="activeCodeTab === 'css'">
                  <PrismEditor
                    v-model="localCustomCSS"
                    :highlight="highlightCSS"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>

                <!-- JS 编辑器 -->
                <div v-show="activeCodeTab === 'js'">
                  <PrismEditor
                    v-model="localCustomJS"
                    :highlight="highlightJS"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>

                <!-- HTML 编辑器 -->
                <div v-show="activeCodeTab === 'html'">
                  <PrismEditor
                    v-model="localCustomHTML"
                    :highlight="highlightHTML"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>
              </div>

              <!-- 底部状态栏 -->
              <div class="flex items-center justify-between px-4 py-1.5 bg-[#007acc] text-white text-xs">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <Info :size="12" />
                    <span v-if="activeCodeTab === 'css'">CSS 样式会覆盖现有样式</span>
                    <span v-else-if="activeCodeTab === 'js'">脚本在页面加载时执行</span>
                    <span v-else>HTML 添加到 body 末尾</span>
                  </span>
                </div>
                <div class="flex items-center gap-3 text-white/80">
                  <span>UTF-8</span>
                  <span v-if="activeCodeTab === 'css'">CSS</span>
                  <span v-else-if="activeCodeTab === 'js'">JavaScript</span>
                  <span v-else>HTML</span>
                </div>
              </div>
            </div>

            <!-- 高级 API 设置卡片 -->
            <div class="settings-card">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Terminal :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">高级 API 设置</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">自定义 VNDB 和 AI 翻译 API</p>
                </div>
              </div>

              <div class="space-y-4">
                <!-- VNDB API Base URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    VNDB API 地址
                  </label>
                  <input
                    v-model="localVndbApiBaseUrl"
                    type="url"
                    placeholder="https://api.vndb.org/kana"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- VNDB Image Proxy URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    VNDB 图片代理地址
                  </label>
                  <input
                    v-model="localVndbImageProxyUrl"
                    type="url"
                    placeholder="https://rp.searchgal.top/"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate API URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译 API 地址
                  </label>
                  <input
                    v-model="localAiTranslateApiUrl"
                    type="url"
                    placeholder="https://ai.searchgal.top/v1/chat/completions"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate API Key -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译 API Key
                  </label>
                  <input
                    v-model="localAiTranslateApiKey"
                    type="password"
                    placeholder="sk-..."
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400 font-mono"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate Model -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译模型
                  </label>
                  <input
                    v-model="localAiTranslateModel"
                    type="text"
                    placeholder="Qwen/Qwen2.5-32B-Instruct"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- Background Image API URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    背景图片 API 地址
                  </label>
                  <input
                    v-model="localBackgroundImageApiUrl"
                    type="url"
                    placeholder="https://api.illlights.com/v1/img"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- Video Parse API URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    视频解析 API 地址
                  </label>
                  <input
                    v-model="localVideoParseApiUrl"
                    type="url"
                    placeholder="https://vp.searchgal.top/"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- 恢复默认按钮 -->
                <button
                  class="w-full px-4 py-2.5 rounded-xl text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-[0.98] transition-all text-sm"
                  @click="resetAdvancedApiSettings"
                >
                  恢复默认值
                </button>
              </div>
            </div>

            <!-- 关于项目卡片 -->
            <div class="settings-card">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Info :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">关于项目</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">开源仓库与贡献</p>
                </div>
              </div>

              <div class="space-y-3">
                <!-- 仓库卡片列表 -->
                <a
                  v-for="repoUrl in repoData.repositories"
                  :key="repoUrl"
                  :href="repoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  @click="playTap"
                >
                  <img
                    v-if="githubHashTimestamp"
                    :src="`https://opengraph.githubassets.com/${githubHashTimestamp}/${getRepoPath(repoUrl)}`"
                    :alt="`${getRepoName(repoUrl)} repository`"
                    class="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full aspect-[2/1] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { playTap, playCelebration, playSelect, playType, playToggleOn, playToggleOff } from '@/composables/useSound'

// Prism Editor
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'

// Prism 语法高亮
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

// CSS 语法高亮函数
function highlightCSS(code: string): string {
  return highlight(code, languages.css, 'css')
}

// JS 语法高亮函数
function highlightJS(code: string): string {
  return highlight(code, languages.javascript, 'javascript')
}

// HTML 语法高亮函数
function highlightHTML(code: string): string {
  return highlight(code, languages.markup, 'markup')
}

// 代码编辑器 Tab 类型
type CodeEditorTab = 'css' | 'js' | 'html'
const activeCodeTab = ref<CodeEditorTab>('css')

function switchCodeTab(tab: CodeEditorTab) {
  playTap()
  activeCodeTab.value = tab
}

// 打字音效节流
let lastTypingSound = 0
const TYPING_THROTTLE = 80

function handleTyping() {
  const now = Date.now()
  if (now - lastTypingSound >= TYPING_THROTTLE) {
    playType()
    lastTypingSound = now
  }
}
import {
  Settings as SettingsIcon,
  ChevronLeft,
  Paintbrush,
  Info,
  Server,
  Link as LinkIcon,
  Terminal,
  Code,
  FileCode,
  Check,
  Github,
  X,
  Plus,
  Volume2,
  Download,
  Upload,
  History,
  FileJson,
  AlertCircle,
  CheckCircle2,
} from 'lucide-vue-next'
import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'
import { useHistoryStore } from '@/stores/history'
import type { SearchHistory } from '@/utils/persistence'
import apiData from '@/data/api.json'
import repoData from '@/data/repository-opengraph.json'

const settingsStore = useSettingsStore()
const historyStore = useHistoryStore()

// GitHub 关于项目相关
const githubHashTimestamp = ref('')

// 生成 SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 获取当前日期的 YYMMDD 格式
function getDateString(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

// 初始化 GitHub hash
async function initGitHubHash() {
  const dateStr = getDateString()
  githubHashTimestamp.value = await sha256(dateStr)
}

// 从 GitHub URL 提取 owner/repo 路径
function getRepoPath(url: string): string {
  // https://github.com/Moe-Sakura/frontend -> Moe-Sakura/frontend
  return url.replace('https://github.com/', '')
}

// 从 GitHub URL 提取仓库名
function getRepoName(url: string): string {
  // https://github.com/Moe-Sakura/frontend -> frontend
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 组件挂载时初始化
void initGitHubHash()

// 导入导出状态
const importStatus = ref<'idle' | 'success' | 'error'>('idle')
const importMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// 导出搜索历史为 JSON
function exportHistory() {
  playTap()
  
  const history = historyStore.searchHistory
  if (history.length === 0) {
    importStatus.value = 'error'
    importMessage.value = '暂无搜索历史可导出'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
    return
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'SearchGal',
    count: history.length,
    history: history,
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `searchgal-history-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  playCelebration()
  importStatus.value = 'success'
  importMessage.value = `已导出 ${history.length} 条搜索记录`
  setTimeout(() => {
    importStatus.value = 'idle'
  }, 3000)
}

// 触发文件选择
function triggerImport() {
  playTap()
  fileInputRef.value?.click()
}

// 处理导入文件
function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) {return}
  
  // 重置 input 以便可以选择相同文件
  input.value = ''
  
  if (!file.name.endsWith('.json')) {
    importStatus.value = 'error'
    importMessage.value = '请选择 .json 格式的文件'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      
      // 验证数据格式
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('无效的文件格式')
      }
      
      // 验证每条记录
      const validHistory: SearchHistory[] = []
      for (const item of data.history) {
        if (
          typeof item.query === 'string' &&
          (item.mode === 'game' || item.mode === 'patch') &&
          typeof item.timestamp === 'number' &&
          typeof item.resultCount === 'number'
        ) {
          validHistory.push({
            query: item.query,
            mode: item.mode,
            timestamp: item.timestamp,
            resultCount: item.resultCount,
          })
        }
      }
      
      if (validHistory.length === 0) {
        throw new Error('文件中没有有效的搜索记录')
      }
      
      // 使用 store 的 importHistory 方法（自动去重、排序、保存）
      const importedCount = historyStore.importHistory(validHistory)
      
      playCelebration()
      importStatus.value = 'success'
      importMessage.value = `成功导入 ${importedCount} 条新记录（共 ${validHistory.length} 条）`
      setTimeout(() => {
        importStatus.value = 'idle'
      }, 3000)
    } catch (error) {
      importStatus.value = 'error'
      importMessage.value = error instanceof Error ? error.message : '导入失败'
      setTimeout(() => {
        importStatus.value = 'idle'
      }, 3000)
    }
  }
  
  reader.onerror = () => {
    importStatus.value = 'error'
    importMessage.value = '读取文件失败'
    setTimeout(() => {
      importStatus.value = 'idle'
    }, 3000)
  }
  
  reader.readAsText(file)
}

const props = defineProps<{
  isOpen: boolean
  customApi: string
  customCSS: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string, customCSS: string]
}>()

// API 服务器选项 - 从 JSON 读取
const apiOptions = [
  ...apiData.servers.map(server => ({ value: server.key, label: server.label })),
  { value: 'custom', label: '自定义' },
]

// API URL 映射 - 从 JSON 读取
const apiUrls: Record<string, string> = Object.fromEntries(
  apiData.servers.map(server => [server.key, server.url]),
)

// 部署后端 & 贡献 API 的 URL
const deployUrl = apiData.deployUrl
const contributeUrl = apiData.contributeUrl

// 默认 API 服务器 key（第一个）
const defaultApiKey = apiData.servers[0]?.key || 'custom'

// 根据 URL 判断选中的选项
function getOptionFromUrl(url: string): string {
  // 空 URL 或匹配第一个服务器（默认）
  if (!url || url === apiUrls[defaultApiKey]) {
    return defaultApiKey
  }
  // 遍历查找匹配的服务器
  for (const [key, serverUrl] of Object.entries(apiUrls)) {
    if (url === serverUrl) {
      return key
    }
  }
  return 'custom'
}

// API 延迟测量
const apiLatencies = ref<Record<string, number | null | 'error'>>({})

// 测量单个 API 延迟（使用 no-cors 模式绕过 CORS 限制）
async function measureApiLatency(apiKey: string): Promise<void> {
  const url = apiUrls[apiKey]
  if (!url) { return }
  
  apiLatencies.value[apiKey] = null // 测量中
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    const start = Date.now()
    // no-cors 模式：无法读取响应内容，但可以测量网络延迟
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })
    const end = Date.now()
    
    clearTimeout(timeoutId)
    
    // 请求完成即视为成功（no-cors 模式无法读取状态码）
    apiLatencies.value[apiKey] = Math.round(end - start)
  } catch {
    apiLatencies.value[apiKey] = 'error'
  }
}

// 测量所有 API 延迟
function measureAllApiLatencies() {
  const keys = Object.keys(apiUrls)
  keys.forEach((key) => {
    void measureApiLatency(key)
  })
}

// 获取延迟显示文本
function getLatencyText(apiKey: string): string {
  const latency = apiLatencies.value[apiKey]
  if (latency === undefined || latency === null) {
    return '...'
  }
  if (latency === 'error') {
    return '超时'
  }
  return `${latency}ms`
}

// 获取延迟颜色类
function getLatencyClass(apiKey: string): string {
  const latency = apiLatencies.value[apiKey]
  if (latency === undefined || latency === null) {
    return 'text-gray-400 dark:text-slate-500'
  }
  if (latency === 'error') {
    return 'text-red-500 dark:text-red-400'
  }
  if (latency < 100) {
    return 'text-green-500 dark:text-green-400'
  }
  if (latency < 300) {
    return 'text-yellow-500 dark:text-yellow-400'
  }
  return 'text-orange-500 dark:text-orange-400'
}

// 获取 API URL
function getApiUrl(option: string): string {
  return apiUrls[option] || ''
}

const selectedApiOption = ref(getOptionFromUrl(props.customApi))
const customApiInput = ref(
  selectedApiOption.value === 'custom' ? props.customApi : '',
)
const localCustomCSS = ref(props.customCSS)
const localCustomJS = ref(settingsStore.settings.customJS)
const localCustomHTML = ref(settingsStore.settings.customHTML)

// 高级 API 设置状态
const localVndbApiBaseUrl = ref(settingsStore.settings.vndbApiBaseUrl)
const localVndbImageProxyUrl = ref(settingsStore.settings.vndbImageProxyUrl)
const localAiTranslateApiUrl = ref(settingsStore.settings.aiTranslateApiUrl)
const localAiTranslateApiKey = ref(settingsStore.settings.aiTranslateApiKey)
const localAiTranslateModel = ref(settingsStore.settings.aiTranslateModel)
const localBackgroundImageApiUrl = ref(settingsStore.settings.backgroundImageApiUrl)
const localVideoParseApiUrl = ref(settingsStore.settings.videoParseApiUrl)

// 音效设置
const localEnableSound = ref(settingsStore.settings.enableSound)

// 切换音效
function toggleSound() {
  localEnableSound.value = !localEnableSound.value
  // 播放对应的开关音效
  if (localEnableSound.value) {
    // 临时启用音效来播放开启音
    settingsStore.updateSetting('enableSound', true)
    playToggleOn()
  } else {
    playToggleOff()
    // 延迟关闭，让关闭音效播放完
    setTimeout(() => {
      settingsStore.updateSetting('enableSound', false)
    }, 150)
  }
}

// 计算最终的 API 地址
const localCustomApi = computed(() => {
  if (selectedApiOption.value === 'custom') {
    return customApiInput.value
  }
  if (selectedApiOption.value === defaultApiKey) {
    return '' // 空字符串表示使用默认
  }
  return apiUrls[selectedApiOption.value] || ''
})

// 选择 API 选项
function selectApiOption(option: string) {
  playSelect()
  selectedApiOption.value = option
  if (option !== 'custom') {
    customApiInput.value = ''
  }
}

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  selectedApiOption.value = getOptionFromUrl(newValue)
  if (selectedApiOption.value === 'custom') {
    customApiInput.value = newValue
  }
})

watch(() => props.customCSS, (newValue) => {
  localCustomCSS.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedApiOption.value = getOptionFromUrl(props.customApi)
    customApiInput.value = selectedApiOption.value === 'custom' ? props.customApi : ''
    localCustomCSS.value = props.customCSS
    localCustomJS.value = settingsStore.settings.customJS
    localCustomHTML.value = settingsStore.settings.customHTML
    // 同步高级 API 设置
    localVndbApiBaseUrl.value = settingsStore.settings.vndbApiBaseUrl
    localVndbImageProxyUrl.value = settingsStore.settings.vndbImageProxyUrl
    localAiTranslateApiUrl.value = settingsStore.settings.aiTranslateApiUrl
    // 异步测量 API 延迟（不阻塞面板打开）
    setTimeout(measureAllApiLatencies, 100)
    localAiTranslateApiKey.value = settingsStore.settings.aiTranslateApiKey
    localAiTranslateModel.value = settingsStore.settings.aiTranslateModel
    localBackgroundImageApiUrl.value = settingsStore.settings.backgroundImageApiUrl
    localVideoParseApiUrl.value = settingsStore.settings.videoParseApiUrl
    // 同步音效设置
    localEnableSound.value = settingsStore.settings.enableSound
  }
}, { immediate: true })

function close() {
  playTap()
  emit('close')
}

function save() {
  playCelebration()
  // 保存高级 API 设置和自定义脚本/HTML
  settingsStore.updateSettings({
    customJS: localCustomJS.value,
    customHTML: localCustomHTML.value,
    vndbApiBaseUrl: localVndbApiBaseUrl.value,
    vndbImageProxyUrl: localVndbImageProxyUrl.value,
    aiTranslateApiUrl: localAiTranslateApiUrl.value,
    aiTranslateApiKey: localAiTranslateApiKey.value,
    aiTranslateModel: localAiTranslateModel.value,
    backgroundImageApiUrl: localBackgroundImageApiUrl.value,
    videoParseApiUrl: localVideoParseApiUrl.value,
  })
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

function resetAdvancedApiSettings() {
  playTap()
  localVndbApiBaseUrl.value = DEFAULT_API_CONFIG.vndbApiBaseUrl
  localVndbImageProxyUrl.value = DEFAULT_API_CONFIG.vndbImageProxyUrl
  localAiTranslateApiUrl.value = DEFAULT_API_CONFIG.aiTranslateApiUrl
  localAiTranslateApiKey.value = DEFAULT_API_CONFIG.aiTranslateApiKey
  localAiTranslateModel.value = DEFAULT_API_CONFIG.aiTranslateModel
  localBackgroundImageApiUrl.value = DEFAULT_API_CONFIG.backgroundImageApiUrl
  localVideoParseApiUrl.value = DEFAULT_API_CONFIG.videoParseApiUrl
}
</script>

<style>
/* 设置面板 - 半透明效果 */
.settings-page {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .settings-page {
    border-bottom: none;
  }
}

/* 设置面板 - 暗色模式 */
.dark .settings-page {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 设置卡片 - 亮色模式 */
.settings-card {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card-inner, 0.75));
  border-radius: var(--radius-xl, 1.25rem);
  padding: var(--spacing-lg, 1.25rem);
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.08));
}

/* 设置卡片 - 暗色模式 */
.dark .settings-card {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-card-inner-dark, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff1493, #d946ef);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c71585, #c026d3);
}

/* 输入框选中样式 */
.api-input,
.css-input {
  user-select: text;
  -webkit-user-select: text;
}

.api-input::selection,
.css-input::selection {
  background-color: rgba(255, 20, 147, 0.3);
}

/* IDE 风格代码编辑器 */
.code-editor {
  font-family: Consolas, "Monaco", "JetBrains Mono", "Fira Code", monospace !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  min-height: 240px !important;
  max-height: 360px !important;
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  caret-color: #aeafad !important;
  tab-size: 2 !important;
  /* 外层容器只处理垂直滚动 */
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* 禁止代码换行 */
.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor,
.code-editor pre,
.code-editor code {
  white-space: pre !important;
  word-wrap: normal !important;
  overflow-wrap: normal !important;
}

/* 让编辑器填满整个区域，点击空白处也能聚焦 */
.code-editor .prism-editor__container {
  min-height: 220px !important;
  /* 容器启用水平滚动 */
  overflow-x: auto !important;
  overflow-y: visible !important;
}

.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor {
  min-height: 220px !important;
  outline: none !important;
  /* 编辑区域内容不换行 */
  min-width: max-content !important;
}

.code-editor .prism-editor__textarea:focus {
  outline: none !important;
}

/* 行号样式 - VS Code 风格 */
.code-editor .prism-editor__line-numbers {
  padding: 0 1rem 0 0.5rem !important;
  background: #1e1e1e !important;
  color: #858585 !important;
  user-select: none !important;
  text-align: right !important;
  min-width: 2.5rem !important;
  border-right: none !important;
  margin-right: 0 !important;
}

/* 当前行高亮 */
.code-editor .prism-editor__line-number {
  transition: color 0.1s;
}

/* VS Code Dark+ 主题色 */
.code-editor .token.selector {
  color: #d7ba7d !important;
}

.code-editor .token.property {
  color: #9cdcfe !important;
}

.code-editor .token.punctuation {
  color: #d4d4d4 !important;
}

.code-editor .token.string {
  color: #ce9178 !important;
}

.code-editor .token.number,
.code-editor .token.unit {
  color: #b5cea8 !important;
}

.code-editor .token.function {
  color: #dcdcaa !important;
}

.code-editor .token.comment {
  color: #6a9955 !important;
  font-style: italic;
}

.code-editor .token.atrule,
.code-editor .token.keyword {
  color: #c586c0 !important;
}

.code-editor .token.important {
  color: #569cd6 !important;
}

.code-editor .token.tag {
  color: #569cd6 !important;
}

.code-editor .token.attr-name {
  color: #9cdcfe !important;
}

.code-editor .token.attr-value {
  color: #ce9178 !important;
}

/* 选中文本样式 - VS Code 风格 */
.code-editor .prism-editor__textarea::selection,
.code-editor .prism-editor__editor *::selection {
  background-color: #264f78 !important;
}

/* VS Code 风格滚动条 */
.code-editor::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-editor::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-editor::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 0;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}

.code-editor::-webkit-scrollbar-corner {
  background: #1e1e1e;
}
</style>
