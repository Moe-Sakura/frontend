<!-- eslint-disable vue/no-v-html -->
<template>
  <Teleport to="body">
    <!-- VNDB 信息面板 - 模态框 -->
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 scale-[0.98] translate-y-10"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-[0.98] translate-y-10"
    >
      <div
        v-show="uiStore.isVndbPanelOpen && searchStore.vndbInfo"
        ref="modalRef"
        class="fixed z-50 flex flex-col vndb-page shadow-2xl shadow-black/20 inset-0 md:inset-6 md:m-auto md:w-[900px] md:max-w-[calc(100%-3rem)] md:h-[800px] md:max-h-[calc(100%-3rem)] md:rounded-3xl"
      >
        <!-- 顶部导航栏 -->
        <div 
          class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none md:rounded-t-3xl"
        >
          <!-- 返回按钮 - 移动端 -->
          <button
            class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors hover:opacity-80 md:hidden"
            @click="closePanel"
          >
            <ChevronLeft :size="24" />
            <span class="text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2 md:ml-0">
            <BookOpen :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
            <h1 class="text-lg font-bold text-gray-800 dark:text-white">作品介绍</h1>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
            <!-- 一键翻译按钮 -->
            <button
              v-if="!hasAnyTranslation"
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              :class="isTranslatingAll 
                ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-wait' 
                : 'text-white bg-violet-500 hover:bg-violet-600'"
              :disabled="isTranslatingAll"
              @click="handleTranslateAll"
            >
              <Loader v-if="isTranslatingAll" :size="14" class="animate-spin" />
              <Bot v-else :size="14" />
              <span class="hidden sm:inline">{{ isTranslatingAll ? '翻译中...' : 'AI 翻译' }}</span>
            </button>
            <!-- 翻译完成后的切换按钮 -->
            <button
              v-else
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
              @click="toggleAllTranslations"
            >
              <ArrowLeftRight :size="14" />
              <span class="hidden sm:inline">{{ showOriginal ? '译文' : '原文' }}</span>
            </button>
            
            <!-- VNDB 链接按钮 -->
            <a
              :href="vndbUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-[#ff1493] hover:bg-[#e6007f]"
            >
              <ExternalLink :size="14" />
              <span class="hidden sm:inline">VNDB</span>
            </a>
          
            <!-- 关闭按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="关闭"
              @click="closePanel"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
            <!-- 顶部：封面和基本信息（横向排列） -->
            <div class="vndb-card !p-4">
              <div class="flex flex-col sm:flex-row gap-4">
                <!-- 封面图 -->
                <div v-if="searchStore.vndbInfo.mainImageUrl" class="sm:w-40 md:w-48 flex-shrink-0">
                  <button
                    class="block w-full"
                    @click="openGallery(0)"
                  >
                    <img
                      :src="searchStore.vndbInfo.mainImageUrl"
                      :alt="searchStore.vndbInfo.mainName"
                      class="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all"
                      loading="lazy"
                      @error="handleImageError"
                    />
                  </button>
                </div>

                <!-- 标题和基本信息 -->
                <div class="flex-1 min-w-0">
                  <!-- 标题 -->
                  <h2 class="text-xl font-bold text-gray-800 dark:text-white leading-tight mb-1">
                    {{ searchStore.vndbInfo.mainName }}
                  </h2>
                  <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 dark:text-slate-400 mb-0.5">
                    {{ searchStore.vndbInfo.originalTitle }}
                  </p>
                  <p v-if="searchStore.vndbInfo.alttitle && searchStore.vndbInfo.alttitle !== searchStore.vndbInfo.originalTitle" class="text-xs text-gray-400 dark:text-slate-500 italic mb-3">
                    {{ searchStore.vndbInfo.alttitle }}
                  </p>
                  
                  <!-- 别名标签 -->
                  <div v-if="searchStore.vndbInfo.names.length > 1" class="flex flex-wrap gap-1.5 mb-4">
                    <span
                      v-for="(name, index) in (expandedSections.names ? searchStore.vndbInfo.names : searchStore.vndbInfo.names.slice(0, 4))"
                      :key="index"
                      class="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-[#ff1493] dark:text-[#ff69b4] text-xs rounded-full"
                    >
                      {{ name }}
                    </span>
                    <button
                      v-if="searchStore.vndbInfo.names.length > 4"
                      class="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      @click="toggleSection('names')"
                    >
                      {{ expandedSections.names ? '收起' : `+${searchStore.vndbInfo.names.length - 4}` }}
                    </button>
                  </div>

                  <!-- 基本信息网格 -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <!-- 评分 -->
                    <div v-if="searchStore.vndbInfo.rating" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <Star :size="14" class="text-white" />
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">评分</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">
                          {{ (searchStore.vndbInfo.rating / 10).toFixed(1) }}
                          <span class="text-[10px] font-normal text-gray-400">({{ searchStore.vndbInfo.votecount }})</span>
                        </p>
                      </div>
                    </div>

                    <!-- 游戏时长 -->
                    <div v-if="searchStore.vndbInfo.play_hours" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                        <Clock :size="14" class="text-white" />
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">时长</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">{{ searchStore.vndbInfo.play_hours }}h</p>
                      </div>
                    </div>

                    <!-- 发行日期 -->
                    <div v-if="searchStore.vndbInfo.released" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                        <Calendar :size="14" class="text-white" />
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">发行</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">{{ formatDate(searchStore.vndbInfo.released) }}</p>
                      </div>
                    </div>

                    <!-- 开发商 -->
                    <div v-if="searchStore.vndbInfo.developers && searchStore.vndbInfo.developers.length > 0" class="flex items-center gap-2 col-span-2 sm:col-span-1">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                        <Building :size="14" class="text-white" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">开发商</p>
                        <p v-text-scroll class="text-sm font-bold text-gray-800 dark:text-white">
                          {{ searchStore.vndbInfo.developers.map(d => d.name).join(', ') }}
                        </p>
                      </div>
                    </div>

                    <!-- 开发状态 -->
                    <div v-if="searchStore.vndbInfo.devstatus !== undefined" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                        <Gamepad2 :size="14" class="text-white" />
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">状态</p>
                        <p class="text-sm font-bold" :class="getDevStatusColor(searchStore.vndbInfo.devstatus)">
                          {{ formatDevStatus(searchStore.vndbInfo.devstatus) }}
                        </p>
                      </div>
                    </div>

                    <!-- 原始语言 -->
                    <div v-if="searchStore.vndbInfo.olang" class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
                        <Globe :size="14" class="text-white" />
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-slate-400">语言</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">{{ formatLanguage(searchStore.vndbInfo.olang) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- 标签 -->
                  <div v-if="searchStore.vndbInfo.tags && searchStore.vndbInfo.tags.length > 0" class="mt-4 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <Tag :size="14" class="text-violet-500" />
                        <span class="text-xs font-bold text-gray-800 dark:text-white">标签</span>
                        <Loader v-if="isTranslatingTags" :size="10" class="animate-spin text-violet-500" />
                        <!-- AI 译文标签 -->
                        <div 
                          v-if="translatedTags.size > 0 && !showOriginalTags" 
                          class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[9px] rounded-full"
                        >
                          <Bot :size="8" />
                          <span>AI</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 text-[9px] text-gray-400 dark:text-slate-500">
                        <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-violet-500" />内容</span>
                        <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500" />技术</span>
                        <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />色情</span>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="(tag, index) in searchStore.vndbInfo.tags"
                        :key="index"
                        class="px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors cursor-default"
                        :class="getTagCategoryClass(tag.category || '')"
                        :title="`${tag.name}${translatedTags.get(tag.name) ? ' → ' + translatedTags.get(tag.name) : ''} | 相关性: ${Math.round((tag.rating || 0) * 10) / 10}`"
                      >
                        {{ getTagDisplayName(tag) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 详细内容 -->
            <!-- 简介（优先展示） -->
            <div v-if="searchStore.vndbInfo.description" class="vndb-card !p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <AlignLeft :size="16" class="text-[#ff1493]" />
                  <h3 class="text-sm font-bold text-gray-800 dark:text-white">简介</h3>
                  <Loader v-if="isTranslating" :size="12" class="animate-spin text-[#ff1493]" />
                </div>
                <!-- AI 译文标签 - 右上角 -->
                <div 
                  v-if="translatedDescription && !showOriginal" 
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white text-[10px] rounded-full"
                >
                  <Bot :size="10" />
                  <span>AI 译文</span>
                </div>
              </div>
              <div 
                class="text-sm text-gray-700 dark:text-slate-300 leading-relaxed prose-description"
                v-html="renderedDescription"
              />
            </div>

            <!-- 语言和平台（合并为一行） -->
            <div 
              v-if="(searchStore.vndbInfo.languages && searchStore.vndbInfo.languages.length > 0) || (searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0)" 
              class="vndb-card !p-4"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- 支持语言 -->
                <div v-if="searchStore.vndbInfo.languages && searchStore.vndbInfo.languages.length > 0">
                  <div class="flex items-center gap-2 mb-2">
                    <Languages :size="16" class="text-rose-500" />
                    <h4 class="text-sm font-bold text-gray-800 dark:text-white">支持语言</h4>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(lang, index) in searchStore.vndbInfo.languages"
                      :key="index"
                      class="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-medium rounded-lg"
                    >
                      {{ formatLanguage(lang) }}
                    </span>
                  </div>
                </div>
                <!-- 支持平台 -->
                <div v-if="searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0">
                  <div class="flex items-center gap-2 mb-2">
                    <Monitor :size="16" class="text-green-500" />
                    <h4 class="text-sm font-bold text-gray-800 dark:text-white">支持平台</h4>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(platform, index) in searchStore.vndbInfo.platforms"
                      :key="index"
                      class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg"
                    >
                      {{ formatPlatform(platform) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 相关作品和外部链接 -->
            <div 
              v-if="(searchStore.vndbInfo.relations && searchStore.vndbInfo.relations.length > 0) || (searchStore.vndbInfo.extlinks && searchStore.vndbInfo.extlinks.length > 0)" 
              class="vndb-card !p-4"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- 相关作品 -->
                <div v-if="searchStore.vndbInfo.relations && searchStore.vndbInfo.relations.length > 0">
                  <div class="flex items-center gap-2 mb-2">
                    <GitBranch :size="16" class="text-amber-500" />
                    <h4 class="text-sm font-bold text-gray-800 dark:text-white">相关作品</h4>
                    <span class="text-xs text-gray-400">({{ searchStore.vndbInfo.relations.length }})</span>
                  </div>
                  <div class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    <a
                      v-for="(relation, index) in (expandedSections.relations ? searchStore.vndbInfo.relations : searchStore.vndbInfo.relations.slice(0, 5))"
                      :key="index"
                      :href="`https://vndb.org/${relation.id}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
                    >
                      <span class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 flex-shrink-0">
                        {{ formatRelation(relation.relation) }}
                      </span>
                      <span class="text-xs text-gray-700 dark:text-slate-300 truncate group-hover:underline flex-1">
                        {{ relation.title }}
                      </span>
                    </a>
                  </div>
                  <button
                    v-if="searchStore.vndbInfo.relations.length > 5"
                    class="w-full mt-1.5 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    @click="toggleSection('relations')"
                  >
                    {{ expandedSections.relations ? '收起' : `+${searchStore.vndbInfo.relations.length - 5} 更多` }}
                  </button>
                </div>

                <!-- 外部链接 -->
                <div v-if="searchStore.vndbInfo.extlinks && searchStore.vndbInfo.extlinks.length > 0">
                  <div class="flex items-center gap-2 mb-2">
                    <Link2 :size="16" class="text-sky-500" />
                    <h4 class="text-sm font-bold text-gray-800 dark:text-white">外部链接</h4>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <a
                      v-for="(link, index) in searchStore.vndbInfo.extlinks"
                      :key="index"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                    >
                      <span>{{ link.label || link.name }}</span>
                      <ExternalLink :size="10" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- 角色 -->
            <div v-if="characters.length > 0" class="vndb-card !p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Users :size="16" class="text-rose-500" />
                  <h3 class="text-sm font-bold text-gray-800 dark:text-white">角色</h3>
                  <span class="text-xs text-gray-400 dark:text-slate-500">({{ characters.length }})</span>
                </div>
                <button
                  v-if="characters.length > 8"
                  class="text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:underline"
                  @click="toggleSection('characters')"
                >
                  {{ expandedSections.characters ? '收起' : `全部` }}
                </button>
              </div>
              <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                <a
                  v-for="(char, index) in (expandedSections.characters ? characters : characters.slice(0, 8))"
                  :key="index"
                  :href="`https://vndb.org/${char.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="relative rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-105 transition-all group"
                >
                  <div class="w-full relative">
                    <div class="w-full pb-[133.33%]" />
                    <template v-if="char.image">
                      <div class="absolute inset-0 skeleton bg-rose-100 dark:bg-rose-900/30" />
                      <img 
                        :src="char.image" 
                        :alt="char.name"
                        class="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        @load="($event.target as HTMLElement).parentElement?.querySelector('.skeleton')?.classList.add('hidden')"
                      />
                    </template>
                    <div v-else class="absolute inset-0 flex items-center justify-center bg-rose-50 dark:bg-rose-900/30">
                      <Users :size="16" class="text-rose-400 dark:text-rose-600" />
                    </div>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
                    <p class="text-[10px] font-medium text-white text-center truncate group-hover:underline">
                      {{ char.original || char.name }}
                    </p>
                  </div>
                </a>
              </div>
            </div>
            <div v-else-if="isLoadingCharacters" class="vndb-card">
              <div class="flex items-center gap-2">
                <Loader :size="18" class="animate-spin text-rose-500" />
                <span class="text-sm text-gray-500 dark:text-slate-400">加载角色中...</span>
              </div>
            </div>

            <!-- 名言 -->
            <div v-if="quotes.length > 0" class="vndb-card !p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Quote :size="16" class="text-indigo-500" />
                  <h3 class="text-sm font-bold text-gray-800 dark:text-white">名言</h3>
                  <span class="text-xs text-gray-400">({{ quotes.length }})</span>
                  <Loader v-if="isTranslatingQuotes" :size="12" class="animate-spin text-indigo-500" />
                </div>
                <div class="flex items-center gap-2">
                  <!-- AI 译文标签 - 右上角 -->
                  <div 
                    v-if="translatedQuotes.size > 0 && !showOriginalQuotes" 
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] rounded-full"
                  >
                    <Bot :size="10" />
                    <span>AI 译文</span>
                  </div>
                  <button
                    v-if="quotes.length > 3"
                    class="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    @click="toggleSection('quotes')"
                  >
                    {{ expandedSections.quotes ? '收起' : `全部` }}
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(q, index) in (expandedSections.quotes ? quotes : quotes.slice(0, 3))"
                  :key="index"
                  class="relative pl-3 border-l-2 border-indigo-300 dark:border-indigo-600 py-1"
                >
                  <p class="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{{ getQuoteDisplayText(q.quote) }}"
                  </p>
                  <p v-if="q.character" class="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium">
                    — {{ q.character.original || q.character.name }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else-if="isLoadingQuotes" class="vndb-card !p-4">
              <div class="flex items-center gap-2">
                <Loader :size="14" class="animate-spin text-indigo-500" />
                <span class="text-xs text-gray-500 dark:text-slate-400">加载名言中...</span>
              </div>
            </div>

            <!-- PV 视频和游戏截图 -->
            <div 
              v-if="pvVideoUrl || isPvLoading || (searchStore.vndbInfo.screenshots && searchStore.vndbInfo.screenshots.length > 0)" 
              class="vndb-card !p-4"
            >
              <!-- PV 视频 -->
              <div v-if="pvVideoUrl" class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <Play :size="16" class="text-rose-500" />
                  <h4 class="text-sm font-bold text-gray-800 dark:text-white">PV</h4>
                  <a 
                    href="https://www.touchgal.us/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-[10px] text-gray-400 hover:text-rose-500 transition-colors"
                  >TouchGal ↗</a>
                </div>
                <div class="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref="pvVideoRef"
                    :src="pvVideoUrl"
                    controls
                    playsinline
                    preload="metadata"
                    class="w-full h-auto"
                    @loadeddata="handleVideoLoaded"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>
              <div v-else-if="isPvLoading" class="mb-4">
                <div class="flex items-center gap-2">
                  <Loader :size="14" class="animate-spin text-rose-500" />
                  <span class="text-xs text-gray-500">获取 PV 中...</span>
                </div>
              </div>

              <!-- 游戏截图 -->
              <div v-if="searchStore.vndbInfo.screenshots && searchStore.vndbInfo.screenshots.length > 0">
                <div class="flex items-center gap-2 mb-2">
                  <Image :size="16" class="text-[#d946ef]" />
                  <h4 class="text-sm font-bold text-gray-800 dark:text-white">截图</h4>
                  <span class="text-xs text-gray-400">({{ searchStore.vndbInfo.screenshots.length }})</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    v-for="(screenshot, index) in searchStore.vndbInfo.screenshots"
                    :key="index"
                    class="group block overflow-hidden rounded-lg hover:scale-[1.02] transition-transform bg-gray-100 dark:bg-slate-700"
                    @click="openGallery(index + 1)"
                  >
                    <img
                      :src="screenshot"
                      :alt="`截图 ${index + 1}`"
                      class="w-full h-auto cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      @error="handleImageError"
                    />
                  </button>
                </div>
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
import { useSearchStore, type VndbCharacter, type VndbQuote } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { translateAllContent, fetchVndbCharacters, fetchVndbQuotes, fetchGameVideoUrl } from '@/api/search'
import { playTap, playCelebration, playCaution, playToggleOn, playToggleOff, playTransitionUp, playTransitionDown } from '@/composables/useSound'
import { useImageViewer } from '@/composables/useImageViewer'
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  Star,
  Clock,
  Calendar,
  Building,
  Monitor,
  AlignLeft,
  Languages,
  ArrowLeftRight,
  Loader,
  Bot,
  Image,
  X,
  Tag,
  Link2,
  GitBranch,
  Globe,
  Gamepad2,
  Users,
  Quote,
  Play,
} from 'lucide-vue-next'

// 图片预览
const imageViewer = useImageViewer()

const searchStore = useSearchStore()
const uiStore = useUIStore()
const isTranslating = ref(false)
const translatedDescription = ref<string | null>(null)
const showOriginal = ref(false)
const translateError = ref(false)

// 标签翻译状态
const isTranslatingTags = ref(false)
const translatedTags = ref<Map<string, string>>(new Map())
const showOriginalTags = ref(false)
const translateTagsError = ref(false)

// 角色和名言
const characters = ref<VndbCharacter[]>([])
const quotes = ref<VndbQuote[]>([])
const isLoadingCharacters = ref(false)
const isLoadingQuotes = ref(false)

// 名言翻译状态
const translatedQuotes = ref<Map<string, string>>(new Map())
const isTranslatingQuotes = ref(false)
const translateQuotesError = ref(false)
const showOriginalQuotes = ref(false)

// 一键翻译状态
const isTranslatingAllRef = ref(false)
const isTranslatingAll = computed(() => 
  isTranslatingAllRef.value || isTranslating.value || isTranslatingTags.value || isTranslatingQuotes.value,
)
const hasAnyTranslation = computed(() => 
  translatedDescription.value || translatedTags.value.size > 0 || translatedQuotes.value.size > 0,
)


// PV 视频状态
const pvVideoUrl = ref<string | null>(null)
const isPvLoading = ref(false)
 
const pvVideoRef = ref<HTMLVideoElement | null>(null)

// 视频加载完成后暂停在第一帧
function handleVideoLoaded() {
  if (pvVideoRef.value) {
    pvVideoRef.value.currentTime = 0
    pvVideoRef.value.pause()
  }
}

// 当前游戏 ID（用于防止切换游戏时数据错乱）
const currentVnId = ref<string | null>(null)

// 展开/收起状态
const expandedSections = ref({
  names: false,
  relations: false,
  characters: false,
  quotes: false,
})

function toggleSection(section: keyof typeof expandedSections.value) {
  playTap()
  expandedSections.value[section] = !expandedSections.value[section]
}

const modalRef = ref<HTMLElement | null>(null)

// 计算 VNDB URL
const vndbUrl = computed(() => {
  if (searchStore.vndbInfo?.id) {
    return `https://vndb.org/${searchStore.vndbInfo.id}`
  }
  return 'https://vndb.org/'
})

// 监听 vndbInfo 变化，重置翻译状态并加载角色和名言
// immediate: true 确保组件挂载时如果已有 vndbInfo（如从缓存恢复）能立即加载数据
// 回调中使用 newInfo?.id 和 if (vnIdAtStart) 安全处理初始 null 情况
watch(() => searchStore.vndbInfo, async (newInfo) => {
  translatedDescription.value = null
  showOriginal.value = false
  isTranslating.value = false
  translateError.value = false
  // 重置标签翻译状态
  translatedTags.value = new Map()
  showOriginalTags.value = false
  isTranslatingTags.value = false
  translateTagsError.value = false
  // 重置名言翻译状态
  translatedQuotes.value = new Map()
  showOriginalQuotes.value = false
  isTranslatingQuotes.value = false
  translateQuotesError.value = false
  // 重置一键翻译状态
  isTranslatingAllRef.value = false
  // 重置角色和名言
  characters.value = []
  quotes.value = []
  // 重置 PV 视频状态
  pvVideoUrl.value = null
  isPvLoading.value = false
  // 重置展开状态
  expandedSections.value = {
    names: false,
    relations: false,
    characters: false,
    quotes: false,
  }
  
  // 先捕获游戏 ID，用于后续竞态检查
  const vnIdAtStart = newInfo?.id || null
  
  // 更新当前游戏 ID
  currentVnId.value = vnIdAtStart
  
  // 如果有游戏 ID，加载角色和名言，然后自动翻译
  if (vnIdAtStart) {
    void loadCharactersAndQuotes(vnIdAtStart).then(() => {
      // 检查是否仍是同一个游戏（防止切换游戏时数据错乱）
      if (currentVnId.value === vnIdAtStart) {
        // 自动触发 AI 翻译（静默模式，不播放音效）
        void handleTranslateAllSilent()
      }
    })
  }
}, { immediate: true })

// 加载角色、名言和 PV 视频
async function loadCharactersAndQuotes(vnId: string) {
  // 并行加载角色、名言和 PV 视频
  isLoadingCharacters.value = true
  isLoadingQuotes.value = true
  isPvLoading.value = true
  
  const [chars, quoteList, videoUrl] = await Promise.all([
    fetchVndbCharacters(vnId),
    fetchVndbQuotes(vnId),
    fetchGameVideoUrl(vnId),
  ])
  
  characters.value = chars
  quotes.value = quoteList
  pvVideoUrl.value = videoUrl
  isLoadingCharacters.value = false
  isLoadingQuotes.value = false
  isPvLoading.value = false
}

// 监听打开状态
watch(() => uiStore.isVndbPanelOpen, (isOpen) => {
  if (isOpen) {
    playTransitionUp()
  }
})

// 获取名言显示文本
function getQuoteDisplayText(quote: string): string {
  if (showOriginalQuotes.value || translatedQuotes.value.size === 0) {
    return quote
  }
  return translatedQuotes.value.get(quote) || quote
}

// 一键翻译全部（内部实现）- 合并为单次 API 请求
async function translateAllInternal(silent = false) {
  if (isTranslatingAll.value) {
    return
  }
  
  if (!silent) {
    playTap()
  }
  
  isTranslatingAllRef.value = true
  const vnIdAtStart = currentVnId.value
  
  try {
    // 收集需要翻译的内容
    const descText = (!translatedDescription.value && searchStore.vndbInfo?.description) 
      ? searchStore.vndbInfo.description 
      : null
    
    const tagNames = (translatedTags.value.size === 0 && searchStore.vndbInfo?.tags?.length) 
      ? searchStore.vndbInfo.tags.map(t => t.name)
      : null
    
    const quoteTexts = (translatedQuotes.value.size === 0 && quotes.value.length > 0)
      ? quotes.value.map(q => q.quote)
      : null
    
    // 如果没有任何需要翻译的内容
    if (!descText && !tagNames && !quoteTexts) {
      return
    }
    
    // 单次 API 请求翻译所有内容
    const result = await translateAllContent(descText, tagNames, quoteTexts)
    
    // 检查是否仍是同一个游戏
    if (currentVnId.value !== vnIdAtStart) {
      return
    }
    
    // 应用翻译结果
    let hasSuccess = false
    
    if (result.description && descText) {
      translatedDescription.value = result.description
      showOriginal.value = false
      hasSuccess = true
    }
    
    if (result.tags && tagNames) {
      const newMap = new Map<string, string>()
      tagNames.forEach((original, index) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (result.tags![index]) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newMap.set(original, result.tags![index])
        }
      })
      if (newMap.size > 0) {
        translatedTags.value = newMap
        showOriginalTags.value = false
        hasSuccess = true
      }
    }
    
    if (result.quotes && quoteTexts) {
      const newMap = new Map<string, string>()
      quoteTexts.forEach((original, index) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (result.quotes![index]) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newMap.set(original, result.quotes![index])
        }
      })
      if (newMap.size > 0) {
        translatedQuotes.value = newMap
        showOriginalQuotes.value = false
        hasSuccess = true
      }
    }
    
    if (!silent && hasSuccess) {
      playCelebration()
    } else if (!silent && !hasSuccess) {
      translateError.value = true
      playCaution()
    }
  } catch {
    if (!silent) {
      translateError.value = true
      playCaution()
    }
  } finally {
    isTranslatingAllRef.value = false
  }
}

// 一键翻译全部（用户点击）
async function handleTranslateAll() {
  await translateAllInternal(false)
}

// 一键翻译全部（静默模式，自动触发时使用）
async function handleTranslateAllSilent() {
  await translateAllInternal(true)
}

// 切换所有翻译的显示状态
function toggleAllTranslations() {
  const newState = !showOriginal.value
  // 切换到原文时播放 off，切换到译文时播放 on
  if (newState) {
    playToggleOff()
  } else {
    playToggleOn()
  }
  showOriginal.value = newState
  showOriginalTags.value = newState
  showOriginalQuotes.value = newState
}

// 获取标签显示名称
function getTagDisplayName(tag: { name: string }): string {
  if (showOriginalTags.value || translatedTags.value.size === 0) {
    return tag.name
  }
  return translatedTags.value.get(tag.name) || tag.name
}

function closePanel() {
  playTransitionDown()
  // 关闭面板
  uiStore.isVndbPanelOpen = false
}

// 处理图片加载失败
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 打开图片画廊
function openGallery(startIndex: number) {
  if (!searchStore.vndbInfo) {
    return
  }
  
  const images = []
  
  // 添加封面
  if (searchStore.vndbInfo.mainImageUrl) {
    images.push({
      src: searchStore.vndbInfo.mainImageUrl,
      caption: `${searchStore.vndbInfo.mainName} - 游戏封面`,
    })
  }
  
  // 添加截图
  if (searchStore.vndbInfo.screenshots) {
    searchStore.vndbInfo.screenshots.forEach((screenshot, index) => {
      images.push({
        src: screenshot,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        caption: `${searchStore.vndbInfo!.mainName} - 截图 ${index + 1}`,
      })
    })
  }
  
  if (images.length > 0) {
    imageViewer.open(images, startIndex)
  }
}

// 格式化性别（保留备用）
function _formatSex(sex: string): string {
  const sexMap: Record<string, string> = {
    'm': '男性',
    'f': '女性',
    'b': '双性',
    'n': '无性',
  }
  return sexMap[sex] || sex
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) {return '未知'}
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {return dateString}
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}年${month}月${day}日`
}

// 格式化平台名称
function formatPlatform(platform: string): string {
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
function formatLanguage(lang: string): string {
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
function renderDescription(text: string): string {
  if (!text) {
    return ''
  }
  
  const html = text
    // 转义 HTML 特殊字符（防止 XSS）
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 链接 [url=链接]文字[/url]
    .replace(/\[url=([^\]]+)\](.+?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#ff1493] hover:underline">$2</a>')
    // 链接 [url]链接[/url]
    .replace(/\[url\](.+?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#ff1493] hover:underline">$1</a>')
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
    .replace(/\[quote\](.+?)\[\/quote\]/gis, '<blockquote class="border-l-2 border-[#ff1493] pl-3 my-2 text-gray-600 dark:text-slate-400 italic">$1</blockquote>')
    // 代码 [code]文字[/code]
    .replace(/\[code\](.+?)\[\/code\]/gis, '<code class="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm">$1</code>')
    // 原始文本 [raw]文字[/raw]
    .replace(/\[raw\](.+?)\[\/raw\]/gis, '$1')
    // 换行保持
    .replace(/\n/g, '<br>')
  
  return html
}

// 计算渲染后的描述
const renderedDescription = computed(() => {
  const text = showOriginal.value || !translatedDescription.value 
    ? searchStore.vndbInfo?.description 
    : translatedDescription.value
  return renderDescription(text || '')
})

// 格式化开发状态
function formatDevStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: '已完成',
    1: '开发中',
    2: '已取消',
  }
  return statusMap[status] || '未知'
}

// 获取开发状态颜色
function getDevStatusColor(status: number): string {
  const colorMap: Record<number, string> = {
    0: 'text-emerald-600 dark:text-emerald-400',
    1: 'text-amber-600 dark:text-amber-400',
    2: 'text-red-600 dark:text-red-400',
  }
  return colorMap[status] || 'text-gray-600 dark:text-gray-400'
}

// 获取标签分类样式
function getTagCategoryClass(category: string): string {
  const categoryMap: Record<string, string> = {
    'cont': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    'tech': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'ero': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }
  return categoryMap[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
}

// 格式化标签分类名称（保留备用）
function _formatTagCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'cont': '内容',
    'tech': '技术',
    'ero': '色情',
  }
  return categoryMap[category] || category
}

// 格式化关系类型
function formatRelation(relation: string): string {
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
</script>

<style>
/* VNDB 面板 - 半透明效果 */
.vndb-page {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .vndb-page {
    border-bottom: none;
  }
}

/* VNDB 面板 - 暗色模式 */
.dark .vndb-page {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* VNDB 卡片 - 亮色模式 */
.vndb-card {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card-inner, 0.75));
  border-radius: var(--radius-xl, 1.25rem);
  padding: var(--spacing-lg, 1.25rem);
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.08));
}

/* VNDB 卡片 - 暗色模式 */
.dark .vndb-card {
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

/* 描述文本 Markdown 样式 */
.prose-description :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.prose-description :deep(em) {
  font-style: italic;
}

.prose-description :deep(a) {
  color: #ff1493;
  text-decoration: none;
  transition: color 0.2s;
}

.prose-description :deep(a:hover) {
  text-decoration: underline;
}

.dark .prose-description :deep(a) {
  color: #ff69b4;
}

/* 剧透文字 - 模糊效果，悬停显示 */
.prose-description :deep(.spoiler-text) {
  background: rgba(0, 0, 0, 0.8);
  color: transparent;
  border-radius: 2px;
  padding: 0 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.prose-description :deep(.spoiler-text:hover) {
  background: rgba(255, 20, 147, 0.1);
  color: inherit;
}

.dark .prose-description :deep(.spoiler-text) {
  background: rgba(255, 255, 255, 0.8);
}

.dark .prose-description :deep(.spoiler-text:hover) {
  background: rgba(255, 105, 180, 0.2);
}
</style>
