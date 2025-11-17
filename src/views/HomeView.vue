<template>
  <main class="flex-1 flex flex-col min-h-screen">
    <SearchHeader />
    <SearchResults />
    <PlatformNav />
    <FloatingButtons />
    <CommentsModal />
    <PageFooter />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SearchHeader from '@/components/SearchHeader.vue'
import SearchResults from '@/components/SearchResults.vue'
import PlatformNav from '@/components/PlatformNav.vue'
import FloatingButtons from '@/components/FloatingButtons.vue'
import CommentsModal from '@/components/CommentsModal.vue'
import PageFooter from '@/components/PageFooter.vue'
import { listen } from 'quicklink'

onMounted(() => {
  // Initialize quicklink for faster navigation
  listen({ priority: true })
})
</script>
