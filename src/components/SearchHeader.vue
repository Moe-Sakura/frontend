<template>
  <div class="container mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    <div class="flex flex-col items-center gap-4 sm:gap-6">
      <!-- Title with gamepad icon and status -->
      <div
        class="header-title flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-6 sm:my-12 animate-fade-in-down"
      >
        <h1
          class="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] flex items-center gap-2 sm:gap-3"
        >
          <i class="fas fa-gamepad text-pink-400 text-4xl sm:text-5xl lg:text-6xl"></i>
          <span class="whitespace-nowrap">Galgame 聚合搜索</span>
        </h1>
        <a
          href="https://status.searchgal.homes"
          target="_blank"
          rel="noopener noreferrer"
          class="status-link px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-green-600 text-sm sm:text-base font-semibold hover:scale-105 transition-transform shadow-lg"
        >
          <i class="fas fa-check-circle"></i>
          <span>状态</span>
        </a>
      </div>

      <!-- Search Form -->
      <form
        @submit.prevent="handleSearch"
        class="search-form w-full max-w-2xl px-2 sm:px-0 animate-fade-in-up"
      >
        <div class="flex flex-col gap-4">
          <!-- Search Input -->
          <div class="relative">
            <i
              class="fas fa-search absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg sm:text-xl pointer-events-none z-10"
            ></i>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="游戏或补丁关键字词*"
              required
              class="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-2xl bg-white/98 backdrop-blur-md shadow-lg focus:shadow-2xl focus:scale-[1.01] transition-all outline-none border-2 border-transparent focus:border-pink-500"
            />
          </div>

          <!-- Custom API Input -->
          <div class="relative">
            <i
              class="fas fa-link absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-lg sm:text-xl pointer-events-none z-10"
            ></i>
            <input
              v-model="customApi"
              type="url"
              placeholder="自定义 API 地址 (可选)"
              class="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-2xl bg-white/98 backdrop-blur-md shadow-lg focus:shadow-2xl focus:scale-[1.01] transition-all outline-none border-2 border-transparent focus:border-pink-500"
            />
            <p class="text-xs text-white/90 drop-shadow-md mt-2 font-medium">
              例如: https://api.searchgal.homes 或 http://127.0.0.1:8898
            </p>
          </div>

          <!-- Search Button and Mode Selector -->
          <div class="flex flex-col gap-3">
            <button
              type="submit"
              :disabled="searchStore.searchDisabled"
              class="search-button w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i class="fas fa-search"></i>
              <span v-if="!searchStore.isSearching">开始搜索</span>
              <span v-else
                >进度: {{ searchStore.searchProgress.current }} /
                {{ searchStore.searchProgress.total }}</span
              >
            </button>

            <!-- Search Mode Selector -->
            <div class="flex justify-center gap-2 sm:gap-3">
              <button
                type="button"
                @click="searchMode = 'game'"
                :class="[
                  'mode-chip px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2',
                  searchMode === 'game'
                    ? 'bg-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white/90 text-gray-700 hover:bg-white',
                ]"
              >
                <i class="fas fa-gamepad"></i>
                <span>游戏</span>
              </button>
              <button
                type="button"
                @click="searchMode = 'patch'"
                :class="[
                  'mode-chip px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2',
                  searchMode === 'patch'
                    ? 'bg-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white/90 text-gray-700 hover:bg-white',
                ]"
              >
                <i class="fas fa-tools"></i>
                <span>补丁</span>
              </button>
            </div>

            <!-- Busuanzi Statistics -->
            <div
              class="flex justify-center items-center gap-6 text-sm text-white/90 drop-shadow-md font-medium mt-2"
            >
              <span class="flex items-center gap-1">
                <i class="fas fa-eye"></i>
                <span id="busuanzi_value_page_pv" class="font-semibold">-</span>
              </span>
              <span class="flex items-center gap-1">
                <i class="fas fa-user"></i>
                <span id="busuanzi_value_site_uv" class="font-semibold">-</span>
              </span>
            </div>

            <!-- Version and GitHub Info -->
            <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
              <div
                class="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-gray-600 font-medium shadow-md flex items-center gap-2 text-sm"
              >
                <span>251007</span>
              </div>
              <a
                href="https://github.com/Moe-Sakura/SearchGal"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-gray-700 hover:text-pink-500 font-medium hover:scale-105 transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <i class="fab fa-github"></i>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </form>

      <!-- Error Message -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out animate-shake"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="searchStore.errorMessage" class="w-full max-w-2xl">
          <div
            class="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-lg"
          >
            <div class="flex items-center gap-3 text-red-700">
              <i class="fas fa-exclamation-circle text-2xl"></i>
              <div>
                <strong class="font-bold">错误: </strong
                >{{ searchStore.errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Usage Notice -->
      <div class="w-full max-w-4xl mt-6 sm:mt-8 px-2 sm:px-0 animate-fade-in animation-delay-1000">
        <div
          class="usage-notice bg-white/75 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8"
        >
          <h2
            class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2"
          >
            <i class="fas fa-info-circle text-pink-500"></i>
            使用须知
          </h2>
          <ul class="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">
            <li>
              • 首先，衷心感谢
              <a
                href="https://saop.cc/"
                target="_blank"
                class="text-indigo-600 hover:underline font-semibold"
                >@Asuna</a
              >
              大佬提供的服务器和技术支持！没有大佬的魔法，咱可跑不起来！
            </li>
            <li>
              • 本程序纯属
              <strong>爱发电</strong>，仅供绅士们交流学习使用，务必请大家
              <strong>支持正版 Galgame</strong>！入正不亏哦！
            </li>
            <li>
              • 本站只做互联网内容的
              <strong>聚合搬运工</strong
              >，搜索结果均来自第三方站点，下载前请各位自行判断
              <strong>资源安全性</strong>，以免翻车。
            </li>
            <li>
              • 搜索结果会显示不同的<strong>标签</strong>，帮助你快速了解资源特性：
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium ml-1">
                <i class="fas fa-check-circle text-[10px]"></i>直接下载
              </span>
              表示无需登录，
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                <i class="fas fa-user text-[10px]"></i>需登录
              </span>
              表示需要账号，
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                <i class="fas fa-rocket text-[10px]"></i>不限速
              </span>
              表示高速网盘，
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                <i class="fas fa-magnet text-[10px]"></i>BT/磁力
              </span>
              表示种子下载等。
            </li>
            <li>
              • 搜索时请注意关键词长度！<strong>关键词太短</strong>
              可能搜不全（部分站点只显示首批结果），<strong>太长</strong>
              则可能无法精准匹配。建议尝试
              <strong>适当的关键词</strong>，效果更佳~
            </li>
            <li>
              •
              本程序每次查询完毕即断开连接，<strong>严禁任何形式的爆破或恶意爬取</strong>，做个文明的绅士！
            </li>
            <li>
              •
              万一某个站点搜索挂了，先看看自己的魔法是否到位，也可能是站点维护了，或者咱这边的
              <strong>爬虫失效</strong> 了。
            </li>
            <li>
              • 为了支持各 Galgame 站点能长久运营，还请各位把浏览器的
              <strong>广告屏蔽插件</strong>
              关掉，或将这些站点加入白名单。大家建站不易，小小的支持也是大大的动力！
            </li>
            <li>
              • 游戏介绍和人物信息数据由
              <a
                href="https://vndb.org/"
                target="_blank"
                class="text-indigo-600 hover:underline font-semibold"
                >VNDB</a
              >
              提供，由AI大模型翻译，翻译结果不保证准确性，仅作为检索游戏时的参考！
            </li>
            <li>• 郑重呼吁：请务必支持 Galgame 正版！让爱与梦想延续！</li>
            <li>
              • 如果您觉得咱这小工具好用，请移步
              <a
                href="https://github.com/Moe-Sakura/SearchGal"
                target="_blank"
                class="text-indigo-600 hover:underline font-semibold"
                >GitHub</a
              >
              给本项目点个免费的
              <strong>Star</strong> 吧，秋梨膏！你的支持就是咱最大的动力，比心~
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSearchStore } from "@/stores/search";
import { searchGameStream, fetchVndbData } from "@/api/search";

const searchStore = useSearchStore();
const searchQuery = ref("");
const customApi = ref("");
const searchMode = ref<"game" | "patch">("game");

async function handleSearch() {
  if (!searchQuery.value.trim()) return;

  searchStore.clearResults();
  searchStore.isSearching = true;
  searchStore.errorMessage = "";

  const searchParams = new URLSearchParams();
  searchParams.set("game", searchQuery.value.trim());
  searchParams.set("mode", searchMode.value);
  if (customApi.value.trim()) {
    searchParams.set("api", customApi.value.trim());
  }

  try {
    await searchGameStream(searchParams, {
      onTotal: (total) => {
        searchStore.searchProgress = { current: 0, total };
      },
      onProgress: (current, total) => {
        searchStore.searchProgress = { current, total };
      },
      onPlatformResult: (data) => {
        searchStore.setPlatformResult(data.name, data);
      },
      onComplete: () => {
        searchStore.isSearching = false;
      },
      onError: (error) => {
        searchStore.errorMessage = error;
        searchStore.isSearching = false;
      },
    });

    // 获取 VNDB 数据
    if (searchMode.value === "game") {
      const vndbData = await fetchVndbData(searchQuery.value.trim());
      if (vndbData) {
        searchStore.vndbInfo = vndbData;
      }
    }
  } catch (error) {
    searchStore.errorMessage =
      error instanceof Error ? error.message : "搜索失败";
    searchStore.isSearching = false;
  }
}
</script>

<style scoped>
/* 动画 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}
</style>
