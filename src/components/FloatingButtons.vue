<template>
  <div class="floating-buttons fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-2 sm:gap-3 z-40">
    <!-- 回到顶部按钮 -->
    <button
      v-show="showScrollToTop"
      @click="scrollToTop"
      aria-label="回到顶部"
      class="fab-button scroll-top-btn"
    >
      <i class="fas fa-arrow-up"></i>
    </button>

    <!-- 作品介绍按钮 -->
    <button
      v-show="searchStore.vndbInfo"
      @click="toggleVndbPanel"
      :aria-label="searchStore.isVndbPanelOpen ? '关闭作品介绍' : '打开作品介绍'"
      class="fab-button vndb-btn"
      :class="{ 'vndb-open': searchStore.isVndbPanelOpen }"
    >
      <i
        :class="
          searchStore.isVndbPanelOpen ? 'fas fa-times' : 'fas fa-book'
        "
      ></i>
    </button>

    <!-- 评论按钮 -->
    <button
      @click="toggleComments"
      :aria-label="searchStore.isCommentsModalOpen ? '关闭评论' : '打开评论'"
      class="fab-button comments-btn"
      :class="{ 'comments-open': searchStore.isCommentsModalOpen }"
    >
      <i
        :class="
          searchStore.isCommentsModalOpen ? 'fas fa-times' : 'fas fa-comment'
        "
      ></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useSearchStore } from "@/stores/search";

const searchStore = useSearchStore();
const showScrollToTop = ref(false);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleComments() {
  searchStore.toggleCommentsModal();
}

function toggleVndbPanel() {
  searchStore.toggleVndbPanel();
}

function handleScroll() {
  showScrollToTop.value = window.scrollY > 200;
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.fab-button {
  width: 48px;
  height: 48px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
  .fab-button {
    width: 56px;
    height: 56px;
    border-radius: 24px;
    font-size: 24px;
  }
}

.fab-button:hover {
  box-shadow: 0 12px 36px rgba(236, 72, 153, 0.5), 0 6px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px) scale(1.08) rotate(5deg);
}

.fab-button:active {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

.scroll-top-btn {
  background: linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229));
  color: white;
}

.comments-btn {
  background: linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119));
  color: white;
}

.comments-btn.comments-open {
  background: linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128));
  color: white;
}

.vndb-btn {
  background: linear-gradient(135deg, rgb(139, 92, 246), rgb(124, 58, 237));
  color: white;
}

.vndb-btn.vndb-open {
  background: linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128));
  color: white;
}

.fab-button i {
  transition: transform 0.3s ease;
}

.fab-button:hover i {
  transform: scale(1.1);
}
</style>
