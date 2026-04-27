<template>
  <div class="template-editor">
    <div class="toolbar">
      <div class="toolbar-group">
        <label class="toolbar-label">Fondo</label>
        <button class="btn btn-secondary" @click="triggerFileInput" title="Seleccionar o arrastar imagen">
          Subir
        </button>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          @change="handleBackgroundUpload"
          style="display: none"
        />
        <button class="btn btn-secondary" @click="clearBackground" :disabled="!backgroundImage" title="Quitar imagen de fondo">
          Limpiar
        </button>
      </div>
      
      <div class="toolbar-group">
        <label class="toolbar-label">Proyecto</label>
        <button class="btn btn-secondary" @click="exportProject" title="Guardar proyecto en archivo">
          Exportar
        </button>
        <button class="btn btn-secondary" @click="importProject" title="Cargar proyecto desde archivo">
          Importar
        </button>
        <button class="btn btn-secondary" @click="loadLastProject" title="Cargar ultimo proyecto">
          Ultimo
        </button>
        <input
          type="file"
          ref="projectFileInput"
          accept=".json"
          @change="handleProjectImport"
          style="display: none"
        />
      </div>
      
      <div class="toolbar-spacer"></div>
      
      <div class="toolbar-group">
        <label class="toolbar-label">Exportar</label>
        <button class="btn btn-primary" @click="exportPNG" title="Exportar como imagen PNG">
          PNG
        </button>
        <button class="btn btn-primary" @click="exportSVG" title="Exportar como vector SVG">
          SVG
        </button>
      </div>
    </div>
    
    <div class="url-section">
      <span class="url-label">O usa una URL:</span>
      <input 
        v-model="bgUrl" 
        type="text" 
        placeholder="https://ejemplo.com/imagen.jpg"
        @keyup.enter="loadFromUrl"
        class="url-input"
      />
      <button class="btn btn-secondary" @click="loadFromUrl" :disabled="!bgUrl">
        Cargar
      </button>
    </div>
    
    <div 
      class="editor-area"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="handleDrop"
      :class="{ 'drag-over': dragOver }"
    >
      <div
        class="canvas-container"
        ref="canvasContainer"
        :style="canvasContainerStyle"
      >
        <img
          v-if="backgroundImage"
          :src="backgroundImage"
          class="background_layer"
          draggable="false"
        />
        
        <div
          v-if="hasQR"
          class="qr-container"
          :class="{ selected: isSelected, dragging: isDragging }"
          ref="qrElement"
          :style="qrContainerStyle"
          @mousedown="startDrag"
        >
          <canvas ref="embeddedQR" class="qr-canvas" :style="qrCanvasStyle"></canvas>
          <template v-if="isSelected">
            <div class="handle handle-tl" @mousedown.stop="startResize($event)"></div>
            <div class="handle handle-tr" @mousedown.stop="startResize($event)"></div>
            <div class="handle handle-bl" @mousedown.stop="startResize($event)"></div>
            <div class="handle handle-br" @mousedown.stop="startResize($event)"></div>
            <div class="handle-rotate" @mousedown.stop="startRotate($event)">↻</div>
          </template>
        </div>
        
        <div v-if="!hasQR" class="empty-canvas">
          <p>Genera un QR primero en la pestana Generador</p>
          <p class="hint">Luego vuelve aqui para colocarlo en la plantilla</p>
          <p class="hint">Arrastra una imagen aqui para usarla como fondo</p>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label>Posicion</label>
        <input type="number" :value="qrPosition.x" @input="qrPosition.x = Number($event.target.value)" />
        <input type="number" :value="qrPosition.y" @input="qrPosition.y = Number($event.target.value)" />
      </div>
      
      <div class="control-group">
        <label>Escala</label>
        <input type="range" :value="qrScale" @input="qrScale = Number($event.target.value)" min="0.1" max="2" step="0.05" />
        <span>{{ Math.round(qrScale * 100) }}%</span>
      </div>
      
      <div class="control-group">
        <label>Rotacion</label>
        <input type="range" :value="qrRotation" @input="qrRotation = Number($event.target.value)" min="0" max="360" step="1" />
        <span>{{ qrRotation }}°</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  qrText: { type: String, default: '' },
  isDark: { type: Boolean, default: false }
})

const fileInput = ref(null)
const projectFileInput = ref(null)
const canvasContainer = ref(null)
const qrElement = ref(null)
const embeddedQR = ref(null)

const backgroundImage = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)
const bgUrl = ref('')
const dragOver = ref(false)

const qrPosition = ref({ x: 200, y: 150 })
const qrSize = ref(200)
const qrScale = ref(1)
const qrRotation = ref(0)
const hasQR = ref(false)
const isSelected = ref(true)
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, size: 200 })
const rotateStartAngle = ref(0)

const canvasContainerStyle = computed(() => ({
  width: canvasWidth.value + 'px',
  height: canvasHeight.value + 'px'
}))

const qrContainerStyle = computed(() => {
  const size = Math.round(qrSize.value * qrScale.value)
  return {
    left: qrPosition.value.x + 'px',
    top: qrPosition.value.y + 'px',
    width: size + 'px',
    height: size + 'px',
    transform: `rotate(${qrRotation.value}deg)`,
    position: 'absolute'
  }
})

const qrCanvasStyle = computed(() => {
  return {
    width: '100%',
    height: '100%'
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleBackgroundUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    loadImageFromFile(file)
  }
  event.target.value = ''
}

const loadImageFromFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      canvasWidth.value = img.width
      canvasHeight.value = img.height
      backgroundImage.value = e.target.result
      qrPosition.value = {
        x: Math.round(img.width / 2 - qrSize.value / 2),
        y: Math.round(img.height / 2 - qrSize.value / 2)
      }
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleDrop = (e) => {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    loadImageFromFile(file)
  }
}

const loadFromUrl = async () => {
  if (!bgUrl.value) return
  try {
    backgroundImage.value = bgUrl.value
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvasWidth.value = img.width
      canvasHeight.value = img.height
      qrPosition.value = {
        x: Math.round(img.width / 2 - qrSize.value / 2),
        y: Math.round(img.height / 2 - qrSize.value / 2)
      }
    }
    img.onerror = () => {
      backgroundImage.value = null
      bgUrl.value = ''
    }
    img.src = bgUrl.value
  } catch (e) {
    console.error('Error loading URL:', e)
  }
}

const clearBackground = () => {
  backgroundImage.value = null
  canvasWidth.value = 800
  canvasHeight.value = 600
  bgUrl.value = ''
}

const exportProject = () => {
  const project = {
    qrText: props.qrText,
    backgroundImage: backgroundImage.value,
    canvasWidth: canvasWidth.value,
    canvasHeight: canvasHeight.value,
    qrPosition: qrPosition.value,
    qrSize: qrSize.value,
    qrScale: qrScale.value,
    qrRotation: qrRotation.value
  }
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = 'qr-project.json'
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
  localStorage.setItem('qrgen_last_project', JSON.stringify(project))
}

const importProject = () => projectFileInput.value?.click()

const loadLastProject = () => {
  try {
    const saved = localStorage.getItem('qrgen_last_project')
    if (saved) {
      const project = JSON.parse(saved)
      if (project.backgroundImage) backgroundImage.value = project.backgroundImage
      if (project.canvasWidth) canvasWidth.value = project.canvasWidth
      if (project.canvasHeight) canvasHeight.value = project.canvasHeight
      if (project.qrPosition) qrPosition.value = project.qrPosition
      if (project.qrSize) qrSize.value = project.qrSize
      if (project.qrScale) qrScale.value = project.qrScale
      if (project.qrRotation) qrRotation.value = project.qrRotation
      generateEmbeddedQR()
    }
  } catch (e) {
    console.error('Error loading last project:', e)
  }
}

const handleProjectImport = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result)
        if (project.backgroundImage) backgroundImage.value = project.backgroundImage
        if (project.canvasWidth) canvasWidth.value = project.canvasWidth
        if (project.canvasHeight) canvasHeight.value = project.canvasHeight
        if (project.qrPosition) qrPosition.value = project.qrPosition
        if (project.qrSize) qrSize.value = project.qrSize
        if (project.qrScale) qrScale.value = project.qrScale
        if (project.qrRotation) qrRotation.value = project.qrRotation
        generateEmbeddedQR()
      } catch (err) {
        console.error('Error importing project:', err)
      }
    }
    reader.readAsText(file)
  }
  event.target.value = ''
}

const updateQRPosition = () => {
  const qrW = qrSize.value * qrScale.value
  const qrH = qrSize.value * qrScale.value
  qrPosition.value.x = Math.max(0, Math.min(qrPosition.value.x, canvasWidth.value - qrW))
  qrPosition.value.y = Math.max(0, Math.min(qrPosition.value.y, canvasHeight.value - qrH))
}

const startDrag = (e) => {
  if (e.target.classList.contains('handle') || e.target.classList.contains('handle-rotate')) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY, px: qrPosition.value.x, py: qrPosition.value.y }
  document.addEventListener('mousemove', onDrag, { passive: false })
  document.addEventListener('mouseup', onStopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  qrPosition.value = { x: dragStart.value.px + dx, y: dragStart.value.py + dy }
}

const onStopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onStopDrag)
}

const startResize = (e) => {
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  resizeStart.value = { x: e.clientX, y: e.clientY, size: qrSize.value }
  document.addEventListener('mousemove', onResize, { passive: false })
  document.addEventListener('mouseup', onStopResize)
}

const onResize = (e) => {
  if (!isResizing.value) return
  e.preventDefault()
  const delta = Math.max(e.clientX - resizeStart.value.x, e.clientY - resizeStart.value.y)
  qrSize.value = Math.max(50, resizeStart.value.size + delta)
  qrScale.value = 1
}

const onStopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', onStopResize)
}

const startRotate = (e) => {
  e.preventDefault()
  e.stopPropagation()
  isRotating.value = true
  const rect = qrElement.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  rotateStartAngle.value = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI - qrRotation.value
  document.addEventListener('mousemove', onRotate, { passive: false })
  document.addEventListener('mouseup', onStopRotate)
}

const onRotate = (e) => {
  if (!isRotating.value) return
  e.preventDefault()
  const rect = qrElement.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI
  qrRotation.value = Math.round(angle - rotateStartAngle.value)
}

const onStopRotate = () => {
  isRotating.value = false
  document.removeEventListener('mousemove', onRotate)
  document.removeEventListener('mouseup', onStopRotate)
}

const generateEmbeddedQR = async () => {
  hasQR.value = !!props.qrText
  if (props.qrText && embeddedQR.value) {
    const size = Math.round(qrSize.value * qrScale.value)
    await QRCode.toCanvas(embeddedQR.value, props.qrText, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
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
  
  if (hasQR.value && embeddedQR.value) {
    const qrData = embeddedQR.value.toDataURL()
    const qrImg = new Image()
    qrImg.src = qrData
    qrImg.onload = () => {
      const qrW = qrSize.value * qrScale.value
      const qrH = qrSize.value * qrScale.value
      const cx = qrPosition.value.x + qrW / 2
      const cy = qrPosition.value.y + qrH / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((qrRotation.value * Math.PI) / 180)
      ctx.drawImage(qrImg, -qrW / 2, -qrH / 2, qrW, qrH)
      ctx.restore()
      downloadCanvas(canvas, 'qr-template.png')
    }
  }
}

const exportSVG = async () => {
  if (!props.qrText) return
  
  const QRsvg = await QRCode.toString(props.qrText, {
    type: 'svg',
    width: qrSize.value * qrScale.value,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  })
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth.value}" height="${canvasHeight.value}">`
  
  if (backgroundImage.value) {
    svg += `<image href="${backgroundImage.value}" width="${canvasWidth.value}" height="${canvasHeight.value}"/>`
  } else {
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`
  }
  
  const qrW = qrSize.value * qrScale.value
  const qrH = qrSize.value * qrScale.value
  const cx = qrW / 2
  const cy = qrH / 2
  svg += `<g transform="translate(${qrPosition.value.x + cx}, ${qrPosition.value.y + cy}) rotate(${qrRotation.value}) translate(${-cx}, ${-cy})">`
  svg += QRsvg.replace(/<svg[^>]*>|<\/svg>/g, '')
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

onMounted(() => {
  generateEmbeddedQR()
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
  align-items: center;
}

.toolbar-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-right: 0.25rem;
}

.toolbar-spacer {
  flex: 1;
}

.url-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.url-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.url-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.editor-area {
  overflow: auto;
  max-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
  border: 2px dashed var(--border);
  transition: all 0.2s;
}

.editor-area.drag-over {
  border-color: var(--primary);
  background: rgba(37, 99, 235, 0.1);
}

.canvas-container {
  position: relative;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  user-select: none;
}

.background_layer {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.qr-container {
  cursor: grab;
  position: absolute;
}

.qr-container.dragging {
  cursor: grabbing;
}

.qr-container.selected {
  outline: 2px solid var(--primary);
}

.qr-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--primary);
  border: 1px solid white;
  z-index: 10;
}

.handle-tl { top: -5px; left: -5px; cursor: nwse-resize; }
.handle-tr { top: -5px; right: -5px; cursor: nesw-resize; }
.handle-bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
.handle-br { bottom: -5px; right: -5px; cursor: nwse-resize; }

.handle-rotate {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  font-size: 14px;
  font-weight: bold;
  z-index: 11;
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
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.control-group input[type="number"] {
  width: 60px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
}

.control-group input[type="range"] {
  width: 100px;
}
</style>