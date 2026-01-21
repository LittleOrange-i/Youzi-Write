import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useJailStore = defineStore('jail', () => {
  const isJailModeActive = ref(false)
  
  function setJailMode(active) {
    isJailModeActive.value = active
  }

  return {
    isJailModeActive,
    setJailMode
  }
})
