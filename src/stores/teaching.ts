import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TeachingSection =
  | 'intro'
  | 'life-password'
  | 'principle'
  | 'cipher-disk'
  | 'strip-cipher'
  | 'exercises'
  | 'evolution'
  | 'contest'
  | 'review'

export const useTeachingStore = defineStore('teaching', () => {
  const currentSection = ref<TeachingSection>('intro')
  const sections = ref([
    { id: 'intro' as TeachingSection, title: '情境导入', duration: 5 },
    { id: 'life-password' as TeachingSection, title: '生活中的密码', duration: 3 },
    { id: 'principle' as TeachingSection, title: '凯撒密码原理', duration: 5 },
    { id: 'cipher-disk' as TeachingSection, title: '密码盘探究', duration: 8 },
    { id: 'strip-cipher' as TeachingSection, title: '纸条式密码', duration: 6 },
    { id: 'exercises' as TeachingSection, title: '加密解密实战', duration: 5 },
    { id: 'evolution' as TeachingSection, title: '密码进化与现代应用', duration: 8 },
    { id: 'contest' as TeachingSection, title: '密码挑战赛', duration: 5 },
    { id: 'review' as TeachingSection, title: '知识回顾', duration: 3 },
  ])

  function setSection(section: TeachingSection) {
    currentSection.value = section
  }

  function nextSection() {
    const idx = sections.value.findIndex((s) => s.id === currentSection.value)
    if (idx < sections.value.length - 1) {
      currentSection.value = sections.value[idx + 1].id
    }
  }

  function prevSection() {
    const idx = sections.value.findIndex((s) => s.id === currentSection.value)
    if (idx > 0) {
      currentSection.value = sections.value[idx - 1].id
    }
  }

  return { currentSection, sections, setSection, nextSection, prevSection }
})
