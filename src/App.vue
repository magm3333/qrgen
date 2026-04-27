<template>
  <div class="app-container">
    <header>
      <h1>QR Generator</h1>
      <RepoVerifier />
    </header>
    
    <main>
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'generator' }]"
          @click="activeTab = 'generator'"
        >
          Generador
        </button>
        <button
          :class="['tab', { active: activeTab === 'editor' }]"
          @click="activeTab = 'editor'"
        >
          Editor de Plantilla
        </button>
      </div>
      
      <div class="tab-content">
        <div v-if="activeTab === 'generator'" class="panel">
          <QRGenerator @qr-ready="handleQRReady" ref="generator" />
        </div>
        
        <div v-if="activeTab === 'editor'" class="panel">
          <TemplateEditor
            :qr-text="currentQRText"
            :external-canvas="currentQRCanvas"
            ref="editor"
          />
        </div>
      </div>
    </main>
    
    <footer>
      <p>Generador de QR con editor de plantillas</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RepoVerifier from './components/RepoVerifier.vue'
import QRGenerator from './components/QRGenerator.vue'
import TemplateEditor from './components/TemplateEditor.vue'

const activeTab = ref('generator')
const currentQRText = ref('')
const currentQRCanvas = ref(null)
const generator = ref(null)
const editor = ref(null)

const handleQRReady = (canvas) => {
  currentQRCanvas.value = canvas
  if (generator.value) {
    currentQRText.value = generator.value.getText()
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: var(--surface);
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--primary);
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  bottom: -2px;
  transition: all 0.2s ease;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--primary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

.panel {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

footer {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>