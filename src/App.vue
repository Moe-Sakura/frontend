<template>
  <div id="app" class="group/body">
    <!-- 背景层 -->
    <div
      id="background-layer"
      :class="{ 'has-image': hasBackgroundImage }"
      :style="backgroundStyle"
    />

    <!-- 倒计时进度条 - Material 3 -->
    <md-linear-progress
      v-if="
        !searchStore.vndbInfo?.screenshotUrl &&
        (countdown > 0 || isLoadingImage)
      "
      :value="progressPercentage / 100"
      class="countdown-progress fixed top-0 left-0 right-0 z-50"
    ></md-linear-progress>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, nextTick } from "vue";
import { useSearchStore } from "@/stores/search";
import gsap from "gsap";

const searchStore = useSearchStore();
const randomImageUrl = ref("");
const isLoadingImage = ref(false);
const countdown = ref(5);
const totalCountdown = 5;
const loadingProgress = ref(0); // 图片加载进度 0-100
let refreshInterval: number | null = null;
let countdownInterval: number | null = null;
let progressInterval: number | null = null;

const hasBackgroundImage = computed(
  () => !!searchStore.vndbInfo?.screenshotUrl || !!randomImageUrl.value
);

// 计算进度条百分比 (从0%到100%)
const progressPercentage = computed(() => {
  // 如果正在加载图片，显示加载进度
  if (isLoadingImage.value) {
    return loadingProgress.value;
  }
  // 否则显示倒计时进度
  return ((totalCountdown - countdown.value) / totalCountdown) * 100;
});

const backgroundStyle = computed(() => {
  // VNDB 截图优先
  if (searchStore.vndbInfo?.screenshotUrl) {
    console.log(
      "[DEBUG] Setting VNDB background image:",
      searchStore.vndbInfo.screenshotUrl
    );
    return {
      backgroundImage: `url(${searchStore.vndbInfo.screenshotUrl})`,
      transition: "background-image 1s ease-in-out",
    };
  }
  // 否则使用随机图
  if (randomImageUrl.value) {
    return {
      backgroundImage: `url(${randomImageUrl.value})`,
      transition: "background-image 1s ease-in-out",
    };
  }
  return {};
});

// 启动倒计时
function startCountdown() {
  countdown.value = totalCountdown;

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      // 倒计时结束，触发加载下一张图
      loadRandomImage();
    }
  }, 1000);
}

// 停止倒计时
function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdown.value = 0; // 设为0隐藏进度条
}

// 启动加载进度模拟
function startLoadingProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
  }

  loadingProgress.value = 0;

  // 模拟加载进度，在 2 秒内从 0% 到 90%
  progressInterval = window.setInterval(() => {
    if (loadingProgress.value < 90) {
      // 使用非线性增长，开始快，后面慢
      const increment = (90 - loadingProgress.value) * 0.1;
      loadingProgress.value += Math.max(increment, 1);
    }
  }, 50);
}

// 停止加载进度
function stopLoadingProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// 预加载并切换随机图
function loadRandomImage() {
  if (isLoadingImage.value) {
    console.log("[DEBUG] Image loading in progress, skipping...");
    return;
  }

  // 停止倒计时，开始加载
  stopCountdown();

  isLoadingImage.value = true;
  loadingProgress.value = 0;

  // 启动模拟进度条
  startLoadingProgress();

  const timestamp = Date.now();
  const newUrl = `https://api.illlights.com/v1/img?t=${timestamp}`;

  console.log("[DEBUG] Preloading random background image:", newUrl);

  // 创建临时 Image 对象预加载
  const img = new Image();

  img.onload = () => {
    console.log("[DEBUG] Image loaded successfully, filling progress to 100%");
    // 停止模拟进度
    stopLoadingProgress();

    // 使用递归 setTimeout 平滑地将进度条跑到 100%
    const fillToHundred = () => {
      if (loadingProgress.value < 100) {
        loadingProgress.value = Math.min(loadingProgress.value + 5, 100);
        setTimeout(fillToHundred, 20);
      } else {
        console.log("[DEBUG] Progress reached 100%, holding for 800ms");
        // 进度条到达 100% 后，保持 800ms 再切换图片
        setTimeout(() => {
          console.log("[DEBUG] Switching background image");
          randomImageUrl.value = newUrl;
          loadingProgress.value = 0;
          // 注意：先切换图片，再设置 isLoadingImage = false，再启动倒计时
          // 这样可以确保进度条在 100% 时保持可见
          setTimeout(() => {
            isLoadingImage.value = false;
            console.log("[DEBUG] Image switched, restarting countdown");
            startCountdown();
          }, 50);
        }, 800);
      }
    };
    fillToHundred();
  };

  img.onerror = () => {
    console.error("[DEBUG] Image load failed:", newUrl);
    stopLoadingProgress();
    isLoadingImage.value = false;
    loadingProgress.value = 0;

    // 即使加载失败，也重启倒计时
    console.log("[DEBUG] Image load failed, restarting countdown");
    startCountdown();
  };

  // 开始加载
  img.src = newUrl;
}

// 监听 VNDB 信息变化
watch(
  () => searchStore.vndbInfo,
  (newInfo: typeof searchStore.vndbInfo) => {
    if (newInfo) {
      console.log("[DEBUG] VNDB Info updated:", {
        mainName: newInfo.mainName,
        screenshotUrl: newInfo.screenshotUrl,
        mainImageUrl: newInfo.mainImageUrl,
      });
      // 如果有 VNDB 截图，停止随机图刷新和倒计时
      if (newInfo.screenshotUrl && refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        stopCountdown();
        console.log("[DEBUG] Stopped random image refresh (VNDB image active)");
      }
    } else {
      // 如果没有 VNDB 截图，恢复随机图刷新（但不启动定时器，由倒计时控制）
      if (!refreshInterval && !countdownInterval) {
        console.log("[DEBUG] Resuming random image refresh");
        loadRandomImage(); // 立即加载一张图，完成后会自动启动倒计时
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  console.log("[DEBUG] App.vue mounted");

  // 首次加载随机图（完成后会自动启动倒计时）
  if (!searchStore.vndbInfo?.screenshotUrl) {
    console.log("[DEBUG] Starting random image load...");
    loadRandomImage();
    console.log(
      "[DEBUG] Started random image auto-refresh with countdown control"
    );
  }

  // 移除 GSAP 动画，直接显示背景
  // GSAP 动画在某些情况下会导致元素保持不可见状态

  // 检查背景层
  setTimeout(() => {
    const bgLayer = document.getElementById("background-layer");
    console.log("[DEBUG] Background layer:", bgLayer);
    console.log("[DEBUG] Background style:", bgLayer?.style.cssText);
    console.log("[DEBUG] Random image URL:", randomImageUrl.value);
  }, 1000);
});

onUnmounted(() => {
  // 清理定时器
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  stopCountdown();
  console.log("[DEBUG] Cleared random image refresh interval");
});
</script>

<style>
@import "tailwindcss";

.countdown-progress {
  --md-linear-progress-active-indicator-color: linear-gradient(
    to right,
    rgb(236, 72, 153),
    rgb(99, 102, 241)
  );
  --md-linear-progress-track-color: rgba(255, 255, 255, 0.2);
  --md-linear-progress-track-height: 4px;
}
</style>
