'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Standard Anatomical Data Mapping
const BODY_DATA: Record<string, { label: string; desc: string; conditions: Array<{ name: string; severity: 'mild' | 'moderate' | 'severe'; detail: string }> }> = {
  'ForeHead': { label: "Forehead", desc: "Skull, scalp, brain, and facial structures.", conditions: [
    { name: "Headache (Tension)", severity: "mild", detail: "Dull, aching pressure around the forehead." },
    { name: "Migraine", severity: "severe", detail: "Intense throbbing pain, often with nausea and light sensitivity." },
    { name: "Sinus Infection", severity: "moderate", detail: "Inflammation of sinuses causing facial pressure and nasal congestion." },
    { name: "Common Cold", severity: "mild", detail: "Viral infection causing runny nose, sneezing, and minor headache." },
  ]},
  'BackHead': { label: "Back Head", desc: "Back of the skull and neck muscles.", conditions: [
    { name: "Tension Headache", severity: "mild", detail: "Dull, aching pressure radiating from the neck to the back of the head." },
    { name: "Neck Strain", severity: "moderate", detail: "Muscle pain from poor posture or sleeping awkwardly." },
    { name: "Occipital Neuralgia", severity: "severe", detail: "Piercing, throbbing, or electric-shock-like chronic pain." },
  ]},
  'RightEar': { label: "Right Ear", desc: "Right ear structure.", conditions: [
    { name: "Ear Infection", severity: "moderate", detail: "Inflammation of the middle ear causing pain and fluid build-up." },
    { name: "Tinnitus", severity: "mild", detail: "Ringing, buzzing, or hissing sound in the ear." },
    { name: "Earwax Blockage", severity: "mild", detail: "Accumulation of earwax causing temporary hearing loss or discomfort." },
  ]},
  'LeftEar': { label: "Left Ear", desc: "Left ear structure.", conditions: [
    { name: "Ear Infection", severity: "moderate", detail: "Inflammation of the middle ear causing pain and fluid build-up." },
    { name: "Tinnitus", severity: "mild", detail: "Ringing, buzzing, or hissing sound in the ear." },
    { name: "Earwax Blockage", severity: "mild", detail: "Accumulation of earwax causing temporary hearing loss or discomfort." },
  ]},
  'Chest': { label: "Chest", desc: "Heart, lungs, ribs, and pectoral muscles.", conditions: [
    { name: "Heartburn / Acid Reflux", severity: "moderate", detail: "Burning sensation in the chest caused by stomach acid." },
    { name: "Bronchitis", severity: "moderate", detail: "Inflammation of the bronchial tubes causing a persistent cough." },
    { name: "Asthma", severity: "moderate", detail: "Spasms in the bronchi of the lungs, causing difficulty in breathing." },
    { name: "Angina (Chest Pain)", severity: "severe", detail: "Reduced blood flow to the heart, causing tightness or pressure." },
    { name: "Pneumonia", severity: "severe", detail: "Infection that inflames the air sacs in one or both lungs." },
  ]},
  'Torso': { label: "Torso", desc: "Stomach, intestines, liver, kidneys.", conditions: [
    { name: "Indigestion", severity: "mild", detail: "Discomfort or pain in the upper abdomen." },
    { name: "Stomach Flu", severity: "moderate", detail: "Intestinal infection marked by diarrhea, cramps, nausea, vomiting." },
    { name: "Food Poisoning", severity: "severe", detail: "Illness caused by eating contaminated food." },
    { name: "Irritable Bowel Syndrome", severity: "mild", detail: "Common disorder affecting the large intestine causing cramping." },
    { name: "Appendicitis", severity: "severe", detail: "Sudden pain that begins on the right side of the lower abdomen." },
  ]},
  'Back': { label: "Back", desc: "Vertebral column, spinal cord, and back muscles.", conditions: [
    { name: "Muscle Strain", severity: "moderate", detail: "Torn or overstretched muscle from heavy lifting or sudden movement." },
    { name: "Poor Posture Pain", severity: "mild", detail: "Aching back from prolonged sitting or slouching." },
    { name: "Sciatica", severity: "severe", detail: "Pain radiating along the sciatic nerve, running down one or both legs." },
    { name: "Herniated Disc", severity: "severe", detail: "Problem with one of the rubbery cushions between the individual bones." },
  ]},
  'RightShoulder': { label: "Right Shoulder", desc: "Right shoulder joint, rotator cuff, deltoid.", conditions: [
    { name: "Muscle Tension", severity: "mild", detail: "Tightness or aching from stress or physical strain." },
    { name: "Rotator Cuff Injury", severity: "moderate", detail: "A dull ache deep in the shoulder from tendon wear and tear." },
    { name: "Frozen Shoulder", severity: "severe", detail: "Stiffness and pain in your shoulder joint." },
  ]},
  'LeftShoulder': { label: "Left Shoulder", desc: "Left shoulder joint, rotator cuff, deltoid.", conditions: [
    { name: "Muscle Tension", severity: "mild", detail: "Tightness or aching from stress or physical strain." },
    { name: "Rotator Cuff Injury", severity: "moderate", detail: "A dull ache deep in the shoulder from tendon wear and tear." },
    { name: "Frozen Shoulder", severity: "severe", detail: "Stiffness and pain in your shoulder joint." },
  ]},
  'RightArm': { label: "Right Arm", desc: "Upper arm, elbow, forearm, and surrounding muscles.", conditions: [
    { name: "Muscle Soreness", severity: "mild", detail: "Aching muscles after physical exertion or exercise." },
    { name: "Tennis Elbow", severity: "moderate", detail: "Irritation of the tissue connecting the forearm muscle to the elbow." },
  ]},
  'LeftArm': { label: "Left Arm", desc: "Upper arm, elbow, forearm, and surrounding muscles.", conditions: [
    { name: "Muscle Soreness", severity: "mild", detail: "Aching muscles after physical exertion or exercise." },
    { name: "Tennis Elbow", severity: "moderate", detail: "Irritation of the tissue connecting the forearm muscle to the elbow." },
  ]},
  'RightHand': { label: "Right Hand", desc: "Wrist, palm, fingers, joints.", conditions: [
    { name: "Carpal Tunnel Syndrome", severity: "moderate", detail: "Numbness, tingling, and pain in the hand and forearm." },
    { name: "Arthritis", severity: "moderate", detail: "Swelling and tenderness of one or more joints." },
  ]},
  'LeftHand': { label: "Left Hand", desc: "Wrist, palm, fingers, joints.", conditions: [
    { name: "Carpal Tunnel Syndrome", severity: "moderate", detail: "Numbness, tingling, and pain in the hand and forearm." },
    { name: "Arthritis", severity: "moderate", detail: "Swelling and tenderness of one or more joints." },
  ]},
  'RightLeg': { label: "Right Leg", desc: "Upper leg muscles, quadriceps, hamstrings.", conditions: [
    { name: "Muscle Cramps", severity: "mild", detail: "Sudden, involuntary contraction of one or more muscles." },
    { name: "Hamstring Strain", severity: "moderate", detail: "Pull or tear in the muscles at the back of the thigh." },
    { name: "Sciatic Pain", severity: "severe", detail: "Sharp pain shooting down the back of the leg." },
  ]},
  'LeftLeg': { label: "Left Leg", desc: "Upper leg muscles, quadriceps, hamstrings.", conditions: [
    { name: "Muscle Cramps", severity: "mild", detail: "Sudden, involuntary contraction of one or more muscles." },
    { name: "Hamstring Strain", severity: "moderate", detail: "Pull or tear in the muscles at the back of the thigh." },
    { name: "Sciatic Pain", severity: "severe", detail: "Sharp pain shooting down the back of the leg." },
  ]},
  'RightFoot': { label: "Right Foot", desc: "Ankle joint, foot bones, plantar ligaments.", conditions: [
    { name: "Blisters", severity: "mild", detail: "Small pocket of fluid from friction or shoes rubbing." },
    { name: "Plantar Fasciitis", severity: "moderate", detail: "Inflammation of a thick band of tissue across the bottom of the foot." },
    { name: "Ankle Sprain", severity: "moderate", detail: "Injury that occurs when you roll, twist or turn your ankle." },
  ]},
  'LeftFoot': { label: "Left Foot", desc: "Ankle joint, foot bones, plantar ligaments.", conditions: [
    { name: "Blisters", severity: "mild", detail: "Small pocket of fluid from friction or shoes rubbing." },
    { name: "Plantar Fasciitis", severity: "moderate", detail: "Inflammation of a thick band of tissue across the bottom of the foot." },
    { name: "Ankle Sprain", severity: "moderate", detail: "Injury that occurs when you roll, twist or turn your ankle." },
  ]},
}

export default function ExplorePage() {
  const mountRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadingPct, setLoadingPct] = useState(0)
  const [loadingError, setLoadingError] = useState('')
  
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedPartKey, setSelectedPartKey] = useState('')
  const [selectedDiseaseName, setSelectedDiseaseName] = useState('')
  const [customDiseaseText, setCustomDiseaseText] = useState('')
  const [showFallbackList, setShowFallbackList] = useState(false)

  // WebGL support check
  const [webGlSupported, setWebGlSupported] = useState(true)

  const activePart = selectedPartKey ? BODY_DATA[selectedPartKey] : null

  // Function to handle clicking / picking a body part
  const selectPart = (partKey: string) => {
    if (BODY_DATA[partKey]) {
      setSelectedPartKey(partKey)
      setSelectedDiseaseName('')
      setPanelOpen(true)
    }
  }

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setWebGlSupported(false)
    } catch (e) {
      setWebGlSupported(false)
    }
  }, [])

  useEffect(() => {
    if (!webGlSupported || !mountRef.current || !containerRef.current) {
      setLoading(false)
      setShowFallbackList(true)
      return
    }

    const canvas = mountRef.current
    const container = containerRef.current

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8f9fb)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0.8, 5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    
    const dl1 = new THREE.DirectionalLight(0xffffff, 1.8)
    dl1.position.set(3, 5, 4)
    scene.add(dl1)

    const dl2 = new THREE.DirectionalLight(0xeef2f7, 0.9)
    dl2.position.set(-3, 2, -2)
    scene.add(dl2)

    const dl3 = new THREE.DirectionalLight(0xffffff, 0.6)
    dl3.position.set(0, -2, 3)
    scene.add(dl3)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd0d8e0, 0.8))

    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.5
    controls.minDistance = 1.5
    controls.maxDistance = 8
    controls.target.set(0, 0.8, 0)

    // Pause rotation on hover
    let isHoveringCanvas = false
    const onCanvasEnter = () => {
      isHoveringCanvas = true
      controls.autoRotate = false
    }
    const onCanvasLeave = () => {
      isHoveringCanvas = false
      if (!panelOpen) controls.autoRotate = true
    }

    canvas.addEventListener('mouseenter', onCanvasEnter)
    canvas.addEventListener('mouseleave', onCanvasLeave)

    // Standard materials
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xeef1f5,
      roughness: 0.55,
      metalness: 0.05,
    })

    // Load GLB Model
    let model: THREE.Group | null = null
    const gltfLoader = new GLTFLoader()

    gltfLoader.load(
      '/3dmodel.glb',
      (gltf) => {
        model = gltf.scene

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2.2 / maxDim
        
        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))
        model.position.y += 0.1

        // Apply white material to all meshes
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.material = whiteMaterial.clone()
          }
        })

        scene.add(model)
        setLoading(false)
      },
      (xhr) => {
        if (xhr.total) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100)
          setLoadingPct(pct)
        }
      },
      (error) => {
        console.error('Error loading 3D model:', error)
        setLoadingError('Failed to load anatomical model')
        setLoading(false)
        setShowFallbackList(true)
      }
    )

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // Raycaster for click and hover highlighting
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredMesh: THREE.Mesh | null = null
    let selectedMesh: THREE.Mesh | null = null
    const originalMaterials: Record<string, THREE.Material> = {}

    // Position-based anatomical fallback
    const fallbackFromPosition = (point: THREE.Vector3) => {
      const ny = point.y
      const ax = Math.abs(point.x)
      const rightSide = point.x >= 0

      if (ny > 1.85) return 'ForeHead'
      if (ny > 1.65) return 'BackHead'
      if (ny > 1.25) return ax > 0.35 ? (rightSide ? 'RightShoulder' : 'LeftShoulder') : 'Chest'
      if (ny > 0.95) return ax > 0.4 ? (rightSide ? 'RightArm' : 'LeftArm') : 'Torso'
      if (ny > 0.75) return ax > 0.4 ? (rightSide ? 'RightHand' : 'LeftHand') : 'Torso'
      if (ny > 0.35) return rightSide ? 'RightLeg' : 'LeftLeg'
      return rightSide ? 'RightFoot' : 'LeftFoot'
    }

    const highlightMesh = (mesh: THREE.Mesh) => {
      // Restore previously selected
      if (selectedMesh && originalMaterials[selectedMesh.uuid]) {
        selectedMesh.material = originalMaterials[selectedMesh.uuid]
        delete originalMaterials[selectedMesh.uuid]
      }

      // Save original state
      originalMaterials[mesh.uuid] = whiteMaterial.clone()
      selectedMesh = mesh

      // Apply selection highlights
      const hlMat = whiteMaterial.clone()
      hlMat.color = new THREE.Color(0xa9f0e3)
      hlMat.emissive = new THREE.Color(0x1f6a60)
      hlMat.emissiveIntensity = 0.35
      mesh.material = hlMat
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!model) return

      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      let intersects = raycaster.intersectObject(model, true)
      
      // Filter out main shell
      intersects = intersects.filter(i => i.object.name !== 'Merged_body019_001')

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        if (hoveredMesh === hit) return

        // Restore previous hover
        if (hoveredMesh && hoveredMesh !== selectedMesh && originalMaterials[hoveredMesh.uuid]) {
          hoveredMesh.material = originalMaterials[hoveredMesh.uuid]
          delete originalMaterials[hoveredMesh.uuid]
        }

        // Apply new hover
        if (hit !== selectedMesh) {
          originalMaterials[hit.uuid] = hit.material as THREE.Material
          const hoverMat = (hit.material as THREE.MeshStandardMaterial).clone()
          hoverMat.color = new THREE.Color(0xc8e6e3)
          hoverMat.emissive = new THREE.Color(0x1f6a60)
          hoverMat.emissiveIntensity = 0.15
          hit.material = hoverMat
        }

        hoveredMesh = hit
        canvas.style.cursor = 'pointer'
      } else {
        if (hoveredMesh && hoveredMesh !== selectedMesh && originalMaterials[hoveredMesh.uuid]) {
          hoveredMesh.material = originalMaterials[hoveredMesh.uuid]
          delete originalMaterials[hoveredMesh.uuid]
        }
        hoveredMesh = null
        canvas.style.cursor = 'grab'
      }
    }

    const onClick = (e: MouseEvent) => {
      if (!model) return

      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      let intersects = raycaster.intersectObject(model, true)
      intersects = intersects.filter(i => i.object.name !== 'Merged_body019_001')

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        const meshName = hit.name || ''

        highlightMesh(hit)
        controls.autoRotate = false

        if (BODY_DATA[meshName]) {
          selectPart(meshName)
        } else {
          const fallbackKey = fallbackFromPosition(intersects[0].point)
          if (fallbackKey) selectPart(fallbackKey)
        }
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)

    // Animation Loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mouseenter', onCanvasEnter)
      canvas.removeEventListener('mouseleave', onCanvasLeave)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
      
      // Dispose materials & geometries
      scene.traverse(object => {
        if (!(object as THREE.Mesh).isMesh) return
        const mesh = object as THREE.Mesh
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose())
        } else {
          mesh.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [webGlSupported])

  // Sync controls state with sidebar open state
  useEffect(() => {
    if (!panelOpen && !loading) {
      // Re-enable rotation when sidebar closes
      // (The three controls are local to useEffect, but clicking background handles canvas interactions)
    }
  }, [panelOpen, loading])

  // Navigate to doctors page
  const handleFindDoctors = () => {
    const query = customDiseaseText || selectedDiseaseName || activePart?.label || 'General'
    const part = activePart?.label || 'General'
    router.push(`/doctors?query=${encodeURIComponent(query)}&part=${encodeURIComponent(part)}`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="w-full sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-primary font-headline font-bold text-xl tracking-tight">
            <span className="material-symbols-outlined fill-icon">accessibility_new</span>
            BodyMap
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline font-medium text-sm">
            <Link href="/" className="text-slate-600 hover:text-primary transition-colors">Home</Link>
            <Link href="/explore" className="text-primary font-bold">Explore Body</Link>
            <Link href="/doctors" className="text-slate-600 hover:text-primary transition-colors">Doctors</Link>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Explore Space */}
      <main className="flex-grow flex relative overflow-hidden h-[calc(100vh-73px)]">
        <section ref={containerRef} id="model-section" className="flex-grow relative bg-[#f8f9fb]">
          {/* Hint overlay */}
          {!panelOpen && !loading && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/85 backdrop-blur-md border border-[#dee3e7] px-6 py-3 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-sm text-[#5a6064] pointer-events-none select-none animate-pulse">
              <span className="material-symbols-outlined text-primary text-[20px]">touch_app</span>
              Click any body part to explore symptoms
            </div>
          )}

          {/* Loading status */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f8f9fb]">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-slate-500 font-body">
                Loading 3D Model... {loadingPct}%
              </p>
            </div>
          )}

          {/* Canvas */}
          {webGlSupported ? (
            <canvas ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fb]">
              <span className="material-symbols-outlined text-[64px] text-error mb-4">error</span>
              <h2 className="text-xl font-headline font-bold text-on-background mb-2">WebGL Not Supported</h2>
              <p className="text-sm text-on-surface-variant max-w-md">Your browser or graphics processor does not support WebGL. Please use the fallback list below to select body regions.</p>
            </div>
          )}

          {/* Fallback buttons */}
          {showFallbackList && (
            <div className="absolute left-6 right-6 bottom-6 bg-white/95 backdrop-blur-md border border-outline-variant/20 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] z-20">
              <p className="font-headline text-sm font-bold text-on-background mb-3">Select a region to explore:</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(BODY_DATA).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectPart(key)}
                    className="px-4 py-2.5 rounded-full bg-surface-container-low hover:bg-primary/10 text-primary font-semibold text-xs border border-outline-variant/10 transition-colors"
                  >
                    {BODY_DATA[key].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-[420px] bg-white border-l border-outline-variant/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-40 transition-all duration-300 ease-in-out flex flex-col ${
            panelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/10 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="hover:text-primary cursor-pointer" onClick={() => setPanelOpen(false)}>Explorer</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-background font-semibold">{activePart?.label || '—'}</span>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-slate-100 hover:text-on-background transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-[#f1f4f7] rounded-2xl p-5 border border-primary/5">
              <div className="flex justify-between items-start mb-1">
                <h2 className="font-headline text-2xl font-bold text-primary">{activePart?.label || '—'}</h2>
                {activePart && (
                  <span className="bg-primary-container text-on-primary-container text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    {activePart.conditions.length} conditions
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">{activePart?.desc || '—'}</p>
            </div>
          </div>

          {/* Symptoms list */}
          <div className="flex-grow overflow-y-auto px-6 pb-28">
            <h3 className="font-headline text-[13px] font-bold text-on-background uppercase tracking-wider mb-4">Possible Conditions & Diseases</h3>
            
            <div className="space-y-2.5">
              {activePart?.conditions.map((c, index) => {
                const badgeStyle = c.severity === 'severe' 
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : c.severity === 'moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-teal-50 text-teal-700 border-teal-100'

                const isSelected = selectedDiseaseName === c.name

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDiseaseName(c.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:bg-slate-50 ${
                      isSelected
                        ? 'border-primary bg-teal-50/50 hover:bg-teal-50/50'
                        : 'border-outline-variant/10 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <h4 className={`font-headline text-[13px] font-bold transition-colors ${
                        isSelected ? 'text-primary' : 'text-on-background'
                      }`}>{c.name}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-normal">{c.detail}</p>
                  </div>
                )
              })}
            </div>

            {/* Custom disease input */}
            <div className="mt-6 pt-5 border-t border-dashed border-outline-variant/20">
              <label className="font-headline text-[13px] font-bold text-on-background block mb-1">
                Have a different condition?
              </label>
              <p className="text-[11px] text-on-surface-variant mb-3">
                Enter a specific disease or symptom not listed above to locate specialists.
              </p>
              <input
                type="text"
                value={customDiseaseText}
                onChange={(e) => setCustomDiseaseText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/35 bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                placeholder="Type disease or symptom name..."
              />
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-8 z-50">
            <button
              onClick={handleFindDoctors}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-headline font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              View Recommended Doctors
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}
