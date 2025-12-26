<template>
  <Teleport to="body">
    <!-- VNDB 信息面板 - macOS 风格浮动窗口 -->
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="uiStore.isVndbPanelOpen && searchStore.vndbInfo"
        ref="modalRef"
        :class="[
          'fixed z-50 flex flex-col vndb-page shadow-2xl shadow-black/20',
          isFullscreen 
            ? 'inset-0' 
            : 'inset-0 md:inset-6 md:m-auto md:w-[800px] md:min-w-[700px] md:max-w-[1000px] md:h-[700px] md:max-h-[calc(100%-3rem)] md:rounded-3xl'
        ]"
        :style="windowStyle"
      >
        <!-- 调整大小手柄 -->
        <WindowResizeHandles 
          :is-fullscreen="isFullscreen" 
          @resize="handleResize" 
        />
      
        <!-- 顶部导航栏 - 可拖动 -->
        <div 
          :class="[
            'flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none',
            isFullscreen ? '' : 'md:rounded-t-3xl md:cursor-move'
          ]"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
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
                : 'text-white bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 hover:shadow-xl'"
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
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#ff1493] to-[#d946ef] shadow-lg shadow-pink-500/25 hover:shadow-xl transition-shadow"
            >
              <ExternalLink :size="14" />
              <span class="hidden sm:inline">VNDB</span>
            </a>
          
            <!-- 全屏按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title="全屏"
              @click="handleToggleFullscreen"
            >
              <Maximize2 v-if="!isFullscreen" :size="16" />
              <Minimize2 v-else :size="16" />
            </button>
          
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
          <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            <!-- 封面和标题卡片 -->
            <div class="vndb-card">
              <!-- 封面图 -->
              <div v-if="searchStore.vndbInfo.mainImageUrl" class="mb-4">
                <button
                  class="block w-full max-w-sm mx-auto"
                  @click="openGallery(0)"
                >
                  <img
                    :src="searchStore.vndbInfo.mainImageUrl"
                    :alt="searchStore.vndbInfo.mainName"
                    class="w-full h-auto rounded-2xl shadow-lg cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </button>
              </div>

              <!-- 标题 -->
              <h2 class="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
                {{ searchStore.vndbInfo.mainName }}
              </h2>

              <!-- 原名 -->
              <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 dark:text-slate-400 text-center mb-1">
                {{ searchStore.vndbInfo.originalTitle }}
              </p>
              
              <!-- 罗马音 -->
              <p v-if="searchStore.vndbInfo.alttitle && searchStore.vndbInfo.alttitle !== searchStore.vndbInfo.originalTitle" class="text-xs text-gray-400 dark:text-slate-500 text-center mb-4 italic">
                {{ searchStore.vndbInfo.alttitle }}
              </p>
              <div v-else class="mb-3" />

              <!-- 别名标签 -->
              <div v-if="searchStore.vndbInfo.names.length > 1" class="flex flex-wrap justify-center gap-2">
                <span
                  v-for="(name, index) in (expandedSections.names ? searchStore.vndbInfo.names : searchStore.vndbInfo.names.slice(0, 5))"
                  :key="index"
                  class="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-[#ff1493] dark:text-[#ff69b4] text-xs rounded-full"
                >
                  {{ name }}
                </span>
                <button
                  v-if="searchStore.vndbInfo.names.length > 5"
                  class="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  @click="toggleSection('names')"
                >
                  {{ expandedSections.names ? '收起' : `+${searchStore.vndbInfo.names.length - 5}` }}
                </button>
              </div>
            </div>

            <!-- 信息卡片网格 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- 评分 -->
              <div v-if="searchStore.vndbInfo.rating" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Star :size="24" class="text-white" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">VNDB 评分</p>
                  <p class="text-xl font-bold text-gray-800 dark:text-white">
                    {{ (searchStore.vndbInfo.rating / 10).toFixed(1) }}
                    <span class="text-sm font-normal text-gray-500 dark:text-slate-400">/ 10</span>
                  </p>
                  <p class="text-xs text-gray-400 dark:text-slate-500">{{ searchStore.vndbInfo.votecount }} 票</p>
                </div>
              </div>

              <!-- 游戏时长 -->
              <div v-if="searchStore.vndbInfo.play_hours" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Clock :size="24" class="text-white" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">游戏时长</p>
                  <p class="text-xl font-bold text-gray-800 dark:text-white">
                    {{ searchStore.vndbInfo.play_hours }}
                    <span class="text-sm font-normal text-gray-500 dark:text-slate-400">小时</span>
                  </p>
                  <p class="text-xs text-gray-400 dark:text-slate-500">{{ searchStore.vndbInfo.book_length }}</p>
                </div>
              </div>

              <!-- 发行日期 -->
              <div v-if="searchStore.vndbInfo.released" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar :size="24" class="text-white" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">发行日期</p>
                  <p class="text-lg font-bold text-gray-800 dark:text-white">
                    {{ formatDate(searchStore.vndbInfo.released) }}
                  </p>
                </div>
              </div>

              <!-- 开发商 -->
              <div v-if="searchStore.vndbInfo.developers && searchStore.vndbInfo.developers.length > 0" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Building :size="24" class="text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-500 dark:text-slate-400">开发商</p>
                  <p 
                    v-text-scroll 
                    class="text-base font-bold text-gray-800 dark:text-white"
                  >
                    {{ searchStore.vndbInfo.developers.map(d => d.name).join(', ') }}
                  </p>
                </div>
              </div>

              <!-- 开发状态 -->
              <div v-if="searchStore.vndbInfo.devstatus !== undefined" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Gamepad2 :size="24" class="text-white" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">开发状态</p>
                  <p class="text-base font-bold" :class="getDevStatusColor(searchStore.vndbInfo.devstatus)">
                    {{ formatDevStatus(searchStore.vndbInfo.devstatus) }}
                  </p>
                </div>
              </div>

              <!-- 原始语言 -->
              <div v-if="searchStore.vndbInfo.olang" class="vndb-card flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Globe :size="24" class="text-white" />
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">原始语言</p>
                  <p class="text-base font-bold text-gray-800 dark:text-white">
                    {{ formatLanguage(searchStore.vndbInfo.olang) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 支持语言 -->
            <div v-if="searchStore.vndbInfo.languages && searchStore.vndbInfo.languages.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <Languages :size="18" class="text-rose-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">支持语言</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(lang, index) in searchStore.vndbInfo.languages"
                  :key="index"
                  class="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-medium rounded-xl"
                >
                  {{ formatLanguage(lang) }}
                </span>
              </div>
            </div>

            <!-- 平台 -->
            <div v-if="searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <Monitor :size="18" class="text-green-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">支持平台</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(platform, index) in searchStore.vndbInfo.platforms"
                  :key="index"
                  class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl"
                >
                  {{ formatPlatform(platform) }}
                </span>
              </div>
            </div>

            <!-- 标签 -->
            <div v-if="searchStore.vndbInfo.tags && searchStore.vndbInfo.tags.length > 0" class="vndb-card">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Tag :size="18" class="text-violet-500" />
                  <h3 class="font-bold text-gray-800 dark:text-white">标签</h3>
                  <span class="text-xs text-gray-400 dark:text-slate-500">(按相关性排序)</span>
                </div>
                <!-- 翻译中指示器 -->
                <Loader v-if="isTranslatingTags" :size="14" class="animate-spin text-violet-500" />
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in searchStore.vndbInfo.tags"
                  :key="index"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-default"
                  :class="getTagCategoryClass(tag.category)"
                  :title="`${tag.name}${translatedTags.get(tag.name) ? ' → ' + translatedTags.get(tag.name) : ''} | 相关性: ${Math.round(tag.rating * 10) / 10} | 分类: ${formatTagCategory(tag.category)}`"
                >
                  {{ getTagDisplayName(tag) }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
                <span class="text-xs text-gray-400 dark:text-slate-500">分类:</span>
                <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <span class="w-2 h-2 rounded-full bg-violet-500" />内容
                </span>
                <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <span class="w-2 h-2 rounded-full bg-blue-500" />技术
                </span>
                <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <span class="w-2 h-2 rounded-full bg-amber-500" />色情
                </span>
              </div>
            </div>

            <!-- 角色配音 -->
            <div v-if="searchStore.vndbInfo.va && searchStore.vndbInfo.va.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <Mic :size="18" class="text-cyan-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">角色配音</h3>
                <span class="text-xs text-gray-400 dark:text-slate-500">({{ searchStore.vndbInfo.va.length }})</span>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                <a
                  v-for="(voiceActor, index) in (expandedSections.va ? searchStore.vndbInfo.va : searchStore.vndbInfo.va.slice(0, 10))"
                  :key="index"
                  :href="`https://vndb.org/${voiceActor.character?.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:scale-105 transition-all group"
                >
                  <!-- 图片区域 -->
                  <div class="w-full relative">
                    <!-- 骨架屏占位 (padding-bottom: 133.33% = 3:4 比例) -->
                    <div class="w-full pb-[133.33%] skeleton bg-cyan-100 dark:bg-cyan-900/30" />
                    <img 
                      v-if="getCharacterImage(voiceActor.character?.id)" 
                      :src="getCharacterImage(voiceActor.character?.id)!" 
                      :alt="voiceActor.character?.name"
                      class="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      @load="($event.target as HTMLElement).parentElement?.querySelector('.skeleton')?.classList.add('hidden')"
                    />
                    <div v-else class="absolute inset-0 flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/30">
                      <Users :size="24" class="text-cyan-400 dark:text-cyan-600" />
                    </div>
                  </div>
                  <!-- 文字覆盖层 -->
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-6">
                    <p class="text-xs font-medium text-white text-center truncate group-hover:underline">
                      {{ voiceActor.character?.original || voiceActor.character?.name }}
                    </p>
                    <p class="text-[10px] text-white/70 text-center truncate">
                      CV: {{ voiceActor.staff?.original || voiceActor.staff?.name }}
                    </p>
                  </div>
                </a>
              </div>
              <button
                v-if="searchStore.vndbInfo.va.length > 10"
                class="w-full mt-2 py-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                @click="toggleSection('va')"
              >
                {{ expandedSections.va ? '收起' : `显示全部 ${searchStore.vndbInfo.va.length} 个角色` }}
              </button>
            </div>

            <!-- 相关作品 -->
            <div v-if="searchStore.vndbInfo.relations && searchStore.vndbInfo.relations.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <GitBranch :size="18" class="text-amber-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">相关作品</h3>
              </div>
              <div class="space-y-2">
                <a
                  v-for="(relation, index) in (expandedSections.relations ? searchStore.vndbInfo.relations : searchStore.vndbInfo.relations.slice(0, 8))"
                  :key="index"
                  :href="`https://vndb.org/${relation.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
                >
                  <span class="px-2 py-0.5 text-xs font-medium rounded-md bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 flex-shrink-0">
                    {{ formatRelation(relation.relation) }}
                  </span>
                  <span class="text-sm text-gray-700 dark:text-slate-300 truncate group-hover:underline flex-1">
                    {{ relation.title }}
                  </span>
                  <ExternalLink :size="12" class="text-amber-400 dark:text-amber-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <button
                v-if="searchStore.vndbInfo.relations.length > 8"
                class="w-full mt-2 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                @click="toggleSection('relations')"
              >
                {{ expandedSections.relations ? '收起' : `显示全部 ${searchStore.vndbInfo.relations.length} 个相关作品` }}
              </button>
            </div>

            <!-- 外部链接 -->
            <div v-if="searchStore.vndbInfo.extlinks && searchStore.vndbInfo.extlinks.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <Link2 :size="18" class="text-sky-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">外部链接</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <a
                  v-for="(link, index) in searchStore.vndbInfo.extlinks"
                  :key="index"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                >
                  <span>{{ link.label || link.name }}</span>
                  <ExternalLink :size="12" />
                </a>
              </div>
            </div>

            <!-- 角色 -->
            <div v-if="characters.length > 0" class="vndb-card">
              <div class="flex items-center gap-2 mb-3">
                <Users :size="18" class="text-rose-500" />
                <h3 class="font-bold text-gray-800 dark:text-white">角色</h3>
                <span class="text-xs text-gray-400 dark:text-slate-500">({{ characters.length }})</span>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                <a
                  v-for="(char, index) in (expandedSections.characters ? characters : characters.slice(0, 10))"
                  :key="index"
                  :href="`https://vndb.org/${char.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:scale-105 transition-all group"
                >
                  <!-- 图片区域 -->
                  <div class="w-full relative">
                    <!-- 骨架屏占位 (padding-bottom: 133.33% = 3:4 比例) -->
                    <div class="w-full pb-[133.33%] skeleton bg-rose-100 dark:bg-rose-900/30" />
                    <img 
                      v-if="char.image" 
                      :src="char.image" 
                      :alt="char.name"
                      class="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      @load="($event.target as HTMLElement).parentElement?.querySelector('.skeleton')?.classList.add('hidden')"
                    />
                    <div v-else class="absolute inset-0 flex items-center justify-center">
                      <Users :size="24" class="text-rose-400 dark:text-rose-600" />
                    </div>
                  </div>
                  <!-- 文字覆盖层 -->
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-6">
                    <p class="text-xs font-medium text-white text-center truncate group-hover:underline">
                      {{ char.original || char.name }}
                    </p>
                    <p v-if="char.sex" class="text-[10px] text-white/70 text-center">
                      {{ formatSex(char.sex) }}{{ char.age ? ` · ${char.age}岁` : '' }}
                    </p>
                  </div>
                </a>
              </div>
              <button
                v-if="characters.length > 10"
                class="w-full mt-2 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                @click="toggleSection('characters')"
              >
                {{ expandedSections.characters ? '收起' : `显示全部 ${characters.length} 个角色` }}
              </button>
            </div>
            <div v-else-if="isLoadingCharacters" class="vndb-card">
              <div class="flex items-center gap-2">
                <Loader :size="18" class="animate-spin text-rose-500" />
                <span class="text-sm text-gray-500 dark:text-slate-400">加载角色中...</span>
              </div>
            </div>

            <!-- 名言 -->
            <div v-if="quotes.length > 0" class="vndb-card">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Quote :size="18" class="text-indigo-500" />
                  <h3 class="font-bold text-gray-800 dark:text-white">名言</h3>
                  <span class="text-xs text-gray-400 dark:text-slate-500">({{ quotes.length }})</span>
                </div>
                <!-- 翻译中指示器 -->
                <Loader v-if="isTranslatingQuotes" :size="14" class="animate-spin text-indigo-500" />
              </div>
              <div class="space-y-3">
                <div
                  v-for="(q, index) in (expandedSections.quotes ? quotes : quotes.slice(0, 5))"
                  :key="index"
                  class="relative pl-4 border-l-2 border-indigo-300 dark:border-indigo-600"
                >
                  <p class="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    "{{ getQuoteDisplayText(q.quote) }}"
                  </p>
                  <p v-if="q.character" class="text-xs text-indigo-500 dark:text-indigo-400 mt-1 font-medium">
                    — {{ q.character.original || q.character.name }}
                  </p>
                </div>
              </div>
              <button
                v-if="quotes.length > 5"
                class="w-full mt-2 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                @click="toggleSection('quotes')"
              >
                {{ expandedSections.quotes ? '收起' : `显示全部 ${quotes.length} 条名言` }}
              </button>
            </div>
            <div v-else-if="isLoadingQuotes" class="vndb-card">
              <div class="flex items-center gap-2">
                <Loader :size="18" class="animate-spin text-indigo-500" />
                <span class="text-sm text-gray-500 dark:text-slate-400">加载名言中...</span>
              </div>
            </div>

            <!-- 简介 -->
            <div v-if="searchStore.vndbInfo.description" class="vndb-card">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <AlignLeft :size="18" class="text-[#ff1493]" />
                  <h3 class="font-bold text-gray-800 dark:text-white">简介</h3>
                </div>
                <!-- 翻译中指示器 -->
                <Loader v-if="isTranslating" :size="14" class="animate-spin text-[#ff1493]" />
              </div>

              <!-- 显示内容 -->
              <div class="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                <template v-if="showOriginal || !translatedDescription">
                  {{ searchStore.vndbInfo.description }}
                </template>
                <template v-else>
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 mb-2 bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white text-xs rounded-full">
                    <Bot :size="12" />
                    <span>AI 译文</span>
                  </div>
                  <div>{{ translatedDescription }}</div>
                </template>
              </div>
            </div>

            <!-- 游戏截图 (等待首张图片加载后显示) -->
            <div 
              v-if="searchStore.vndbInfo.screenshots && searchStore.vndbInfo.screenshots.length > 0" 
              v-show="screenshotsReady"
              class="vndb-card"
            >
              <div class="flex items-center gap-2 mb-4">
                <Image :size="18" class="text-[#d946ef]" />
                <h3 class="font-bold text-gray-800 dark:text-white">游戏截图</h3>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="(screenshot, index) in searchStore.vndbInfo.screenshots"
                  :key="index"
                  class="group block overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all"
                  @click="openGallery(index + 1)"
                >
                  <img
                    :src="screenshot"
                    :alt="`${searchStore.vndbInfo.mainName} 截图 ${index + 1}`"
                    class="w-full h-auto cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    @load="screenshotsReady = true"
                    @error="handleImageError"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useSearchStore, type VndbCharacter, type VndbQuote } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { translateText, fetchVndbCharacters, fetchVndbQuotes } from '@/api/search'
import { playClick, playSuccess, playError, playToggle, playTransitionUp, playTransitionDown, playSwipe } from '@/composables/useSound'
import { animate } from '@/composables/useAnime'
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
  Maximize2,
  Minimize2,
  X,
  Tag,
  Mic,
  Link2,
  GitBranch,
  Globe,
  Gamepad2,
  Users,
  Quote,
} from 'lucide-vue-next'
import { useWindowManager, type ResizeDirection } from '@/composables/useWindowManager'
import WindowResizeHandles from '@/components/WindowResizeHandles.vue'

// 图片预览
const imageViewer = useImageViewer()

// 进入/离开动画
function onEnter(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [0, 1],
    scale: [0.98, 1],
    translateY: [40, 0],
    duration: 300,
    ease: 'outCubic',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    scale: [1, 0.98],
    translateY: [0, 40],
    duration: 200,
    ease: 'inCubic',
    complete: done,
  })
}

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
const isTranslatingAll = computed(() => 
  isTranslating.value || isTranslatingTags.value || isTranslatingQuotes.value,
)
const hasAnyTranslation = computed(() => 
  translatedDescription.value || translatedTags.value.size > 0 || translatedQuotes.value.size > 0,
)

// 截图加载状态
const screenshotsReady = ref(false)

// 展开/收起状态
const expandedSections = ref({
  names: false,
  va: false,
  relations: false,
  characters: false,
  quotes: false,
})

function toggleSection(section: keyof typeof expandedSections.value) {
  playClick()
  expandedSections.value[section] = !expandedSections.value[section]
}

// 窗口管理
const modalRef = ref<HTMLElement | null>(null)
const { isFullscreen, windowStyle, startDrag, startResize, toggleFullscreen, reset } = useWindowManager({
  minWidth: 400,
  minHeight: 300,
})

function handleDragStart(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('button, a')) {return}
  if (modalRef.value) {
    startDrag(e, modalRef.value)
  }
}

function handleResize(e: MouseEvent | TouchEvent, direction: ResizeDirection) {
  if (modalRef.value) {
    startResize(e, direction, modalRef.value)
  }
}

// 切换全屏（带音效）
function handleToggleFullscreen() {
  playSwipe()
  toggleFullscreen()
}

// 计算 VNDB URL
const vndbUrl = computed(() => {
  if (searchStore.vndbInfo?.id) {
    return `https://vndb.org/${searchStore.vndbInfo.id}`
  }
  return 'https://vndb.org/'
})

// 监听 vndbInfo 变化，重置翻译状态并加载角色和名言
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
  // 重置截图加载状态
  screenshotsReady.value = false
  // 重置角色和名言
  characters.value = []
  quotes.value = []
  // 重置展开状态
  expandedSections.value = {
    names: false,
    va: false,
    relations: false,
    characters: false,
    quotes: false,
  }
  
  // 如果有游戏 ID，加载角色和名言
  if (newInfo?.id) {
    loadCharactersAndQuotes(newInfo.id)
  }
  
  // 检查缓存的截图是否已加载（nextTick 后检查 img.complete）
  if (newInfo?.screenshots && newInfo.screenshots.length > 0) {
    nextTick(() => {
      // 延迟一帧确保 DOM 已渲染
      requestAnimationFrame(() => {
        const vndbContent = document.querySelector('.vndb-content')
        if (vndbContent) {
          const firstScreenshot = vndbContent.querySelector('img[loading="lazy"]') as HTMLImageElement
          if (firstScreenshot?.complete && firstScreenshot.naturalHeight > 0) {
            screenshotsReady.value = true
          }
        }
      })
    })
  }
})

// 加载角色和名言
async function loadCharactersAndQuotes(vnId: string) {
  // 并行加载角色和名言
  isLoadingCharacters.value = true
  isLoadingQuotes.value = true
  
  const [chars, quoteList] = await Promise.all([
    fetchVndbCharacters(vnId),
    fetchVndbQuotes(vnId),
  ])
  
  characters.value = chars
  quotes.value = quoteList
  isLoadingCharacters.value = false
  isLoadingQuotes.value = false
}

// 监听打开状态
watch(() => uiStore.isVndbPanelOpen, (isOpen) => {
  if (isOpen) {
    playTransitionUp()
  } else {
    reset()
  }
})

async function handleTranslate() {
  if (!searchStore.vndbInfo?.description || isTranslating.value) {
    return
  }

  playClick()
  isTranslating.value = true
  translateError.value = false

  try {
    const translated = await translateText(searchStore.vndbInfo.description, 'description')
    if (translated) {
      translatedDescription.value = translated
      showOriginal.value = false
      translateError.value = false
      playSuccess()
    } else {
      translateError.value = true
      playError()
    }
  } catch {
    translateError.value = true
    playError()
  } finally {
    isTranslating.value = false
  }
}

// 翻译标签
async function handleTranslateTags() {
  if (!searchStore.vndbInfo?.tags || searchStore.vndbInfo.tags.length === 0 || isTranslatingTags.value) {
    return
  }

  playClick()
  isTranslatingTags.value = true
  translateTagsError.value = false

  try {
    // 收集所有标签名称，用换行符分隔
    const tagNames = searchStore.vndbInfo.tags.map(tag => tag.name)
    const textToTranslate = tagNames.join('\n')
    
    const translated = await translateText(textToTranslate, 'tags')
    if (translated) {
      // 解析翻译结果，按换行符分割
      const translatedNames = translated.split('\n').map(s => s.trim()).filter(s => s)
      
      // 创建映射
      const newMap = new Map<string, string>()
      tagNames.forEach((original, index) => {
        if (translatedNames[index]) {
          newMap.set(original, translatedNames[index])
        }
      })
      
      translatedTags.value = newMap
      showOriginalTags.value = false
      translateTagsError.value = false
      playSuccess()
    } else {
      translateTagsError.value = true
      playError()
    }
  } catch {
    translateTagsError.value = true
    playError()
  } finally {
    isTranslatingTags.value = false
  }
}

// 翻译名言
async function handleTranslateQuotes() {
  if (quotes.value.length === 0 || isTranslatingQuotes.value) {
    return
  }

  playClick()
  isTranslatingQuotes.value = true
  translateQuotesError.value = false

  try {
    // 收集所有名言，用换行符分隔
    const quoteTexts = quotes.value.map(q => q.quote)
    const textToTranslate = quoteTexts.join('\n')
    
    const translated = await translateText(textToTranslate, 'quotes')
    if (translated) {
      // 解析翻译结果，按换行符分割
      const translatedTexts = translated.split('\n').map(s => s.trim()).filter(s => s)
      
      // 创建映射
      const newMap = new Map<string, string>()
      quoteTexts.forEach((original, index) => {
        if (translatedTexts[index]) {
          newMap.set(original, translatedTexts[index])
        }
      })
      
      translatedQuotes.value = newMap
      showOriginalQuotes.value = false
      translateQuotesError.value = false
      playSuccess()
    } else {
      translateQuotesError.value = true
      playError()
    }
  } catch {
    translateQuotesError.value = true
    playError()
  } finally {
    isTranslatingQuotes.value = false
  }
}

// 获取名言显示文本
function getQuoteDisplayText(quote: string): string {
  if (showOriginalQuotes.value || translatedQuotes.value.size === 0) {
    return quote
  }
  return translatedQuotes.value.get(quote) || quote
}

// 一键翻译全部
async function handleTranslateAll() {
  if (isTranslatingAll.value) {
    return
  }
  
  playClick()
  
  // 并行执行所有翻译任务
  const tasks: Promise<void>[] = []
  
  // 翻译简介
  if (searchStore.vndbInfo?.description && !translatedDescription.value) {
    tasks.push(handleTranslate())
  }
  
  // 翻译标签
  if (searchStore.vndbInfo?.tags && searchStore.vndbInfo.tags.length > 0 && translatedTags.value.size === 0) {
    tasks.push(handleTranslateTags())
  }
  
  // 翻译名言
  if (quotes.value.length > 0 && translatedQuotes.value.size === 0) {
    tasks.push(handleTranslateQuotes())
  }
  
  await Promise.all(tasks)
  
  // 如果有任何翻译成功，播放成功音效
  if (translatedDescription.value || translatedTags.value.size > 0 || translatedQuotes.value.size > 0) {
    playSuccess()
  }
}

// 切换所有翻译的显示状态
function toggleAllTranslations() {
  playToggle()
  const newState = !showOriginal.value
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
        caption: `${searchStore.vndbInfo!.mainName} - 截图 ${index + 1}`,
      })
    })
  }
  
  if (images.length > 0) {
    imageViewer.open(images, startIndex)
  }
}

// 根据角色ID获取角色图片
function getCharacterImage(characterId: string | undefined): string | undefined {
  if (!characterId) {
    return undefined
  }
  const char = characters.value.find(c => c.id === characterId)
  return char?.image
}

// 格式化性别
function formatSex(sex: string): string {
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

// 格式化标签分类名称
function formatTagCategory(category: string): string {
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
/* VNDB 面板 - WWDC 2025 液态玻璃效果 */
.vndb-page {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  will-change: transform;
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(255, 20, 147, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  /* 窗口/全屏切换动画 */
  transition: 
    inset 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .vndb-page {
    border-bottom: none;
  }
}

/* 液态玻璃高光 */
.vndb-page::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 100;
}

/* VNDB 面板 - 暗色模式 */
.dark .vndb-page {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 -8px 24px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(255, 105, 180, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;
}

/* VNDB 卡片 - 亮色模式 */
.vndb-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.25rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

/* VNDB 卡片 - 暗色模式 */
.dark .vndb-card {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
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
</style>
