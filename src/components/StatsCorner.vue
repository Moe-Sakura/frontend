<template>
  <div
    class="fixed top-4 left-4 z-40 flex flex-col gap-2 animate-fade-in"
  >
    <!-- 访问统计 -->
    <div
      class="stats-card bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-white/30 dark:border-slate-700/50"
    >
      <div class="flex items-center gap-2">
        <i class="fas fa-eye text-pink-500 dark:text-purple-400"></i>
        <span id="busuanzi_value_page_pv" class="font-semibold text-gray-800 dark:text-slate-100">-</span>
      </div>
      <div class="w-px h-4 bg-gray-300 dark:bg-slate-600"></div>
      <div class="flex items-center gap-2">
        <i class="fas fa-user text-pink-500 dark:text-purple-400"></i>
        <span id="busuanzi_value_site_uv" class="font-semibold text-gray-800 dark:text-slate-100">-</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 左上角访客统计组件
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .stats-card {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>

