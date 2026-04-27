<template>
  <div class="repo-verifier">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Verificando repositorio...</span>
    </div>
    <div v-else-if="error" class="error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>
    <div v-else-if="repoExists" class="success">
      <span class="success-icon">✓</span>
      <span>¡He creado el repo <strong>{{ repoName }}</strong>!</span>
    </div>
    <div v-else class="not-found">
      <span>El repo {{ repoName }} no está disponible</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const repoOwner = 'magm3333'
const repoName = 'qrgen'
const loading = ref(true)
const error = ref(null)
const repoExists = ref(false)

onMounted(async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )
    
    if (response.ok) {
      repoExists.value = true
    } else if (response.status === 404) {
      repoExists.value = false
    } else {
      error.value = `Error ${response.status}: No se pudo verificar el repositorio`
    }
  } catch (e) {
    error.value = 'Sin conexión a GitHub'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.repo-verifier {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  background: #fef2f2;
  color: var(--error);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.success {
  background: #f0fdf4;
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
}

.not-found {
  background: #fefce8;
  color: #a16207;
}

.success-icon {
  font-size: 1.2rem;
}

.error-icon {
  font-size: 1.2rem;
}
</style>