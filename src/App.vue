<template>
  <div class="app-container" :class="{ dark: isDark }">
    <div class="theme-toggle-fixed">
      <button class="btn btn-icon" @click="toggleTheme" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <button class="btn btn-icon" @click="logout" title="Cerrar sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>
    
    <div v-if="!isAuthenticated" class="login-screen">
      <div class="login-box">
        <div class="login-header">
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png" alt="Tux" class="tux-logo" />
          <h1>QR Generator</h1>
          <span class="subtitle">by Magm</span>
        </div>
        <form @submit.prevent="login">
          <div class="input-group">
            <label>Usuario</label>
            <input v-model="username" type="text" placeholder="Ingresa tu usuario" class="input" />
          </div>
          <div class="input-group">
            <label>Password</label>
            <input v-model="password" type="password" placeholder="Ingresa tu password" class="input" />
          </div>
          <button type="submit" class="btn btn-primary btn-block">Entrar</button>
        </form>
        <p v-if="loginError" class="error">Usuario o password incorrecto</p>
      </div>
    </div>
    
    <div v-else class="app-main">
      <header>
        <h1>QR Generator - by Magm</h1>
      </header>
      
      <main>
        <div class="tabs">
          <button :class="['tab', { active: activeTab === 'generator' }]" @click="switchTab('generator')">
            Generador
          </button>
          <button :class="['tab', { active: activeTab === 'editor' }]" @click="switchTab('editor')">
            Editor de Plantilla
          </button>
        </div>
        
        <div class="tab-content">
          <div v-show="activeTab === 'generator'" class="panel">
            <QRGenerator @qr-ready="handleQRReady" ref="generator" />
          </div>
          
          <div v-show="activeTab === 'editor'" class="panel">
            <TemplateEditor :qr-text="currentQRText" :is-dark="isDark" ref="editor" />
          </div>
        </div>
      </main>
      
      <footer>
        <p>QR Generator - by Magm</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QRGenerator from './components/QRGenerator.vue'
import TemplateEditor from './components/TemplateEditor.vue'
import { validatePassword } from './auth.js'

const isAuthenticated = ref(false)
const username = ref('')
const password = ref('')
const loginError = ref(false)
const activeTab = ref('generator')
const currentQRText = ref('https://github.com/magm3333/qrgen')
const generator = ref(null)
const editor = ref(null)
const isDark = ref(true)

const handleKeydown = (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    e.preventDefault()
    logout()
  }
}

const login = async () => {
  const valid = await validatePassword(username.value, password.value)
  if (valid) {
    isAuthenticated.value = true
    loginError.value = false
    localStorage.setItem('qrgen_user', username.value)
  } else {
    loginError.value = true
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('qrgen_theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  const savedTheme = localStorage.getItem('qrgen_theme')
  if (savedTheme === 'light') {
    isDark.value = false
    applyTheme()
  } else {
    isDark.value = true
  }
})

const logout = () => {
  isAuthenticated.value = false
  username.value = ''
  password.value = ''
  localStorage.removeItem('qrgen_user')
}

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const switchTab = (tab) => {
  if (tab === 'editor') {
    if (generator.value) {
      currentQRText.value = generator.value.getText() || currentQRText.value
    }
  }
  activeTab.value = tab
  localStorage.setItem('qrgen_tab', tab)
}

const handleQRReady = () => {
  if (generator.value) {
    currentQRText.value = generator.value.getText()
  }
}

onMounted(() => {
  applyTheme()
  const savedTheme = localStorage.getItem('qrgen_theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  }
  
  const savedTab = localStorage.getItem('qrgen_tab')
  if (savedTab) {
    activeTab.value = savedTab
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.theme-toggle-fixed {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  border-color: var(--primary);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  stroke: var(--text);
  stroke-width: 2;
  fill: none;
}

.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-box {
  background: var(--surface);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 100%;
  max-width: 380px;
}

.login-header {
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.75rem;
  margin: 0.5rem 0 0;
  color: var(--primary);
}

.login-header .subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.tux-logo {
  width: 72px;
  height: 72px;
}

.login-box form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.login-box .input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
}

.btn-block {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.app-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background: var(--surface);
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.login-box .error {
  color: var(--error);
  margin-top: 0.5rem;
}
</style>