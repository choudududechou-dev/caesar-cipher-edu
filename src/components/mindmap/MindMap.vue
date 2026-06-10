<script setup lang="ts">
import { ref, computed } from 'vue'

interface MindNode {
  id: string
  label: string
  icon: string
  children?: MindNode[]
}

const nodes = ref<MindNode>({
  id: 'root',
  label: '凯撒密码',
  icon: '🔐',
  children: [
    {
      id: 'principle',
      label: '加密原理',
      icon: '📐',
      children: [
        { id: 'p1', label: '字母位移：E(x)=(x+k) mod 26', icon: '🔤' },
        { id: 'p2', label: '偏移量k就是密钥', icon: '🔑' },
        { id: 'p3', label: '加密与解密互为逆运算', icon: '🔄' },
      ],
    },
    {
      id: 'tools',
      label: '加密工具',
      icon: '🛠️',
      children: [
        { id: 't1', label: '凯撒密码盘', icon: '🎯' },
        { id: 't2', label: '纸条式密码', icon: '📏' },
        { id: 't3', label: '中文编码表', icon: '🀄' },
      ],
    },
    {
      id: 'evolution',
      label: '密码进化',
      icon: '📈',
      children: [
        { id: 'e1', label: '凯撒→维吉尼亚→豪密→Enigma', icon: '⏳' },
        { id: 'e2', label: '对称加密→非对称加密', icon: '🔗' },
        { id: 'e3', label: '现代HTTPS/TLS', icon: '🌐' },
      ],
    },
    {
      id: 'modern',
      label: '现代应用',
      icon: '📱',
      children: [
        { id: 'm1', label: '二次验证(2FA)', icon: '📲' },
        { id: 'm2', label: '真人验证(CAPTCHA)', icon: '🤖' },
        { id: 'm3', label: '生物识别', icon: '👆' },
      ],
    },
    {
      id: 'quanzhou',
      label: '泉州·海丝密码',
      icon: '🏮',
      children: [
        { id: 'q1', label: '刺桐港商船密信', icon: '⛵' },
        { id: 'q2', label: '世遗22处密码练习', icon: '🏛️' },
        { id: 'q3', label: '市舶司贸易加密', icon: '📜' },
      ],
    },
  ],
})

const expandedNodes = ref<Set<string>>(new Set(['root', 'principle', 'tools', 'evolution', 'modern', 'quanzhou']))

function toggleNode(id: string) {
  if (expandedNodes.value.has(id)) {
    expandedNodes.value.delete(id)
  } else {
    expandedNodes.value.add(id)
  }
}

function renderNode(node: MindNode, level: number = 0, isLast: boolean = true, parentPrefix: string = ''): any[] {
  const results: any[] = []
  const isExpanded = expandedNodes.value.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  results.push({ type: 'node', node, level, isLast, parentPrefix, hasChildren, isExpanded })

  if (hasChildren && isExpanded) {
    const prefix = parentPrefix + (isLast ? '    ' : '│   ')
    node.children!.forEach((child, i) => {
      const childResults = renderNode(child, level + 1, i === node.children!.length - 1, prefix)
      results.push(...childResults)
    })
  }

  return results
}

const renderedNodes = computed(() => renderNode(nodes.value))
</script>

<template>
  <div class="mindmap">
    <h3>🧠 知识回顾：凯撒密码知识图谱</h3>
    <div class="mindmap-tree">
      <div
        v-for="(item, i) in renderedNodes"
        :key="i"
        class="tree-node"
        :style="{ paddingLeft: (item.level * 28) + 'px' }"
      >
        <div class="node-row" @click="item.hasChildren ? toggleNode(item.node.id) : null">
          <span class="tree-prefix">{{ item.parentPrefix }}{{ item.isLast ? '└──' : '├──' }}</span>
          <span v-if="item.hasChildren" class="expand-icon">
            {{ item.isExpanded ? '▼' : '▶' }}
          </span>
          <span v-else class="expand-icon leaf">•</span>
          <span class="node-icon">{{ item.node.icon }}</span>
          <span class="node-label" :class="{ root: item.level === 0, branch: item.hasChildren }">
            {{ item.node.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mindmap {
  padding: 16px 0;
}
.mindmap h3 {
  margin-bottom: 20px;
}
.mindmap-tree {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 2;
}
.tree-node {
  white-space: pre;
}
.node-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: default;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.node-row:hover {
  background: var(--qz-stone-light);
}
.tree-prefix {
  color: var(--qz-stone-dark);
  white-space: pre;
}
.expand-icon {
  font-size: 0.7rem;
  color: var(--qz-red);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  cursor: pointer;
}
.expand-icon.leaf {
  color: var(--qz-stone-dark);
  cursor: default;
}
.node-icon {
  font-size: 1rem;
}
.node-label {
  font-size: 0.95rem;
}
.node-label.root {
  font-weight: 700;
  color: var(--qz-red);
  font-size: 1.1rem;
}
.node-label.branch {
  font-weight: 600;
  color: var(--qz-dark);
}
</style>
