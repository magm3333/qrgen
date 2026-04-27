<template>
  <div class="qr-generator">
    <div class="input-section">
      <label for="qr-text">Contenido del QR</label>
      <input
        id="qr-text"
        v-model="text"
        type="text"
        placeholder="Ingresa texto, URL o datos para el QR"
        @input="generateQR"
      />
    </div>
    
    <div class="preview-section">
      <label>Vista previa</label>
      <div class="qr-preview" ref="previewContainer">
        <canvas ref="qrCanvas"></canvas>
        <div v-if="!text" class="placeholder">
          El QR aparecerá aquí
        </div>
      </div>
    </div>
    
    <div class="options-section">
      <label>Opciones</label>
      <div class="options-grid">
        <div class="option">
          <span>Tamaño</span>
          <select v-model="size" @change="generateQR">
            <option :value="128">128px</option>
            <option :value="256">256px</option>
            <option :value="512">512px</option>
          </select>
        </div>
        <div class="option">
          <span>Nivel de corrección</span>
          <select v-model="errorCorrectionLevel" @change="generateQR">
            <option value="L">L (7%)</option>
            <option value="M">M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </div>
        <div class="option">
          <span>Color</span>
          <input type="color" v-model="color" @change="generateQR" />
        </div>
        <div class="option">
          <span>Fondo</span>
          <input type="color" v-model="backgroundColor" @change="generateQR" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const text = ref('https://github.com/magm3333/qrgen')
const qrCanvas = ref(null)
const previewContainer = ref(null)
const size = ref(256)
const errorCorrectionLevel = ref('M')
const color = ref('#000000')
const backgroundColor = ref('#ffffff')

const emit = defineEmits(['qr-ready'])

const generateQR = async () => {
  if (!text.value.trim()) {
    return
  }
  
  try {
    await QRCode.toCanvas(qrCanvas.value, text.value, {
      width: size.value,
      margin: 2,
      color: {
        dark: color.value,
        light: backgroundColor.value
      },
      errorCorrectionLevel: errorCorrectionLevel.value
    })
    
    emit('qr-ready', qrCanvas.value)
  } catch (err) {
    console.error('Error generating QR:', err)
  }
}

onMounted(() => {
  generateQR()
})

defineExpose({
  getCanvas: () => qrCanvas.value,
  getText: () => text.value
})
</script>

<style scoped>
.qr-generator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-section,
.preview-section,
.options-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-section label,
.preview-section label,
.options-section label {
  font-weight: 500;
  color: var(--text);
  font-size: 0.9rem;
}

.preview-section {
  align-items: center;
}

.qr-preview {
  width: 256px;
  height: 256px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.qr-preview canvas {
  max-width: 100%;
  max-height: 100%;
}

.placeholder {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.option select,
.option input[type="color"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}

.option input[type="color"] {
  height: 40px;
  padding: 2px;
  cursor: pointer;
}
</style>