<template>
  <div id="app" class="group/body">
    <!-- 背景层 -->
    <div
      id="background-layer"
      :class="{ 'has-image': hasBackgroundImage }"
      :style="backgroundStyle"
    />

    <main class="flex-1 flex flex-col min-h-screen">
      <SearchHeader />
      <SearchResults />
      <PlatformNav />
      <FloatingButtons />
      <CommentsModal />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from "vue";
import { useSearchStore } from "@/stores/search";
import SearchHeader from "@/components/SearchHeader.vue";
import SearchResults from "@/components/SearchResults.vue";
import PlatformNav from "@/components/PlatformNav.vue";
import FloatingButtons from "@/components/FloatingButtons.vue";
import CommentsModal from "@/components/CommentsModal.vue";

const searchStore = useSearchStore();
const randomImageUrl = ref("");
let countdownInterval: number | null = null;

const hasBackgroundImage = computed(
  () => !!searchStore.vndbInfo?.screenshotUrl || !!randomImageUrl.value
);

const backgroundImageUrl = computed(() => {
  // VNDB 截图优先
  if (searchStore.vndbInfo?.screenshotUrl) {
    return searchStore.vndbInfo.screenshotUrl;
  }
  // 否则使用随机图
  if (randomImageUrl.value) {
    return randomImageUrl.value;
  }
  return '';
});

const backgroundStyle = computed(() => {
  const url = backgroundImageUrl.value;
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      transition: "background-image 1s ease-in-out",
    };
  }
  return {};
});

// 启动倒计时
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = window.setInterval(() => {
    loadRandomImage();
  }, 5000);
}

// 停止倒计时
function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// 加载随机图
function loadRandomImage() {
  const timestamp = Date.now();
  const newUrl = `https://api.illlights.com/v1/img?t=${timestamp}`;
  
  const img = new Image();
  img.onload = () => {
    randomImageUrl.value = newUrl;
  };
  img.src = newUrl;
}

// 监听 VNDB 信息变化
watch(
  () => searchStore.vndbInfo,
  (newInfo: typeof searchStore.vndbInfo) => {
    if (newInfo?.screenshotUrl) {
      stopCountdown();
    } else if (!countdownInterval) {
      loadRandomImage();
      startCountdown();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!searchStore.vndbInfo?.screenshotUrl) {
    loadRandomImage();
    startCountdown();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>

<style>
@import "tailwindcss";
</style>
