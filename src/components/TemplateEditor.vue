<template>
  <div class="template-editor">
    <div class="toolbar">
      <button class="btn btn-secondary" @click="uploadBackground">
        Subir imagen de fondo
      </button>
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleBackgroundUpload"
        style="display: none"
      />
      <button
        class="btn btn-secondary"
        @click="clearBackground"
        :disabled="!backgroundImage"
      >
        Limpiar fondo
      </button>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary" @click="exportPNG">
        Exportar PNG
      </button>
      <button class="btn btn-primary" @click="exportSVG">
        Exportar SVG
      </button>
    </div>
    
    <div class="editor-area">
      <div
        class="canvas-container"
        ref="canvasContainer"
        :style="canvasContainerStyle"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
      >
        <img
          v-if="backgroundImage"
          :src="backgroundImage"
          class="background_layer"
          :style="backgroundImageStyle"
          draggable="false"
        />
        
        <div
          v-if="qrElement"
          class="qr-element"
          :style="qrElementStyle"
          @mousedown.stop="handleQRElementMouseDown"
          ref="qrElement"
        >
          <canvas ref="embeddedQR" class="qr-canvas-embedded"></canvas>
          <div v-if="isSelected" class="resize-handles">
            <div class="handle handle-tl" @mousedown.stop="startResize('tl', $event)"></div>
            <div class="handle handle-tr" @mousedown.stop="startResize('tr', $event)"></div>
            <div class="handle handle-bl" @mousedown.stop="startResize('bl', $event)"></div>
            <div class="handle handle-br" @mousedown.stop="startResize('br', $event)"></div>
            <div class="handle handle-rotate" @mousedown.stop="startRotate($event)">⟳</div>
          </div>
        </div>
        
        <div v-else class="empty-canvas">
          <p>Sube una imagen de fondo para comenzar</p>
          <p class="hint">o genera un QR primero</p>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <div v-if="backgroundImage" class="control-group">
        <label>Tamaño del lienzo</label>
        <div class="size-inputs">
          <input
            type="number"
            v-model.number="canvasWidth"
            @input="updateCanvasSize"
          />
          <span>×</span>
          <input
            type="number"
            v-model.number="canvasHeight"
            @input="updateCanvasSize"
          />
          <span>px</span>
        </div>
      </div>
      
      <div v-if="qrElement" class="control-group">
        <label>Posición</label>
        <div class="position-inputs">
          <div class="input-field">
            <span>X</span>
            <input type="number" v-model.number="qrPosition.x" @input="updateQRPosition" />
          </div>
          <div class="input-field">
            <span>Y</span>
            <input type="number" v-model.number="qrPosition.y" @input="updateQRPosition" />
          </div>
        </div>
      </div>
      
      <div v-if="qrElement" class="control-group">
        <label>Escala</label>
        <input
          type="range"
          v-model.number="qrScale"
          min="0.1"
          max="2"
          step="0.05"
          @input="updateQRScale"
        />
        <span>{{ Math.round(qrScale * 100) }}%</span>
      </div>
      
      <div v-if="qrElement" class="control-group">
        <label>Rotación</label>
        <input
          type="range"
          v-model.number="qrRotation"
          min="0"
          max="360"
          step="1"
          @input="updateQRRotation"
        />
        <span>{{ qrRotation }}°</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  qrText: {
    type: String,
    default: ''
  },
  externalCanvas: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['export-png', 'export-svg'])

const fileInput = ref(null)
const canvasContainer = ref(null)
const qrElement = ref(null)
const embeddedQR = ref(null)

const backgroundImage = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)

const qrPosition = ref({ x: 200, y: 150 })
const qrSize = ref(200)
const qrScale = ref(1)
const qrRotation = ref(0)
const isSelected = ref(true)
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const resizeHandle = ref('')
const rotateStartAngle = ref(0)

const canvasContainerStyle = computed(() => ({
  width: canvasWidth.value + 'px',
  height: canvasHeight.value + 'px'
}))

const backgroundImageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain'
}))

const qrElementStyle = computed(() => ({
  left: qrPosition.value.x + 'px',
  top: qrPosition.value.y + 'px',
  width: (qrSize.value * qrScale.value) + 'px',
  height: (qrSize.value * qrScale.value) + 'px',
  transform: `rotate(${qrRotation.value}deg)`,
  position: 'absolute'
}))

const uploadBackground = () => {
  fileInput.value.click()
}

const handleBackgroundUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      backgroundImage.value = e.target.result
      const img = new Image()
      img.onload = () => {
        canvasWidth.value = img.width
        canvasHeight.value = img.height
        qrPosition.value = {
          x: Math.round(img.width / 2 - qrSize.value / 2),
          y: Math.round(img.height / 2 - qrSize.value / 2)
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
  event.target.value = ''
}

const clearBackground = () => {
  backgroundImage.value = null
  canvasWidth.value = 800
  canvasHeight.value = 600
}

const updateCanvasSize = () => {
  if (qrPosition.value.x > canvasWidth.value - qrSize.value * qrScale.value) {
    qrPosition.value.x = Math.max(0, canvasWidth.value - qrSize.value * qrScale.value)
  }
  if (qrPosition.value.y > canvasHeight.value - qrSize.value * qrScale.value) {
    qrPosition.value.y = Math.max(0, canvasHeight.value - qrSize.value * qrScale.value)
  }
}

const updateQRPosition = () => {
  const maxX = canvasWidth.value - qrSize.value * qrScale.value
  const maxY = canvasHeight.value - qrSize.value * qrScale.value
  qrPosition.value.x = Math.max(0, Math.min(qrPosition.value.x, maxX))
  qrPosition.value.y = Math.max(0, Math.min(qrPosition.value.y, maxY))
}

const updateQRScale = () => {
  const maxSize = Math.min(canvasWidth.value, canvasHeight.value)
  if (qrSize.value * qrScale.value > maxSize) {
    qrSize.value = Math.round(maxSize / qrScale.value)
  }
}

const updateQRRotation = () => {
  qrRotation.value = qrRotation.value % 360
}

const handleCanvasMouseDown = (e) => {
  if (e.target === canvasContainer.value || e.target.classList.contains('background_layer')) {
    isSelected.value = false
  }
}

const handleQRElementMouseDown = (e) => {
  isSelected.value = true
  isDragging.value = true
  isResizing.value = false
  dragStart.value = {
    x: e.clientX - qrPosition.value.x,
    y: e.clientY - qrPosition.value.y
  }
}

const handleCanvasMouseMove = (e) => {
  if (isDragging.value) {
    const containerRect = canvasContainer.value.getBoundingClientRect()
    const newX = e.clientX - containerRect.left - (dragStart.value.x - qrPosition.value.x + (qrSize.value * qrScale.value) / 2)
    const newY = e.clientY - containerRect.top - (dragStart.value.y - qrPosition.value.y + (qrSize.value * qrScale.value) / 2)
    qrPosition.value = {
      x: Math.max(0, Math.min(newX, canvasWidth.value - qrSize.value * qrScale.value)),
      y: Math.max(0, Math.min(newY, canvasHeight.value - qrSize.value * qrScale.value))
    }
  } else if (isResizing.value) {
    handleResize(e)
  } else if (isRotating.value) {
    handleRotate(e)
  }
}

const handleCanvasMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
}

const startResize = (handle, e) => {
  isResizing.value = true
  isDragging.value = false
  resizeHandle.value = handle
  dragStart.value = { x: e.clientX, y: e.clientY, size: qrSize.value, scale: qrScale.value }
}

const handleResize = (e) => {
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  
  let newSize = dragStart.value.size
  
  if (resizeHandle.value.includes('r')) {
    newSize = Math.max(50, dragStart.value.size + dx)
  } else if (resizeHandle.value.includes('l')) {
    newSize = Math.max(50, dragStart.value.size - dx)
  }
  
  if (resizeHandle.value.includes('b')) {
    newSize = Math.max(50, dragStart.value.size + dy)
  } else if (resizeHandle.value.includes('t')) {
    newSize = Math.max(50, dragStart.value.size - dy)
  }
  
  qrSize.value = Math.round(newSize)
  qrScale.value = 1
}

const startRotate = (e) => {
  isRotating.value = true
  const rect = qrElement.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  rotateStartAngle.value = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI - qrRotation.value
}

const handleRotate = (e) => {
  const rect = qrElement.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI
  qrRotation.value = Math.round(angle - rotateStartAngle.value)
}

const generateEmbeddedQR = async () => {
  if (props.qrText && embeddedQR.value) {
    await QRCode.toCanvas(embeddedQR.value, props.qrText, {
      width: qrSize.value,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
  }
}

const exportPNG = () => {
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth.value
  canvas.height = canvasHeight.value
  const ctx = canvas.getContext('2d')
  
  if (backgroundImage.value) {
    const img = new Image()
    img.src = backgroundImage.value
    ctx.drawImage(img, 0, 0, canvasWidth.value, canvasHeight.value)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
  
  if (qrElement.value && props.qrText) {
    const qrImg = new Image()
    const qrcanvas = qrElement.value.querySelector('canvas')
    if (qrcanvas) {
      qrImg.src = qrcanvas.toDataURL()
      qrImg.onload = () => {
        ctx.save()
        ctx.translate(
          qrPosition.value.x + (qrSize.value * qrScale.value) / 2,
          qrPosition.value.y + (qrSize.value * qrScale.value) / 2
        )
        ctx.rotate((qrRotation.value * Math.PI) / 180)
        ctx.drawImage(
          qrImg,
          -(qrSize.value * qrScale.value) / 2,
          -(qrSize.value * qrScale.value) / 2,
          qrSize.value * qrScale.value,
          qrSize.value * qrScale.value
        )
        ctx.restore()
        downloadCanvas(canvas, 'qr-template.png')
      }
    }
  }
}

const exportSVG = async () => {
  if (!props.qrText) return
  
  const QRsvg = await QRCode.toString(props.qrText, {
    type: 'svg',
    width: qrSize.value * qrScale.value,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth.value}" height="${canvasHeight.value}">`
  
  if (backgroundImage.value) {
    svg += `<image href="${backgroundImage.value}" width="${canvasWidth.value}" height="${canvasHeight.value}"/>`
  } else {
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`
  }
  
  const qrX = qrPosition.value.x + (qrSize.value * qrScale.value) / 2
  const qrY = qrPosition.value.y + (qrSize.value * qrScale.value) / 2
  svg += `<g transform="translate(${qrPosition.value.x}, ${qrPosition.value.y}) rotate(${qrRotation.value}, ${qrSize.value * qrScale.value / 2}, ${qrSize.value * qrScale.value / 2})">`
  svg += QRsvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
  svg += '</g></svg>'
  
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'qr-template.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadCanvas = (canvas, filename) => {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

watch(() => props.qrText, () => {
  generateEmbeddedQR()
}, { immediate: true })

defineExpose({
  generateEmbeddedQR
})
</script>

<style scoped>
.template-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toolbar-spacer {
  flex: 1;
}

.editor-area {
  overflow: auto;
  max-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 1rem;
}

.canvas-container {
  position: relative;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  user-select: none;
}

.background_layer {
  pointer-events: none;
}

.qr-element {
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
}

.qr-element:hover {
  border-color: rgba(37, 99, 235, 0.5);
}

.qr-element.selected,
.qr-element:focus {
  border-color: var(--primary);
}

.qr-canvas-embedded {
  max-width: 100%;
  max-height: 100%;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid var(--primary);
  border-radius: 2px;
  pointer-events: auto;
  cursor: pointer;
}

.handle-tl { top: -6px; left: -6px; cursor: nwse-resize; }
.handle-tr { top: -6px; right: -6px; cursor: nesw-resize; }
.handle-bl { bottom: -6px; left: -6px; cursor: nesw-resize; }
.handle-br { bottom: -6px; right: -6px; cursor: nwse-resize; }

.handle-rotate {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: grab;
}

.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-muted);
}

.empty-canvas .hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

.controls {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.size-inputs,
.position-inputs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.size-inputs input,
.position-inputs input {
  width: 70px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}

.input-field {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.input-field span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.control-group input[type="range"] {
  width: 100px;
}
</style>