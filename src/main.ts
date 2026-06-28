import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Category = 'seating' | 'tables' | 'storage' | 'sleep' | 'kitchen' | 'decor' | 'plants' | 'lighting' | 'outdoor'

type Block = {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  color: string
}

type Piece = {
  id: string
  name: string
  category: Category
  icon: string
  blocks: Block[]
}

type PlacedPiece = {
  id: number
  pieceId: string
  gx: number
  gz: number
  rotation: number
}

type MovingPerson = {
  group: THREE.Group
  bubble: THREE.Sprite
  bubbleY: number
  originX: number
  originZ: number
  radius: number
  speed: number
  phase: number
}

const CELL = 1
const ROOM_SIZE = 14
const LAND_SIZE = 180
const STORAGE_KEY = 'minicraft-room-v1'
const objectMeshes = new Map<number, THREE.Group>()
const movingPeople: MovingPerson[] = []

const categories: Category[] = ['seating', 'tables', 'storage', 'sleep', 'kitchen', 'decor', 'plants', 'lighting', 'outdoor']

const pieces: Piece[] = [
  piece('armchair', 'Armchair', 'seating', 'C', '#8c5a3c', b(0, 0.25, 0, 0.9, 0.5, 0.8), b(0, 0.75, -0.28, 0.9, 0.8, 0.18), b(-0.46, 0.62, 0, 0.16, 0.48, 0.72), b(0.46, 0.62, 0, 0.16, 0.48, 0.72)),
  piece('sofa', 'Sofa', 'seating', 'S', '#5f7f8f', b(0, 0.26, 0, 1.9, 0.52, 0.8), b(0, 0.78, -0.3, 1.9, 0.85, 0.2), b(-0.98, 0.62, 0, 0.18, 0.52, 0.75), b(0.98, 0.62, 0, 0.18, 0.52, 0.75)),
  piece('stool', 'Stool', 'seating', 'O', '#d29b5b', b(0, 0.48, 0, 0.65, 0.18, 0.65), b(-0.22, 0.22, -0.22, 0.12, 0.45, 0.12), b(0.22, 0.22, -0.22, 0.12, 0.45, 0.12), b(-0.22, 0.22, 0.22, 0.12, 0.45, 0.12), b(0.22, 0.22, 0.22, 0.12, 0.45, 0.12)),
  piece('bench', 'Bench', 'seating', 'B', '#b77842', b(0, 0.5, 0, 1.7, 0.2, 0.48), b(-0.65, 0.23, 0, 0.14, 0.45, 0.38), b(0.65, 0.23, 0, 0.14, 0.45, 0.38)),
  piece('desk-chair', 'Desk Chair', 'seating', 'D', '#35485c', b(0, 0.5, 0, 0.7, 0.22, 0.65), b(0, 0.95, -0.25, 0.7, 0.7, 0.16), b(0, 0.22, 0, 0.16, 0.45, 0.16), b(0, 0.08, 0, 0.8, 0.1, 0.16), b(0, 0.08, 0, 0.16, 0.1, 0.8)),
  piece('coffee-table', 'Coffee Table', 'tables', 'T', '#a36d3b', b(0, 0.48, 0, 1.45, 0.16, 0.85), b(-0.55, 0.23, -0.3, 0.13, 0.45, 0.13), b(0.55, 0.23, -0.3, 0.13, 0.45, 0.13), b(-0.55, 0.23, 0.3, 0.13, 0.45, 0.13), b(0.55, 0.23, 0.3, 0.13, 0.45, 0.13)),
  piece('dining-table', 'Dining Table', 'tables', 'D', '#8b5e34', b(0, 0.78, 0, 1.7, 0.18, 1.2), b(-0.65, 0.38, -0.42, 0.16, 0.72, 0.16), b(0.65, 0.38, -0.42, 0.16, 0.72, 0.16), b(-0.65, 0.38, 0.42, 0.16, 0.72, 0.16), b(0.65, 0.38, 0.42, 0.16, 0.72, 0.16)),
  piece('side-table', 'Side Table', 'tables', 'N', '#c08b54', b(0, 0.55, 0, 0.75, 0.16, 0.75), b(0, 0.27, 0, 0.18, 0.54, 0.18), b(0, 0.08, 0, 0.52, 0.12, 0.52)),
  piece('workbench', 'Workbench', 'tables', 'W', '#916c4a', b(0, 0.72, 0, 1.9, 0.28, 0.78), b(-0.78, 0.35, -0.25, 0.18, 0.7, 0.18), b(0.78, 0.35, -0.25, 0.18, 0.7, 0.18), b(-0.78, 0.35, 0.25, 0.18, 0.7, 0.18), b(0.78, 0.35, 0.25, 0.18, 0.7, 0.18), b(0, 0.98, -0.12, 1.4, 0.18, 0.16)),
  piece('bookshelf', 'Bookshelf', 'storage', 'K', '#7b5632', b(0, 1, 0, 1, 2, 0.35), b(0, 0.5, 0.2, 0.9, 0.08, 0.08), b(0, 1, 0.2, 0.9, 0.08, 0.08), b(0, 1.5, 0.2, 0.9, 0.08, 0.08), b(-0.28, 0.75, 0.24, 0.18, 0.42, 0.1, '#345c83'), b(0.02, 0.75, 0.24, 0.18, 0.42, 0.1, '#b2453d'), b(0.3, 1.25, 0.24, 0.18, 0.42, 0.1, '#d5b25f')),
  piece('dresser', 'Dresser', 'storage', 'R', '#9c6f43', b(0, 0.65, 0, 1.2, 1.3, 0.5), b(0, 0.35, 0.28, 1.05, 0.08, 0.08, '#cfaa75'), b(0, 0.65, 0.28, 1.05, 0.08, 0.08, '#cfaa75'), b(0, 0.95, 0.28, 1.05, 0.08, 0.08, '#cfaa75')),
  piece('wardrobe', 'Wardrobe', 'storage', 'A', '#69533e', b(0, 1.05, 0, 1.2, 2.1, 0.65), b(-0.03, 1.05, 0.36, 0.04, 1.9, 0.06, '#d0b38b'), b(-0.18, 1.05, 0.39, 0.08, 0.08, 0.08, '#d9cfb7'), b(0.18, 1.05, 0.39, 0.08, 0.08, 0.08, '#d9cfb7')),
  piece('crate', 'Crate', 'storage', 'X', '#b98047', b(0, 0.35, 0, 0.8, 0.7, 0.8), b(0, 0.7, 0, 0.9, 0.08, 0.9, '#d09a61'), b(0, 0.35, 0.44, 0.9, 0.1, 0.08, '#7b5632')),
  piece('bed', 'Bed', 'sleep', 'E', '#7e9aad', b(0, 0.28, 0, 1.55, 0.28, 2.05, '#7b5632'), b(0, 0.58, 0.12, 1.5, 0.28, 1.65), b(0, 0.72, -0.65, 1.35, 0.25, 0.45, '#edf0e8'), b(0, 0.72, 0.55, 1.45, 0.16, 0.75, '#d95b51')),
  piece('bunk-bed', 'Bunk Bed', 'sleep', 'U', '#6c8e6a', b(0, 0.35, 0, 1.4, 0.2, 1.9, '#7b5632'), b(0, 1.55, 0, 1.4, 0.2, 1.9, '#7b5632'), b(0, 0.57, 0.3, 1.3, 0.22, 1.2), b(0, 1.77, 0.3, 1.3, 0.22, 1.2), b(-0.68, 0.95, -0.78, 0.12, 1.8, 0.12), b(0.68, 0.95, -0.78, 0.12, 1.8, 0.12), b(-0.68, 0.95, 0.78, 0.12, 1.8, 0.12), b(0.68, 0.95, 0.78, 0.12, 1.8, 0.12)),
  piece('fridge', 'Fridge', 'kitchen', 'F', '#dce7e9', b(0, 1.05, 0, 0.85, 2.1, 0.75), b(0, 1.42, 0.4, 0.76, 0.06, 0.06, '#aabcc4'), b(0.32, 0.85, 0.43, 0.06, 0.55, 0.05, '#6f7f87')),
  piece('stove', 'Stove', 'kitchen', 'V', '#3d4651', b(0, 0.5, 0, 0.9, 1, 0.75), b(-0.22, 1.04, -0.15, 0.24, 0.05, 0.24, '#111318'), b(0.22, 1.04, -0.15, 0.24, 0.05, 0.24, '#111318'), b(-0.22, 1.04, 0.18, 0.24, 0.05, 0.24, '#111318'), b(0.22, 1.04, 0.18, 0.24, 0.05, 0.24, '#111318'), b(0, 0.45, 0.41, 0.62, 0.42, 0.05, '#687383')),
  piece('sink', 'Sink', 'kitchen', 'I', '#8aa2ad', b(0, 0.48, 0, 0.95, 0.95, 0.75, '#75634a'), b(0, 1, 0, 0.75, 0.12, 0.55), b(0.26, 1.15, -0.03, 0.12, 0.3, 0.12, '#becbd0'), b(0.1, 1.27, -0.03, 0.35, 0.08, 0.08, '#becbd0')),
  piece('island', 'Kitchen Island', 'kitchen', 'L', '#b9a074', b(0, 0.55, 0, 1.8, 1.1, 0.9), b(0, 1.13, 0, 2, 0.14, 1.05, '#e7dfce'), b(-0.55, 0.74, 0.5, 0.12, 0.22, 0.06, '#4a4f55'), b(0, 0.74, 0.5, 0.12, 0.22, 0.06, '#4a4f55'), b(0.55, 0.74, 0.5, 0.12, 0.22, 0.06, '#4a4f55')),
  piece('rug', 'Rug', 'decor', 'G', '#c24646', b(0, 0.025, 0, 1.8, 0.05, 1.25), b(0, 0.055, 0, 1.45, 0.04, 0.9, '#dfb75d')),
  piece('wall-art', 'Wall Art', 'decor', 'P', '#d9bf78', b(0, 1.2, 0, 0.95, 0.7, 0.08), b(0, 1.2, 0.05, 0.72, 0.48, 0.04, '#496e92')),
  piece('mirror', 'Mirror', 'decor', 'M', '#a7c5d8', b(0, 1.2, 0, 0.7, 1, 0.08), b(0, 1.2, 0.05, 0.52, 0.82, 0.04, '#d9eef4')),
  piece('clock', 'Clock', 'decor', 'Q', '#e0c06a', b(0, 1.3, 0, 0.62, 0.62, 0.08), b(0, 1.3, 0.06, 0.08, 0.08, 0.05, '#1f252b'), b(0.1, 1.38, 0.06, 0.06, 0.22, 0.04, '#1f252b'), b(0.08, 1.24, 0.06, 0.2, 0.05, 0.04, '#1f252b')),
  piece('piano', 'Piano', 'decor', 'J', '#202329', b(0, 0.72, 0, 1.5, 1, 0.62), b(0, 1.25, -0.25, 1.5, 0.85, 0.12), b(0, 0.85, 0.35, 1.22, 0.1, 0.08, '#f2eee4'), b(-0.3, 0.86, 0.41, 0.08, 0.08, 0.08, '#111'), b(0, 0.86, 0.41, 0.08, 0.08, 0.08, '#111'), b(0.3, 0.86, 0.41, 0.08, 0.08, 0.08, '#111')),
  piece('plant', 'Potted Plant', 'plants', 'Y', '#417747', b(0, 0.22, 0, 0.46, 0.44, 0.46, '#9a6045'), b(0, 0.64, 0, 0.18, 0.55, 0.18, '#5f7d3a'), b(-0.22, 0.86, 0, 0.46, 0.22, 0.2), b(0.2, 0.76, 0.1, 0.42, 0.2, 0.2), b(0, 1.03, -0.13, 0.38, 0.22, 0.2)),
  piece('fern', 'Fern', 'plants', 'Z', '#4d8a54', b(0, 0.16, 0, 0.55, 0.32, 0.55, '#b27549'), b(-0.2, 0.5, 0, 0.48, 0.16, 0.16), b(0.2, 0.5, 0, 0.48, 0.16, 0.16), b(0, 0.62, -0.2, 0.16, 0.16, 0.48), b(0, 0.62, 0.2, 0.16, 0.16, 0.48), b(0, 0.82, 0, 0.35, 0.18, 0.35)),
  piece('tree', 'Indoor Tree', 'plants', 'H', '#3f7c43', b(0, 0.35, 0, 0.48, 0.7, 0.48, '#94603e'), b(0, 1.1, 0, 0.18, 1.1, 0.18, '#7b5b36'), b(0, 1.75, 0, 0.9, 0.65, 0.9), b(0.35, 1.35, -0.1, 0.58, 0.46, 0.58), b(-0.35, 1.45, 0.18, 0.58, 0.46, 0.58)),
  piece('floor-lamp', 'Floor Lamp', 'lighting', '1', '#f3d17c', b(0, 0.08, 0, 0.55, 0.12, 0.55, '#3f4650'), b(0, 0.8, 0, 0.1, 1.45, 0.1, '#3f4650'), b(0, 1.55, 0, 0.62, 0.45, 0.62)),
  piece('table-lamp', 'Table Lamp', 'lighting', '2', '#f4c65e', b(0, 0.18, 0, 0.35, 0.12, 0.35, '#56524a'), b(0, 0.45, 0, 0.08, 0.5, 0.08, '#56524a'), b(0, 0.78, 0, 0.48, 0.32, 0.48)),
  piece('lantern', 'Lantern', 'lighting', '3', '#f5b642', b(0, 0.32, 0, 0.38, 0.52, 0.38), b(0, 0.62, 0, 0.48, 0.08, 0.48, '#333941'), b(0, 0.06, 0, 0.48, 0.08, 0.48, '#333941'), b(0, 0.92, 0, 0.2, 0.32, 0.08, '#333941')),
  piece('string-lights', 'String Lights', 'lighting', '4', '#f6d486', b(0, 1.85, 0, 1.8, 0.06, 0.06, '#2c3036'), b(-0.65, 1.75, 0, 0.16, 0.22, 0.16), b(0, 1.72, 0, 0.16, 0.22, 0.16), b(0.65, 1.75, 0, 0.16, 0.22, 0.16)),
  piece('fireplace', 'Fireplace', 'lighting', '5', '#7d6252', b(0, 0.55, 0, 1.3, 1.1, 0.45), b(0, 0.45, 0.25, 0.82, 0.55, 0.08, '#2b2420'), b(-0.18, 0.25, 0.32, 0.16, 0.28, 0.12, '#f06b35'), b(0.1, 0.22, 0.32, 0.14, 0.24, 0.12, '#ffd05a')),
  piece('fountain', 'Fountain', 'outdoor', '6', '#90a9b5', b(0, 0.16, 0, 1.1, 0.22, 1.1), b(0, 0.38, 0, 0.78, 0.22, 0.78, '#66a4c8'), b(0, 0.74, 0, 0.25, 0.7, 0.25), b(0, 1.15, 0, 0.5, 0.12, 0.5, '#66a4c8')),
  piece('birdbath', 'Birdbath', 'outdoor', '7', '#aab6b8', b(0, 0.1, 0, 0.55, 0.12, 0.55), b(0, 0.42, 0, 0.16, 0.62, 0.16), b(0, 0.82, 0, 0.78, 0.18, 0.78, '#75aeca')),
  piece('mailbox', 'Mailbox', 'outdoor', '8', '#3e6e92', b(0, 0.36, 0, 0.12, 0.72, 0.12, '#5c4632'), b(0, 0.85, 0, 0.72, 0.42, 0.48), b(0.38, 0.92, -0.02, 0.08, 0.5, 0.08, '#d34234')),
  piece('garden-bed', 'Garden Bed', 'outdoor', '9', '#7d5a37', b(0, 0.13, 0, 1.7, 0.25, 0.9), b(0, 0.28, 0, 1.5, 0.08, 0.72, '#4f3525'), b(-0.45, 0.52, 0, 0.25, 0.38, 0.25, '#4e8b4a'), b(0, 0.55, 0.15, 0.25, 0.42, 0.25, '#8fbf55'), b(0.42, 0.5, -0.15, 0.25, 0.35, 0.25, '#c6535c')),
]

let selectedPiece = pieces[0]
let activeCategory: Category | 'all' = 'all'
let rotation = 0
let placedPieces: PlacedPiece[] = []
let nextPlacedId = 1
let hoveredObjectId: number | null = null

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-shell">
    <div class="viewport-wrap">
      <canvas id="world" aria-label="3D decoration room"></canvas>
      <div class="hud">
        <div>
          <strong>Minicraft</strong>
          <span id="status">Pick a decoration, then click the garden plaza.</span>
        </div>
        <div class="hud-actions">
          <button id="rotate" type="button" title="Rotate selected piece">Rotate</button>
          <button id="remove-mode" type="button" title="Toggle remove mode">Remove</button>
          <button id="clear" type="button" title="Clear the room">Clear</button>
        </div>
      </div>
    </div>
    <aside class="tool-panel">
      <header>
        <h1>Decorate</h1>
        <p>Decorate a lakeside voxel park filled with trees, flowers, families, kids, and elders.</p>
      </header>
      <div class="stats">
        <span><b id="piece-count">0</b> placed</span>
        <span><b>${pieces.length}</b> pieces</span>
      </div>
      <div class="category-tabs" id="categories"></div>
      <div class="piece-grid" id="palette"></div>
    </aside>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#world')!
const statusEl = document.querySelector<HTMLSpanElement>('#status')!
const countEl = document.querySelector<HTMLElement>('#piece-count')!
const categoriesEl = document.querySelector<HTMLDivElement>('#categories')!
const paletteEl = document.querySelector<HTMLDivElement>('#palette')!
const rotateButton = document.querySelector<HTMLButtonElement>('#rotate')!
const removeButton = document.querySelector<HTMLButtonElement>('#remove-mode')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!

const scene = new THREE.Scene()
scene.background = new THREE.Color('#a7c7d7')
scene.fog = new THREE.Fog('#a7c7d7', 80, 210)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
camera.position.set(24, 18, 27)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.8, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI * 0.47
controls.minDistance = 5
controls.maxDistance = 92
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const placementPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
  new THREE.MeshBasicMaterial({ visible: false }),
)
placementPlane.rotateX(-Math.PI / 2)
scene.add(placementPlane)

const preview = new THREE.Group()
scene.add(preview)

addLandscape()

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(ROOM_SIZE, 0.18, ROOM_SIZE),
  new THREE.MeshStandardMaterial({ color: '#d9c995', roughness: 0.85 }),
)
floor.position.y = -0.09
floor.receiveShadow = true
scene.add(floor)

const grid = new THREE.GridHelper(ROOM_SIZE, ROOM_SIZE, '#7d8b79', '#aeb79b')
grid.position.y = 0.012
scene.add(grid)

const sun = new THREE.DirectionalLight('#fff5df', 2.7)
sun.position.set(4, 9, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -42
sun.shadow.camera.right = 42
sun.shadow.camera.top = 42
sun.shadow.camera.bottom = -42
scene.add(sun)
scene.add(new THREE.HemisphereLight('#d8edff', '#80705a', 1.5))

let removeMode = false

function b(x: number, y: number, z: number, w: number, h: number, d: number, color?: string): Block {
  return { x, y, z, w, h, d, color: color ?? '#ffffff' }
}

function piece(id: string, name: string, category: Category, icon: string, defaultColor: string, ...blocks: Block[]): Piece {
  return {
    id,
    name,
    category,
    icon,
    blocks: blocks.map((block) => ({ ...block, color: block.color === '#ffffff' ? defaultColor : block.color })),
  }
}

function addBlock(parent: THREE.Group | THREE.Scene, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.82 }))
  block.position.set(x, y, z)
  block.castShadow = true
  block.receiveShadow = true
  parent.add(block)
  return block
}

function addLandscape() {
  const land = new THREE.Group()
  land.name = 'lakeside park'
  scene.add(land)

  addBlock(land, 0, -0.18, 0, LAND_SIZE, 0.26, LAND_SIZE, '#78ad5c')
  addBlock(land, 0, -0.08, 0, ROOM_SIZE + 2.4, 0.08, ROOM_SIZE + 2.4, '#96b96c')

  const lakes = [
    [-18, -13, 12, 7], [18, 10, 10, 6], [6, -22, 8, 4.8], [-58, -47, 24, 13], [-46, 43, 18, 11],
    [51, -37, 22, 14], [61, 38, 20, 12], [-3, 58, 28, 10], [-70, 6, 14, 8], [34, 66, 16, 9],
    [-12, -66, 20, 11],
  ]
  lakes.forEach(([x, z, w, d]) => addLake(land, x, z, w, d))

  addPath(land, -78, 8, 78, 8, 2)
  addPath(land, -9, -78, -9, 78, 2)
  addPath(land, 10, -72, 10, 72, 2)
  addPath(land, -72, -54, 68, 50, 5)
  addPath(land, 64, -58, -66, 58, 5)

  const houses = [
    [-31, 12], [-27, 18], [-22, 24], [28, 13], [34, 19], [42, 25], [-54, -30], [-62, -23],
    [42, -25], [55, -22], [-38, 58], [-28, 62], [45, 54], [57, 48], [67, -3], [-72, 21],
  ]
  houses.forEach(([x, z], index) => addHouse(land, x, z, index))
  for (let i = 0; i < 34; i++) {
    const point = generatedPoint(i, 53, 80)
    if (point && !isNearPlaza(point.x, point.z, 18)) addHouse(land, point.x, point.z, i + houses.length)
  }

  const trees = [
    [-24, -23], [-20, -19], [-14, -24], [-7, -25], [14, -22], [22, -21], [25, -14], [-25, 0], [-22, 8],
    [-24, 19], [-17, 22], [-9, 21], [1, 24], [9, 22], [18, 20], [24, 17], [24, 2], [21, -5], [16, -2],
    [-18, -7], [-13, 14], [14, 15], [20, 7],
  ]
  trees.forEach(([x, z], index) => addTree(land, x, z, index % 3))

  for (let i = 0; i < 170; i++) {
    const point = generatedPoint(i, 21, 86)
    if (point && !isNearPlaza(point.x, point.z, 12)) addTree(land, point.x, point.z, i % 3)
  }

  const flowers = ['#e8526c', '#f7c948', '#f28c3c', '#ffffff', '#9d6be8', '#55bcd6']
  for (let i = 0; i < 520; i++) {
    const angle = i * 2.399
    const radius = 9 + (i % 78)
    const x = Math.cos(angle) * radius + ((i % 5) - 2) * 0.4
    const z = Math.sin(angle) * radius + ((i % 7) - 3) * 0.35
    if (Math.abs(x) < 8 && Math.abs(z) < 8) continue
    addFlower(land, x, z, flowers[i % flowers.length])
  }

  const people = [
    [-7, 9, 'adult'], [-5.8, 9.8, 'kid'], [-4.8, 8.9, 'kid'], [8, 9, 'elder'], [9.2, 8.4, 'adult'],
    [-13, -9, 'adult'], [-14.3, -8.2, 'elder'], [15, 4, 'kid'], [16, 5, 'kid'], [17, 4.4, 'adult'],
    [3, -14, 'adult'], [4.2, -13.5, 'kid'], [21, 13, 'elder'], [-20, 13, 'adult'], [-18.8, 14, 'kid'],
  ] as const
  people.forEach(([x, z, age], index) => addPerson(land, x, z, age, index))

  const ages = ['kid', 'adult', 'elder'] as const
  for (let i = 0; i < 70; i++) {
    const point = generatedPoint(i, 91, 82)
    if (point && !isNearPlaza(point.x, point.z, 9)) addPerson(land, point.x, point.z, ages[i % ages.length], i + people.length)
  }

  const animals = [
    [-20, -9, 'duck'], [-18.8, -8.6, 'duck'], [-17.6, -9.2, 'duck'], [17, 7, 'duck'], [18.3, 6.6, 'duck'],
    [-2, 12, 'dog'], [2, 11, 'cat'], [12, -12, 'rabbit'], [13.2, -11.2, 'rabbit'], [-15, 18, 'sheep'],
    [-13.7, 18.6, 'sheep'], [22, -7, 'cow'], [20.4, -8.2, 'cow'], [6, 20, 'bird'], [7.4, 21, 'bird'],
    [-23, 4, 'dog'], [-21.8, 5, 'cat'], [24, 12, 'rabbit'],
  ] as const
  animals.forEach(([x, z, animal], index) => addAnimal(land, x, z, animal, index))

  const animalTypes = ['dog', 'cat', 'duck', 'rabbit', 'sheep', 'cow', 'bird'] as const
  for (let i = 0; i < 115; i++) {
    const point = generatedPoint(i, 137, 84)
    if (point && !isNearPlaza(point.x, point.z, 10)) addAnimal(land, point.x, point.z, animalTypes[i % animalTypes.length], i + animals.length)
  }
}

function addPath(parent: THREE.Group, x1: number, z1: number, x2: number, z2: number, steps: number) {
  const count = Math.max(2, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / steps))
  for (let i = 0; i <= count; i++) {
    const t = i / count
    addBlock(parent, THREE.MathUtils.lerp(x1, x2, t), 0.018, THREE.MathUtils.lerp(z1, z2, t), 1.4, 0.035, 1.4, '#cdbf8e')
  }
}

function addHouse(parent: THREE.Group, x: number, z: number, index: number) {
  const house = new THREE.Group()
  house.position.set(x, 0, z)
  house.rotation.y = (index % 4) * (Math.PI / 2)
  parent.add(house)

  const walls = ['#d9b98c', '#cfa37f', '#e0c497', '#bfc7a4'][index % 4]
  const roof = ['#9e493e', '#6c7f9d', '#8b5f3f', '#5f7d55'][index % 4]
  const width = 3.6 + (index % 3) * 0.5
  const depth = 3.2 + ((index + 1) % 3) * 0.45
  const height = 2.2 + (index % 2) * 0.35

  addBlock(house, 0, height / 2, 0, width, height, depth, walls)
  addBlock(house, 0, height + 0.45, 0, width + 0.55, 0.55, depth + 0.55, roof)
  addBlock(house, 0, height + 0.85, 0, width - 0.45, 0.42, depth - 0.25, roof)
  addBlock(house, 0, 0.72, depth / 2 + 0.04, 0.72, 1.25, 0.08, '#6b4b33')
  addBlock(house, -width * 0.28, 1.45, depth / 2 + 0.05, 0.55, 0.5, 0.08, '#8fd2e8')
  addBlock(house, width * 0.28, 1.45, depth / 2 + 0.05, 0.55, 0.5, 0.08, '#8fd2e8')
  addBlock(house, -width / 2 - 0.08, 1.25, 0, 0.08, 0.48, 0.72, '#8fd2e8')
  addBlock(house, width / 2 + 0.08, 1.25, 0, 0.08, 0.48, 0.72, '#8fd2e8')
  addBlock(house, width * 0.28, height + 1.18, -depth * 0.18, 0.42, 0.78, 0.42, '#6d5140')
  addBlock(house, 0, 0.035, depth / 2 + 1.05, 1.25, 0.04, 1.6, '#cdbf8e')
  addFlower(house, -width / 2 - 0.45, depth / 2 + 0.2, '#e8526c')
  addFlower(house, width / 2 + 0.45, depth / 2 + 0.2, '#f7c948')
}

function generatedPoint(index: number, offset: number, maxRadius: number) {
  const angle = (index + offset) * 2.399963
  const radius = 18 + ((index * 17 + offset) % maxRadius)
  const x = Math.cos(angle) * radius + (((index + offset) % 9) - 4) * 0.55
  const z = Math.sin(angle) * radius + (((index * 3 + offset) % 11) - 5) * 0.48
  const half = LAND_SIZE / 2 - 4
  if (Math.abs(x) > half || Math.abs(z) > half) return null
  return { x, z }
}

function isNearPlaza(x: number, z: number, padding: number) {
  return Math.abs(x) < ROOM_SIZE / 2 + padding && Math.abs(z) < ROOM_SIZE / 2 + padding
}

function addLake(parent: THREE.Group, x: number, z: number, w: number, d: number) {
  addBlock(parent, x, -0.045, z, w + 1.5, 0.05, d + 1.5, '#6aa06d')
  const water = addBlock(parent, x, 0.005, z, w, 0.04, d, '#4e9fd0')
  ;(water.material as THREE.MeshStandardMaterial).metalness = 0.05
  ;(water.material as THREE.MeshStandardMaterial).roughness = 0.28
  addBlock(parent, x - w * 0.2, 0.04, z + d * 0.18, w * 0.35, 0.025, d * 0.18, '#77bce0')
}

function addTree(parent: THREE.Group, x: number, z: number, variant: number) {
  const height = 1.7 + variant * 0.25
  addBlock(parent, x, height / 2, z, 0.42, height, 0.42, '#7a5737')
  addBlock(parent, x, height + 0.55, z, 1.8, 1.15, 1.8, variant === 1 ? '#2f7d46' : '#3f8e48')
  addBlock(parent, x - 0.45, height + 1, z + 0.25, 1.25, 0.9, 1.25, '#4d9c4f')
  addBlock(parent, x + 0.55, height + 0.85, z - 0.25, 1.15, 0.85, 1.15, '#377e41')
}

function addFlower(parent: THREE.Group, x: number, z: number, color: string) {
  addBlock(parent, x, 0.16, z, 0.06, 0.32, 0.06, '#3d7c3e')
  addBlock(parent, x, 0.36, z, 0.24, 0.14, 0.24, color)
}

function addPerson(parent: THREE.Group, x: number, z: number, age: 'kid' | 'adult' | 'elder', index: number) {
  const person = new THREE.Group()
  person.position.set(x, 0, z)
  person.rotation.y = (index % 8) * (Math.PI / 4)
  parent.add(person)

  const scale = age === 'kid' ? 0.72 : age === 'elder' ? 0.88 : 1
  const shirt = ['#df6b57', '#3f78b5', '#55a36d', '#d9a23b', '#8f64bd'][index % 5]
  addBlock(person, 0, 0.25 * scale, 0, 0.28 * scale, 0.5 * scale, 0.22 * scale, '#4b5b6b')
  addBlock(person, 0, 0.75 * scale, 0, 0.42 * scale, 0.55 * scale, 0.28 * scale, shirt)
  addBlock(person, 0, 1.17 * scale, 0, 0.34 * scale, 0.34 * scale, 0.34 * scale, age === 'elder' ? '#d4b394' : '#bf855c')
  addBlock(person, -0.31 * scale, 0.75 * scale, 0, 0.12 * scale, 0.44 * scale, 0.12 * scale, '#bf855c')
  addBlock(person, 0.31 * scale, 0.75 * scale, 0, 0.12 * scale, 0.44 * scale, 0.12 * scale, '#bf855c')
  if (age === 'elder') addBlock(person, 0.48 * scale, 0.45 * scale, 0.18 * scale, 0.06, 0.9 * scale, 0.06, '#665842')

  const bubble = createSpeechBubble(['Hi!', 'Nice lake', 'Flowers!', 'Come play', 'Lovely day', 'Hello!'][index % 6])
  const bubbleY = 1.85 * scale + 0.45
  bubble.position.set(0, bubbleY, 0)
  person.add(bubble)
  movingPeople.push({
    group: person,
    bubble,
    bubbleY,
    originX: x,
    originZ: z,
    radius: 0.5 + (index % 5) * 0.16,
    speed: 0.22 + (index % 7) * 0.025,
    phase: index * 0.71,
  })
}

function createSpeechBubble(message: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')!
  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.strokeStyle = 'rgba(47, 61, 55, 0.35)'
  context.lineWidth = 8
  roundRect(context, 16, 18, 224, 72, 18)
  context.fill()
  context.stroke()
  context.fillStyle = '#23312f'
  context.font = 'bold 28px system-ui, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(message, 128, 54)
  context.beginPath()
  context.moveTo(108, 88)
  context.lineTo(128, 116)
  context.lineTo(150, 88)
  context.closePath()
  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.fill()
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(1.5, 0.75, 1)
  return sprite
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function addAnimal(parent: THREE.Group, x: number, z: number, animal: 'dog' | 'cat' | 'duck' | 'rabbit' | 'sheep' | 'cow' | 'bird', index: number) {
  const colors = {
    dog: '#9b673f',
    cat: '#5d6268',
    duck: '#f0d34f',
    rabbit: '#e7e1d6',
    sheep: '#f2eee2',
    cow: '#f4efe5',
    bird: '#4e83b8',
  }
  const body = colors[animal]
  const size = animal === 'cow' ? 1.25 : animal === 'sheep' ? 1 : animal === 'duck' || animal === 'bird' ? 0.5 : 0.72
  const y = 0.22 * size
  addBlock(parent, x, y, z, 0.85 * size, 0.42 * size, 0.42 * size, body)
  addBlock(parent, x + 0.43 * size, y + 0.16 * size, z, 0.32 * size, 0.32 * size, 0.32 * size, body)
  addBlock(parent, x - 0.28 * size, 0.09 * size, z - 0.18 * size, 0.12 * size, 0.18 * size, 0.1 * size, '#3d332a')
  addBlock(parent, x + 0.18 * size, 0.09 * size, z - 0.18 * size, 0.12 * size, 0.18 * size, 0.1 * size, '#3d332a')
  addBlock(parent, x - 0.28 * size, 0.09 * size, z + 0.18 * size, 0.12 * size, 0.18 * size, 0.1 * size, '#3d332a')
  addBlock(parent, x + 0.18 * size, 0.09 * size, z + 0.18 * size, 0.12 * size, 0.18 * size, 0.1 * size, '#3d332a')
  if (animal === 'duck' || animal === 'bird') addBlock(parent, x + 0.67 * size, y + 0.12 * size, z, 0.18 * size, 0.12 * size, 0.16 * size, '#e88332')
  if (animal === 'rabbit') {
    addBlock(parent, x + 0.48 * size, y + 0.5 * size, z - 0.09 * size, 0.1 * size, 0.38 * size, 0.08 * size, body)
    addBlock(parent, x + 0.48 * size, y + 0.5 * size, z + 0.09 * size, 0.1 * size, 0.38 * size, 0.08 * size, body)
  }
  if (animal === 'cow') {
    addBlock(parent, x - 0.18, y + 0.12, z + 0.22, 0.28, 0.2, 0.08, index % 2 ? '#2f2d2a' : '#8a5639')
    addBlock(parent, x + 0.2, y + 0.04, z - 0.22, 0.22, 0.18, 0.08, '#2f2d2a')
  }
}

function makePieceGroup(pieceDef: Piece, objectId?: number) {
  const group = new THREE.Group()
  group.name = pieceDef.name

  for (const block of pieceDef.blocks) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d),
      new THREE.MeshStandardMaterial({ color: block.color, roughness: 0.78, metalness: 0.03 }),
    )
    mesh.position.set(block.x, block.y, block.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    if (objectId) mesh.userData.objectId = objectId
    group.add(mesh)
  }

  return group
}

function rebuildWorld() {
  objectMeshes.forEach((group) => scene.remove(group))
  objectMeshes.clear()

  for (const item of placedPieces) {
    const pieceDef = pieces.find((candidate) => candidate.id === item.pieceId)
    if (!pieceDef) continue
    const group = makePieceGroup(pieceDef, item.id)
    group.position.set(item.gx * CELL, 0, item.gz * CELL)
    group.rotation.y = item.rotation
    objectMeshes.set(item.id, group)
    scene.add(group)
  }

  countEl.textContent = String(placedPieces.length)
  saveScene()
}

function updatePreview() {
  preview.clear()
  const group = makePieceGroup(selectedPiece)
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.material = new THREE.MeshStandardMaterial({
        color: '#76c790',
        opacity: 0.54,
        transparent: true,
        roughness: 0.7,
      })
    }
  })
  group.rotation.y = rotation
  preview.add(group)
}

function setPointer(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function gridPointFromPointer(event: PointerEvent) {
  setPointer(event)
  raycaster.setFromCamera(pointer, camera)
  const [hit] = raycaster.intersectObject(placementPlane)
  if (!hit) return null
  const half = ROOM_SIZE / 2 - 0.5
  return {
    gx: THREE.MathUtils.clamp(Math.round(hit.point.x), -half, half),
    gz: THREE.MathUtils.clamp(Math.round(hit.point.z), -half, half),
  }
}

function findObjectFromPointer(event: PointerEvent) {
  setPointer(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects([...objectMeshes.values()], true)
  const id = hits.find((hit) => hit.object.userData.objectId)?.object.userData.objectId
  return typeof id === 'number' ? id : null
}

function placeAt(gx: number, gz: number) {
  placedPieces.push({ id: nextPlacedId++, pieceId: selectedPiece.id, gx, gz, rotation })
  statusEl.textContent = `${selectedPiece.name} placed.`
  rebuildWorld()
}

function removeObject(id: number) {
  const removed = placedPieces.find((item) => item.id === id)
  placedPieces = placedPieces.filter((item) => item.id !== id)
  statusEl.textContent = removed ? `${pieceName(removed.pieceId)} removed.` : 'Removed.'
  rebuildWorld()
}

function pieceName(id: string) {
  return pieces.find((item) => item.id === id)?.name ?? 'Piece'
}

function renderCategories() {
  categoriesEl.innerHTML = ''
  const all = document.createElement('button')
  all.textContent = 'All'
  all.className = activeCategory === 'all' ? 'active' : ''
  all.addEventListener('click', () => {
    activeCategory = 'all'
    renderCategories()
    renderPalette()
  })
  categoriesEl.append(all)

  for (const category of categories) {
    const tab = document.createElement('button')
    tab.textContent = category
    tab.className = activeCategory === category ? 'active' : ''
    tab.addEventListener('click', () => {
      activeCategory = category
      renderCategories()
      renderPalette()
    })
    categoriesEl.append(tab)
  }
}

function renderPalette() {
  paletteEl.innerHTML = ''
  const visible = activeCategory === 'all' ? pieces : pieces.filter((item) => item.category === activeCategory)
  for (const item of visible) {
    const button = document.createElement('button')
    button.className = item.id === selectedPiece.id ? 'piece active' : 'piece'
    button.type = 'button'
    button.title = item.name
    button.innerHTML = `<span>${item.icon}</span><strong>${item.name}</strong><em>${item.category}</em>`
    button.addEventListener('click', () => {
      selectedPiece = item
      renderPalette()
      updatePreview()
      statusEl.textContent = `${item.name} selected.`
    })
    paletteEl.append(button)
  }
}

function saveScene() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ placedPieces, nextPlacedId }))
}

function loadScene() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    placedPieces = [
      { id: nextPlacedId++, pieceId: 'sofa', gx: -3, gz: 2, rotation: 0 },
      { id: nextPlacedId++, pieceId: 'coffee-table', gx: -3, gz: 0, rotation: 0 },
      { id: nextPlacedId++, pieceId: 'bookshelf', gx: -6, gz: -4, rotation: Math.PI / 2 },
      { id: nextPlacedId++, pieceId: 'plant', gx: 5, gz: -5, rotation: 0 },
      { id: nextPlacedId++, pieceId: 'floor-lamp', gx: -5, gz: 2, rotation: 0 },
      { id: nextPlacedId++, pieceId: 'rug', gx: 0, gz: 2, rotation: Math.PI / 2 },
      { id: nextPlacedId++, pieceId: 'bed', gx: 4, gz: 3, rotation: Math.PI / 2 },
    ]
    return
  }

  try {
    const data = JSON.parse(raw) as { placedPieces?: PlacedPiece[]; nextPlacedId?: number }
    placedPieces = Array.isArray(data.placedPieces) ? data.placedPieces : []
    nextPlacedId = data.nextPlacedId ?? Math.max(1, ...placedPieces.map((item) => item.id + 1))
  } catch {
    placedPieces = []
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect()
  camera.aspect = rect.width / rect.height
  camera.updateProjectionMatrix()
  renderer.setSize(rect.width, rect.height, false)
}

canvas.addEventListener('pointermove', (event) => {
  const point = gridPointFromPointer(event)
  if (point) preview.position.set(point.gx, 0.04, point.gz)

  const objectId = findObjectFromPointer(event)
  if (objectId !== hoveredObjectId) {
    hoveredObjectId = objectId
    canvas.style.cursor = removeMode && objectId ? 'not-allowed' : 'crosshair'
  }
})

canvas.addEventListener('click', (event) => {
  if (removeMode) {
    const id = findObjectFromPointer(event)
    if (id) removeObject(id)
    return
  }

  const point = gridPointFromPointer(event)
  if (point) placeAt(point.gx, point.gz)
})

rotateButton.addEventListener('click', () => {
  rotation = (rotation + Math.PI / 2) % (Math.PI * 2)
  updatePreview()
  statusEl.textContent = 'Piece rotated.'
})

removeButton.addEventListener('click', () => {
  removeMode = !removeMode
  removeButton.classList.toggle('active', removeMode)
  preview.visible = !removeMode
  statusEl.textContent = removeMode ? 'Remove mode: click a placed piece.' : 'Placement mode.'
})

clearButton.addEventListener('click', () => {
  placedPieces = []
  statusEl.textContent = 'Room cleared.'
  rebuildWorld()
})

window.addEventListener('resize', resize)
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') rotateButton.click()
  if (event.key === 'Backspace' || event.key === 'Delete') removeButton.click()
})

renderCategories()
renderPalette()
loadScene()
rebuildWorld()
updatePreview()
resize()

function updateMovingPeople(time: number) {
  for (const person of movingPeople) {
    const t = time * person.speed + person.phase
    const nextX = person.originX + Math.cos(t) * person.radius
    const nextZ = person.originZ + Math.sin(t * 0.83) * person.radius
    const dx = nextX - person.group.position.x
    const dz = nextZ - person.group.position.z
    person.group.position.set(nextX, 0, nextZ)
    if (Math.abs(dx) + Math.abs(dz) > 0.0001) person.group.rotation.y = Math.atan2(dx, dz)
    person.bubble.visible = Math.sin(time * 0.85 + person.phase) > 0.18
    person.bubble.position.y = person.bubbleY + Math.sin(time * 2.2 + person.phase) * 0.04
  }
}

function animate() {
  updateMovingPeople(performance.now() / 1000)
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()
