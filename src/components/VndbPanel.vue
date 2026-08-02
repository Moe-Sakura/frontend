<!-- eslint-disable vue/no-v-html -->
<template>
  <Dialog v-model:open="open">
    <DialogContent
      v-if="searchStore.vndbInfo"
      :show-close-button="false"
      class="vndb-page inset-0 flex translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 shadow-2xl shadow-black/20
             max-w-none sm:max-w-none
             md:inset-6 md:m-auto md:h-[800px] md:max-h-[calc(100%_-_3rem)] md:w-[900px] md:max-w-[calc(100%_-_3rem)] md:rounded-3xl"
    >
      <!-- 顶部导航栏 -->
      <DialogHeader
        class="glassmorphism-navbar flex-row flex-shrink-0 items-center justify-between space-y-0 border-b border-white/10 px-4 py-3 select-none sm:px-6 sm:py-4 md:rounded-t-3xl dark:border-slate-700/50"
      >
        <!-- 返回按钮 - 移动端 -->
        <!-- ChevronLeft 必须显式写 size-6：基类的 [&_svg:not([class*='size-'])]:size-4
             是 CSS，会赢过 lucide 渲染的 width/height 属性，否则 24px 被静默压成 16px。
             has-[>svg]:px-0 也不能少：default size 自带 has-[>svg]:px-3，它带 :has()
             提权 (0,1,1) 会赢过普通的 px-0，不覆盖的话图标会平白多出 12px 内边距。 -->
        <Button
          type="button"
          variant="ghost"
          class="h-auto gap-1 px-0 font-medium text-theme-primary hover:opacity-80 has-[>svg]:px-0 md:hidden dark:text-theme-primary-light"
          @click="open = false"
        >
          <ChevronLeft :size="24" class="size-6" />
          <span class="text-base">返回</span>
        </Button>

        <!-- 标题 -->
        <div class="flex items-center gap-2 md:ml-0">
          <BookOpen :size="20" class="text-theme-primary dark:text-theme-primary-light" />
          <DialogTitle class="text-lg font-bold text-gray-800 dark:text-white">
            作品介绍
          </DialogTitle>
          <DialogDescription class="sr-only">
            {{ searchStore.vndbInfo.mainName }} 的 VNDB 作品资料
          </DialogDescription>
        </div>

        <!-- 右侧按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 一键翻译按钮 -->
          <!-- 灰态改由 disabled: 前缀承载（原本是三元 :class）；disabled:pointer-events-auto
               是必须的：基类的 disabled:pointer-events-none 会连 cursor-wait 一起吞掉，
               而等待光标是「翻译中」这个状态唯一的额外反馈。
               而 pointer-events 一放开，:hover 在禁用态也会命中（点完按钮指针本来就停在上面），
               所以还要写 disabled:hover: 把灰底钉死，不能指望 disabled 排在 hover 之后。
               has-[>svg]:px-3 也不能省：size="sm" 自带 has-[>svg]:px-2.5，它的 :has(>svg)
               选择器比裸 px-3 特异性高，不显式盖掉的话左右内边距会比旁边的 VNDB 药丸窄 2px。
               文字在 sm 以下断点隐藏、只剩图标，所以必须给可访问名。 -->
          <Button
            v-if="!hasAnyTranslation"
            type="button"
            size="sm"
            :disabled="isTranslatingAll"
            :aria-label="isTranslatingAll ? '翻译中' : 'AI 翻译'"
            class="h-auto gap-1 rounded-full bg-violet-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-600 has-[>svg]:px-3 disabled:pointer-events-auto disabled:cursor-wait disabled:bg-gray-200 disabled:text-gray-500 disabled:hover:bg-gray-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 dark:disabled:hover:bg-slate-700"
            @click="handleTranslateAll"
          >
            <Loader v-if="isTranslatingAll" :size="14" class="size-3.5 animate-spin" />
            <Bot v-else :size="14" class="size-3.5" />
            <span class="hidden sm:inline">{{ isTranslatingAll ? '翻译中...' : 'AI 翻译' }}</span>
          </Button>
          <!-- 翻译完成后的切换按钮 -->
          <!-- h-auto 让它与右边同样是药丸的 VNDB <a> 等高 -->
          <Button
            v-else
            type="button"
            variant="secondary"
            size="sm"
            :aria-label="showOriginal ? '切换到译文' : '切换到原文'"
            class="h-auto gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-200 has-[>svg]:px-3 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
            @click="toggleAllTranslations"
          >
            <ArrowLeftRight :size="14" class="size-3.5" />
            <span class="hidden sm:inline">{{ showOriginal ? '译文' : '原文' }}</span>
          </Button>

          <!-- VNDB 链接按钮 -->
          <a
            :href="vndbUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-theme-primary hover:bg-theme-primary-dark"
          >
            <ExternalLink :size="14" />
            <span class="hidden sm:inline">VNDB</span>
          </a>

          <!-- 关闭按钮 - 仅桌面端 -->
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="关闭"
            aria-label="关闭"
            class="hidden rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 md:flex dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            @click="open = false"
          >
            <X :size="16" />
          </Button>
        </div>
      </DialogHeader>

      <!-- 内容区域 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <!-- 顶部：封面和基本信息（横向排列） -->
          <div class="vndb-card !p-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <!-- 封面图 -->
              <div v-if="searchStore.vndbInfo.mainImageUrl" class="sm:w-40 md:w-48 flex-shrink-0">
                <!-- 只是一块包住 <img> 的点击热区，Button 的 inline-flex/h-9/px-4 全要推翻，
                     所以保留原生。aria-label 不能省：否则可访问名会取 <img alt>（游戏主标题），
                     屏幕阅读器只会念出游戏名，读不出「点了会打开大图」 -->
                <button
                  type="button"
                  class="block w-full"
                  aria-label="查看封面大图"
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
                    class="px-2 py-0.5 bg-theme-primary/10 dark:bg-theme-primary-darker/30 text-theme-primary dark:text-theme-primary-light text-xs rounded-full"
                  >
                    {{ name }}
                  </span>
                  <!-- 必须与上面那串视觉完全一致的别名 <span> 药丸像素级对齐，
                       而 span 换不成 Button，所以这一半也保留原生 -->
                  <button
                    v-if="searchStore.vndbInfo.names.length > 4"
                    type="button"
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
                <AlignLeft :size="16" class="text-theme-primary" />
                <h3 class="text-sm font-bold text-gray-800 dark:text-white">简介</h3>
                <Loader v-if="isTranslating" :size="12" class="animate-spin text-theme-primary" />
              </div>
              <!-- AI 译文标签 - 右上角 -->
              <div 
                v-if="translatedDescription && !showOriginal" 
                class="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-theme-primary to-theme-accent text-white text-[10px] rounded-full"
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
                <Button
                  v-if="searchStore.vndbInfo.relations.length > 5"
                  type="button"
                  variant="link"
                  size="sm"
                  class="mt-1.5 h-auto w-full py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                  @click="toggleSection('relations')"
                >
                  {{ expandedSections.relations ? '收起' : `+${searchStore.vndbInfo.relations.length - 5} 更多` }}
                </Button>
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
              <Button
                v-if="characters.length > 8"
                type="button"
                variant="link"
                size="sm"
                class="h-auto p-0 text-[10px] font-medium text-rose-600 dark:text-rose-400"
                @click="toggleSection('characters')"
              >
                {{ expandedSections.characters ? '收起' : `全部` }}
              </Button>
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
                <Button
                  v-if="quotes.length > 3"
                  type="button"
                  variant="link"
                  size="sm"
                  class="h-auto p-0 text-[10px] font-medium text-indigo-600 dark:text-indigo-400"
                  @click="toggleSection('quotes')"
                >
                  {{ expandedSections.quotes ? '收起' : `全部` }}
                </Button>
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
                  href="https://www.touchgal.ink/" 
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
                <Image :size="16" class="text-theme-accent" />
                <h4 class="text-sm font-bold text-gray-800 dark:text-white">截图</h4>
                <span class="text-xs text-gray-400">({{ searchStore.vndbInfo.screenshots.length }})</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <!-- 同封面图：纯点击热区，保留原生。显式 aria-label 是为了让可访问名说清
                     「查看」这个动作，而不是沿用 <img alt> 那个纯描述性的「截图 N」 -->
                <button
                  v-for="(screenshot, index) in searchStore.vndbInfo.screenshots"
                  :key="index"
                  type="button"
                  class="group block overflow-hidden rounded-lg hover:scale-[1.02] transition-transform bg-gray-100 dark:bg-slate-700"
                  :aria-label="`查看截图 ${index + 1}`"
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
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { fetchVndbCharacters, fetchVndbQuotes, fetchGameVideoUrl } from '@/api'
import type { VndbCharacter, VndbQuote } from '@/api'
import { playTap, playTransitionUp, playTransitionDown } from '@/composables/useSound'
import { useImageViewer } from '@/composables/useImageViewer'
import { useVndbTranslation } from '@/composables/useVndbTranslation'
import {
  formatDate,
  formatPlatform,
  formatLanguage,
  renderDescription,
  formatDevStatus,
  getDevStatusColor,
  getTagCategoryClass,
  formatRelation,
} from '@/utils/vndbFormat'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
} from '@lucide/vue'

// 图片预览
const imageViewer = useImageViewer()

const searchStore = useSearchStore()
const uiStore = useUIStore()

/**
 * Reka 处理 Esc 与点击遮罩时只把 open 置为 false，不经过组件里的函数，
 * 所以开关音效都挂在这个 setter 上。原先的 closePanel() 与那个监听
 * isVndbPanelOpen 只为放开启音的 watch 一并去掉。
 */
const open = computed({
  get: () => uiStore.isVndbPanelOpen,
  set: (value: boolean) => {
    if (value) { playTransitionUp() } else { playTransitionDown() }
    uiStore.isVndbPanelOpen = value
  },
})

/**
 * 翻译状态与逻辑全部来自 useVndbTranslation —— 描述、标签、名言三套翻译状态
 * 加一键翻译，共 13 个 ref、2 个计算属性和 6 个函数，约 150 行。
 *
 * 迁移前这些在本组件里有一份逐字重复的内联实现，而 composable 本身零 importer
 * 躺在那里。两份逻辑等价（都用 try/finally 兜住 isTranslatingAll），区别只是
 * composable 把 vndbInfo / quotes / currentVnId 改成了参数而非直接读 store。
 */
const {
  isTranslating,
  translatedDescription,
  showOriginal,
  isTranslatingTags,
  translatedTags,
  showOriginalTags,
  isTranslatingQuotes,
  translatedQuotes,
  showOriginalQuotes,
  isTranslatingAll,
  hasAnyTranslation,
  resetTranslation,
  handleTranslateAll: translateAll,
  handleTranslateAllSilent: translateAllSilent,
  toggleAllTranslations,
  getTagDisplayName: tagDisplayName,
  getQuoteDisplayText,
} = useVndbTranslation()

// 角色和名言
const characters = ref<VndbCharacter[]>([])
const quotes = ref<VndbQuote[]>([])
const isLoadingCharacters = ref(false)
const isLoadingQuotes = ref(false)


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
  // 三套翻译状态一次性重置（composable 内部处理）
  resetTranslation()
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

/**
 * 模板里按 { name } 传标签对象，composable 的 getTagDisplayName 收字符串，
 * 这里做一层适配，避免改动模板中的 v-for 结构。
 */
function getTagDisplayName(tag: { name: string }): string {
  return tagDisplayName(tag.name)
}

// composable 的翻译函数需要当前游戏数据作为参数（它不直接读 store）
async function handleTranslateAll() {
  await translateAll(searchStore.vndbInfo, quotes.value, currentVnId.value)
}

async function handleTranslateAllSilent() {
  await translateAllSilent(searchStore.vndbInfo, quotes.value, currentVnId.value)
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

// 格式化日期
/**
 * 展示用的格式化函数（日期/平台/语言/开发状态/标签分类/关系/描述富文本）
 * 已抽到 utils/vndbFormat.ts —— 它们是纯函数，与渲染无关。
 */

const renderedDescription = computed(() => {
  const text = showOriginal.value || !translatedDescription.value 
    ? searchStore.vndbInfo?.description 
    : translatedDescription.value
  return renderDescription(text || '')
})
</script>

<style>
/* VNDB 面板 - 半透明效果 */
.vndb-page {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
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
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* VNDB 卡片 - 亮色模式 */
.vndb-card {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card-inner, 0.75));
  border-radius: var(--radius-xl, 1.25rem);
  padding: var(--spacing-lg, 1.25rem);
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.08));
}

/* VNDB 卡片 - 暗色模式 */
.dark .vndb-card {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-card-inner-dark, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

/* 滚动条与链接色都走品牌变量：用户在调色盘换主题色后这几处要跟着变，
   写死 hex 会留下一条永远是粉色的滚动条 */
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(var(--brand-primary)), rgb(var(--brand-accent)));
  border-radius: var(--radius-full, 9999px);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(var(--brand-primary-dark)), rgb(var(--brand-accent-dark)));
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
  color: rgb(var(--brand-primary));
  text-decoration: none;
  transition: color 0.2s;
}

.prose-description :deep(a:hover) {
  text-decoration: underline;
}

.dark .prose-description :deep(a) {
  color: rgb(var(--brand-primary-light));
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
  background: rgba(var(--brand-primary), 0.1);
  color: inherit;
}

.dark .prose-description :deep(.spoiler-text) {
  background: rgba(255, 255, 255, 0.8);
}

.dark .prose-description :deep(.spoiler-text:hover) {
  background: rgba(var(--brand-primary-light), 0.2);
}
</style>
