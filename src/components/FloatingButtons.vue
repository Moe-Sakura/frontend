<template>
  <div class="floating-buttons fixed bottom-6 right-6 flex flex-col gap-3 z-40">
    <!-- 回到顶部按钮 -->
    <button
      v-show="showScrollToTop"
      @click="scrollToTop"
      aria-label="回到顶部"
      class="fab-button scroll-top-btn"
    >
      <i class="fas fa-arrow-up"></i>
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
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useSearchStore } from "@/stores/search";
import gsap from "gsap";

const searchStore = useSearchStore();
const showScrollToTop = ref(false);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleComments() {
  searchStore.toggleCommentsModal();
}

function handleScroll() {
  showScrollToTop.value = window.scrollY > 200;
}

onMounted(() => {
  console.log("[DEBUG] FloatingButtons mounted");
  window.addEventListener("scroll", handleScroll);
  handleScroll();

  // 移除入场动画，但保留悬停效果
  nextTick(() => {
    setTimeout(() => {
      const fabs = document.querySelectorAll("md-fab");
      console.log("[DEBUG] Found FAB buttons:", fabs.length);

      // 添加悬停动画效果
      if (fabs.length > 0) {
        fabs.forEach((fab) => {
          fab.addEventListener("mouseenter", () => {
            gsap.to(fab, {
              duration: 0.2,
              scale: 1.1,
              ease: "power2.out",
            });
          });

          fab.addEventListener("mouseleave", () => {
            gsap.to(fab, {
              duration: 0.2,
              scale: 1,
              ease: "power2.out",
            });
          });
        });
      }
    }, 100);
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

.fab-button i {
  transition: transform 0.3s ease;
}

.fab-button:hover i {
  transform: scale(1.1);
}
</style>
