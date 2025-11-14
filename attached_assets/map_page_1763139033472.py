import reflex as rx
from app.state import CitiPulseState

def view_switcher() -> rx.Component:
    """3D View Controls"""
    views = [
        {"name": "🌍 Satellite", "type": "satellite"},
        {"name": "🏢 3D Buildings", "type": "3d"},
        {"name": "🔥 Heatmap", "type": "heatmap"},
        {"name": "🌫️ AQI Overlay", "type": "aqi"},
        {"name": "👥 Crowd View", "type": "crowd"},
    ]
    
    return rx.el.div(
        rx.foreach(
            views,
            lambda view: rx.el.button(
                view["name"],
                on_click=lambda v=view["type"]: CitiPulseState.set_map_view_mode(v),
                class_name=rx.cond(
                    CitiPulseState.map_view_mode == view["type"],
                    "px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-md transition-all",
                    "px-4 py-2 text-sm font-semibold text-slate-700 bg-white/80 hover:bg-white rounded-lg transition-all hover:shadow-md",
                ),
            ),
        ),
        class_name="absolute top-4 left-4 flex flex-wrap gap-2 z-[1000] bg-white/50 backdrop-blur-md p-3 rounded-lg shadow-lg",
    )

def campus_controls() -> rx.Component:
    """Campus-specific controls"""
    return rx.el.div(
        rx.el.p("🎮 Campus Controls", class_name="font-bold text-sm mb-2 text-slate-800"),
        rx.el.div(
            rx.el.button(
                "👥 Spawn People",
                on_click=CitiPulseState.spawn_agents,
                class_name="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700",
            ),
            rx.el.button(
                "🔄 Reset View", 
                on_click=lambda: CitiPulseState.set_map_view_mode("3d"),
                class_name="px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700",
            ),
            class_name="flex flex-wrap gap-2",
        ),
        class_name="absolute top-40 left-4 z-[1000] bg-white/70 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 max-w-xs",
    )

def working_3d_campus() -> rx.Component:
    """Fully embedded 3D Campus with MET Bhujbal Knowledge City"""
    
    embedded_html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>MET Bhujbal 3D Campus</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <style>
            body, html { margin:0; padding:0; width:100%; height:100%; background:#0b1220; font-family:'Segoe UI',Arial,sans-serif; overflow:hidden; }
            #container { width:100%; height:100%; position:relative; }
            #canvas { width:100%; height:100%; display:block; }
            #loading { 
                position:absolute; inset:0; display:flex; align-items:center; justify-content:center; 
                flex-direction:column; background:linear-gradient(135deg,#10b981 0%,#0ea5e9 100%); 
                color:white; z-index:50; 
            }
            .spinner { 
                width:56px; height:56px; border-radius:50%; 
                border:5px solid rgba(255,255,255,0.2); 
                border-top-color:white; 
                animation:spin 0.8s linear infinite; 
                margin-bottom:16px; 
            }
            @keyframes spin { to { transform:rotate(360deg); } }
            #ui { 
                position:absolute; right:20px; top:20px; z-index:60; 
                background:rgba(255,255,255,0.96); padding:14px; 
                border-radius:12px; min-width:220px; 
                box-shadow:0 8px 24px rgba(0,0,0,0.3); 
                color:#0f172a; font-size:13px;
                backdrop-filter: blur(10px);
            }
            .btn { 
                padding:9px 12px; border-radius:8px; border:none; 
                cursor:pointer; background:#10b981; color:white; 
                font-weight:600; margin:2px; font-size:12px;
                transition: all 0.2s;
            }
            .btn:hover { background:#059669; transform: translateY(-1px); }
            .btn.secondary { background:#e2e8f0; color:#0f172a; }
            .btn.secondary:hover { background:#cbd5e1; }
            .btn.active { background:#0ea5e9; box-shadow: 0 0 12px rgba(14,165,233,0.5); }
            .dot { 
                width:12px; height:12px; border-radius:50%; 
                display:inline-block; margin-right:8px; vertical-align:middle;
            }
            #error { 
                display:none; position:absolute; top:50%; left:50%; 
                transform:translate(-50%,-50%); background:rgba(239,68,68,0.95); 
                color:white; padding:24px; border-radius:12px; 
                max-width:400px; z-index:100; text-align:center;
            }
            .stat-row { 
                display:flex; justify-content:space-between; 
                padding:4px 0; border-bottom:1px solid #e2e8f0; 
            }
            .stat-row:last-child { border-bottom:none; }
        </style>
    </head>
    <body>
        <div id="container">
            <div id="loading">
                <div class="spinner"></div>
                <div style="font-size:22px; font-weight:700; margin-bottom:8px;">🏛️ Loading Campus</div>
                <div style="opacity:0.9; font-size:15px;">MET Bhujbal Knowledge City</div>
                <div style="opacity:0.8; font-size:13px; margin-top:12px;">Bhiwandi, Maharashtra</div>
            </div>
            <div id="error">
                <div style="font-size:20px; margin-bottom:12px;">❌ Loading Failed</div>
                <div id="errorMsg" style="font-size:14px;"></div>
                <button onclick="location.reload()" style="margin-top:16px; padding:8px 16px; background:white; color:#ef4444; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Retry</button>
            </div>
            <canvas id="canvas"></canvas>
            <div id="ui">
                <div style="font-weight:700; font-size:15px; margin-bottom:10px; color:#10b981;">🏫 MET Campus</div>
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:12px;">
                    <button class="btn active" id="btn3d" onclick="setViewMode('3d')">🏢 3D</button>
                    <button class="btn secondary" id="btnsat" onclick="setViewMode('sat')">🌍 Sat</button>
                    <button class="btn secondary" id="btnheat" onclick="setViewMode('heat')">🔥 Heat</button>
                    <button class="btn secondary" id="btnaqi" onclick="setViewMode('aqi')">🌫 AQI</button>
                </div>
                <div style="margin-bottom:8px;">
                    <button class="btn secondary" onclick="resetView()" style="width:100%;">🔄 Reset View</button>
                </div>
                <div style="font-size:12px; color:#475569; margin-top:12px; padding-top:12px; border-top:2px solid #e2e8f0;">
                    <div class="stat-row">
                        <span>🌡️ Temperature:</span>
                        <span id="tempVal" style="font-weight:600;">28°C</span>
                    </div>
                    <div class="stat-row">
                        <span>💧 Humidity:</span>
                        <span id="humVal" style="font-weight:600;">62%</span>
                    </div>
                    <div class="stat-row">
                        <span>👥 People:</span>
                        <span id="agentsVal" style="font-weight:600;">120</span>
                    </div>
                </div>
                <div style="margin-top:12px; padding-top:12px; border-top:2px solid #e2e8f0; font-size:11px; color:#334155;">
                    <div style="margin-bottom:4px; font-weight:600;">Air Quality:</div>
                    <div><span class="dot" style="background:#4ade80"></span>Good (0-50)</div>
                    <div><span class="dot" style="background:#facc15"></span>Moderate (51-100)</div>
                    <div><span class="dot" style="background:#fb923c"></span>Unhealthy (101-150)</div>
                </div>
            </div>
        </div>
        <script>
            try {
                console.log('🚀 Initializing 3D Campus...');
                
                if (typeof THREE === 'undefined') {
                    throw new Error('THREE.js library failed to load');
                }

                const canvas = document.getElementById('canvas');
                const renderer = new THREE.WebGLRenderer({ 
                    canvas, 
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance"
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setClearColor(0x0a0e1a, 1);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;

                const scene = new THREE.Scene();
                scene.fog = new THREE.Fog(0x0a0e1a, 200, 600);
                
                const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
                camera.position.set(0, 150, 280);

                // Custom orbit controls
                class OrbitControls {
                    constructor(camera, domElement) {
                        this.camera = camera;
                        this.domElement = domElement;
                        this.target = new THREE.Vector3(0, 20, 0);
                        this.enableDamping = true;
                        this.dampingFactor = 0.08;
                        this.rotateSpeed = 0.5;
                        this.zoomSpeed = 1.2;
                        
                        this.spherical = new THREE.Spherical();
                        this.sphericalDelta = new THREE.Spherical();
                        this.offset = new THREE.Vector3();
                        
                        this.mouseButtons = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };
                        this.state = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
                        this.currentState = this.state.NONE;
                        
                        this.rotateStart = new THREE.Vector2();
                        this.rotateEnd = new THREE.Vector2();
                        this.rotateDelta = new THREE.Vector2();
                        
                        this.panStart = new THREE.Vector2();
                        this.panEnd = new THREE.Vector2();
                        this.panDelta = new THREE.Vector2();
                        
                        this.scale = 1;
                        
                        this.domElement.addEventListener('contextmenu', e => e.preventDefault());
                        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
                        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
                        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
                        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
                        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
                        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
                        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
                    }
                    
                    onMouseDown(e) {
                        if (e.button === this.mouseButtons.LEFT) {
                            this.currentState = this.state.ROTATE;
                            this.rotateStart.set(e.clientX, e.clientY);
                        } else if (e.button === this.mouseButtons.RIGHT) {
                            this.currentState = this.state.PAN;
                            this.panStart.set(e.clientX, e.clientY);
                        }
                    }
                    
                    onMouseMove(e) {
                        if (this.currentState === this.state.ROTATE) {
                            this.rotateEnd.set(e.clientX, e.clientY);
                            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
                            
                            const element = this.domElement;
                            this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientHeight * this.rotateSpeed;
                            this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed;
                            
                            this.rotateStart.copy(this.rotateEnd);
                        } else if (this.currentState === this.state.PAN) {
                            this.panEnd.set(e.clientX, e.clientY);
                            this.panDelta.subVectors(this.panEnd, this.panStart);
                            this.pan(this.panDelta.x, this.panDelta.y);
                            this.panStart.copy(this.panEnd);
                        }
                    }
                    
                    onMouseUp(e) {
                        this.currentState = this.state.NONE;
                    }
                    
                    onMouseWheel(e) {
                        e.preventDefault();
                        if (e.deltaY < 0) {
                            this.scale /= 0.95;
                        } else {
                            this.scale *= 0.95;
                        }
                    }
                    
                    onTouchStart(e) {
                        if (e.touches.length === 1) {
                            this.currentState = this.state.ROTATE;
                            this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
                        } else if (e.touches.length === 2) {
                            this.currentState = this.state.PAN;
                        }
                    }
                    
                    onTouchMove(e) {
                        e.preventDefault();
                        if (e.touches.length === 1 && this.currentState === this.state.ROTATE) {
                            this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
                            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
                            
                            const element = this.domElement;
                            this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientHeight * this.rotateSpeed;
                            this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed;
                            
                            this.rotateStart.copy(this.rotateEnd);
                        }
                    }
                    
                    onTouchEnd(e) {
                        this.currentState = this.state.NONE;
                    }
                    
                    pan(deltaX, deltaY) {
                        const offset = new THREE.Vector3();
                        const panOffset = new THREE.Vector3();
                        
                        offset.copy(this.camera.position).sub(this.target);
                        let targetDistance = offset.length();
                        targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
                        
                        const factor = 2 * deltaX * targetDistance / this.domElement.clientHeight;
                        panOffset.setFromMatrixColumn(this.camera.matrix, 0);
                        panOffset.multiplyScalar(-factor);
                        this.target.add(panOffset);
                        
                        const factor2 = 2 * deltaY * targetDistance / this.domElement.clientHeight;
                        panOffset.setFromMatrixColumn(this.camera.matrix, 1);
                        panOffset.multiplyScalar(factor2);
                        this.target.add(panOffset);
                    }
                    
                    update() {
                        this.offset.copy(this.camera.position).sub(this.target);
                        this.spherical.setFromVector3(this.offset);
                        
                        this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
                        this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
                        this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
                        
                        this.spherical.radius *= this.scale;
                        this.spherical.radius = Math.max(50, Math.min(800, this.spherical.radius));
                        
                        this.sphericalDelta.theta *= (1 - this.dampingFactor);
                        this.sphericalDelta.phi *= (1 - this.dampingFactor);
                        this.scale = 1;
                        
                        this.offset.setFromSpherical(this.spherical);
                        this.camera.position.copy(this.target).add(this.offset);
                        this.camera.lookAt(this.target);
                    }
                    
                    reset() {
                        this.target.set(0, 20, 0);
                        this.sphericalDelta.set(0, 0, 0);
                        this.scale = 1;
                    }
                }

                const controls = new OrbitControls(camera, renderer.domElement);

                // Enhanced lighting
                const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
                scene.add(hemi);
                
                const dirLight = new THREE.DirectionalLight(0xffffff, 1);
                dirLight.position.set(-150, 300, 150);
                dirLight.castShadow = true;
                dirLight.shadow.camera.left = -250;
                dirLight.shadow.camera.right = 250;
                dirLight.shadow.camera.top = 250;
                dirLight.shadow.camera.bottom = -250;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;
                scene.add(dirLight);
                
                const ambient = new THREE.AmbientLight(0x404040, 0.5);
                scene.add(ambient);

                // Ground with texture
                const groundGeom = new THREE.PlaneGeometry(600, 500);
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: 0x1a1f2e,
                    roughness: 0.8,
                    metalness: 0.2
                });
                const ground = new THREE.Mesh(groundGeom, groundMat);
                ground.rotation.x = -Math.PI / 2;
                ground.position.y = 0;
                ground.receiveShadow = true;
                scene.add(ground);

                // Campus buildings group
                const campusGroup = new THREE.Group();
                scene.add(campusGroup);

                function addBuilding(x, z, w, d, h, color, label, hasRoof = true) {
                    const buildingGroup = new THREE.Group();
                    
                    // Main building
                    const mat = new THREE.MeshStandardMaterial({ 
                        color, 
                        metalness: 0.3, 
                        roughness: 0.7,
                        emissive: color,
                        emissiveIntensity: 0.05
                    });
                    const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                    building.position.y = h/2 + 1;
                    building.castShadow = true;
                    building.receiveShadow = true;
                    buildingGroup.add(building);
                    
                    // Building edges
                    const edges = new THREE.EdgesGeometry(building.geometry);
                    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.4, transparent: true });
                    const lines = new THREE.LineSegments(edges, lineMat);
                    lines.position.copy(building.position);
                    buildingGroup.add(lines);
                    
                    // Roof
                    if (hasRoof) {
                        const roofGeom = new THREE.ConeGeometry(w * 0.6, h * 0.2, 4);
                        const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
                        const roof = new THREE.Mesh(roofGeom, roofMat);
                        roof.position.y = h + 1 + (h * 0.1);
                        roof.rotation.y = Math.PI / 4;
                        roof.castShadow = true;
                        buildingGroup.add(roof);
                    }
                    
                    buildingGroup.position.set(x, 0, z);
                    campusGroup.add(buildingGroup);
                    
                    return buildingGroup;
                }

                // MET Bhujbal Campus Buildings (realistic layout)
                addBuilding(-50, 0, 45, 35, 32, 0xd4d4d8, 'Knowledge City Main', false);
                addBuilding(-140, 35, 35, 28, 26, 0x93c5fd, 'Pharmacy Institute');
                addBuilding(70, 15, 42, 30, 28, 0xfca5a5, 'Science & Commerce');
                addBuilding(-15, 100, 32, 22, 14, 0xa7f3d0, 'Sports Complex', false);
                addBuilding(-110, 80, 30, 22, 22, 0xc4b5fd, 'Academic Block A');
                addBuilding(100, 90, 32, 24, 24, 0xfcd34d, 'Engineering Block');
                addBuilding(60, -45, 36, 28, 22, 0xfbbf24, 'Library & Research');
                addBuilding(-90, -35, 28, 24, 18, 0x86efac, 'Student Cafeteria', false);
                addBuilding(15, 50, 25, 20, 16, 0xfda4af, 'Administrative Office');
                addBuilding(-160, -20, 22, 18, 20, 0xa5b4fc, 'Hostel Block 1');
                addBuilding(130, -30, 24, 20, 22, 0xa5b4fc, 'Hostel Block 2');

                // Trees and landscaping
                function addTree(x, z) {
                    const trunkGeom = new THREE.CylinderGeometry(0.5, 0.8, 4);
                    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
                    trunk.position.set(x, 2, z);
                    trunk.castShadow = true;
                    scene.add(trunk);
                    
                    const foliageGeom = new THREE.SphereGeometry(3, 8, 8);
                    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 });
                    const foliage = new THREE.Mesh(foliageGeom, foliageMat);
                    foliage.position.set(x, 5.5, z);
                    foliage.castShadow = true;
                    scene.add(foliage);
                }

                // Add trees around campus
                const treePositions = [
                    [30, 60], [-30, -60], [50, -20], [-70, 50],
                    [110, 40], [-130, -50], [20, -80], [-100, 110]
                ];
                treePositions.forEach(([x, z]) => addTree(x, z));

                // People particles (agents)
                const agentCount = 150;
                const positions = new Float32Array(agentCount * 3);
                const colors = new Float32Array(agentCount * 3);
                const agentSpeeds = new Float32Array(agentCount * 2);
                
                for (let i = 0; i < agentCount; i++) {
                    positions[i*3] = (Math.random() - 0.5) * 280;
                    positions[i*3+1] = 1.8;
                    positions[i*3+2] = (Math.random() - 0.5) * 200;
                    
                    agentSpeeds[i*2] = (Math.random() - 0.5) * 1.2;
                    agentSpeeds[i*2+1] = (Math.random() - 0.5) * 1.2;
                    
                    const hue = Math.random() * 0.15 + 0.55;
                    const col = new THREE.Color().setHSL(hue, 0.8, 0.6);
                    colors[i*3] = col.r;
                    colors[i*3+1] = col.g;
                    colors[i*3+2] = col.b;
                }
                
                const agentsGeom = new THREE.BufferGeometry();
                agentsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                agentsGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                const agentsMat = new THREE.PointsMaterial({ 
                    size: 5,
                    vertexColors: true,
                    sizeAttenuation: true,
                    transparent: true,
                    opacity: 0.9
                });
                const agents = new THREE.Points(agentsGeom, agentsMat);
                scene.add(agents);

                // Enhanced grid
                const grid = new THREE.GridHelper(500, 50, 0x1e3a5f, 0x0f1f3a);
                grid.position.y = 0.05;
                scene.add(grid);

                // Resize handler
                function resize() {
                    const w = canvas.clientWidth;
                    const h = canvas.clientHeight;
                    if (canvas.width !== w || canvas.height !== h) {
                        renderer.setSize(w, h, false);
                        camera.aspect = w / h;
                        camera.updateProjectionMatrix();
                    }
                }
                window.addEventListener('resize', resize);
                resize();

                // Camera presets
                const cameraPresets = {
                    '3d': { pos: [0, 150, 280], target: [0, 20, 0], fov: 50 },
                    'sat': { pos: [0, 450, 10], target: [0, 0, 0], fov: 60 },
                    'heat': { pos: [-40, 180, 180], target: [0, 20, 0], fov: 52 },
                    'aqi': { pos: [100, 160, 70], target: [40, 20, 30], fov: 54 }
                };
                
                let currentMode = '3d';
                
                function setViewMode(mode) {
                    currentMode = mode;
                    console.log('📍 View mode:', mode);
                    
                    // Update UI buttons
                    ['3d', 'sat', 'heat', 'aqi'].forEach(m => {
                        const btn = document.getElementById('btn' + m);
                        if (btn) {
                            if (m === mode) {
                                btn.classList.add('active');
                                btn.classList.remove('secondary');
                            } else {
                                btn.classList.remove('active');
                                btn.classList.add('secondary');
                            }
                        }
                    });
                    
                    const preset = cameraPresets[mode] || cameraPresets['3d'];
                    const steps = 60;
                    let step = 0;
                    
                    const startPos = camera.position.clone();
                    const startTarget = controls.target.clone();
                    const endPos = new THREE.Vector3(...preset.pos);
                    const endTarget = new THREE.Vector3(...preset.target);
                    const startFov = camera.fov;
                    const endFov = preset.fov;
                    
                    const animId = setInterval(() => {
                        step++;
                        const progress = Math.min(1, step / steps);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        
                        camera.position.lerpVectors(startPos, endPos, eased);
                        controls.target.lerpVectors(startTarget, endTarget, eased);
                        camera.fov = startFov + (endFov - startFov) * eased;
                        camera.updateProjectionMatrix();
                        
                        if (progress >= 1) clearInterval(animId);
                    }, 16);
                }
                
                window.setViewMode = setViewMode;
                
                function resetView() {
                    console.log('🔄 Resetting view');
                    setViewMode('3d');
                    controls.reset();
                }
                
                window.resetView = resetView;

                // Agent animation
                function animateAgents(deltaTime) {
                    const pos = agentsGeom.attributes.position.array;
                    for (let i = 0; i < agentCount; i++) {
                        const idx = i * 3;
                        pos[idx] += agentSpeeds[i*2] * deltaTime * 0.6;
                        pos[idx+2] += agentSpeeds[i*2+1] * deltaTime * 0.6;
                        
                        // Boundary bounce
                        if (pos[idx] > 240 || pos[idx] < -240) agentSpeeds[i*2] *= -1;
                        if (pos[idx+2] > 200 || pos[idx+2] < -200) agentSpeeds[i*2+1] *= -1;
                    }
                    agentsGeom.attributes.position.needsUpdate = true;
                }

                // Main render loop
                let lastTime = performance.now();
                let frameCount = 0;
                
                function renderLoop(currentTime) {
                    const deltaTime = Math.min((currentTime - lastTime) / 16.666, 2);
                    lastTime = currentTime;
                    
                    resize();
                    animateAgents(deltaTime);
                    controls.update();
                    renderer.render(scene, camera);
                    
                    frameCount++;
                    if (frameCount % 60 === 0) {
                        document.getElementById('agentsVal').textContent = agentCount;
                    }
                    
                    requestAnimationFrame(renderLoop);
                }

                // Listen for parent window messages (from Reflex state)
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'setViewMode') {
                        setViewMode(event.data.mode);
                    } else if (event.data.type === 'spawnAgents') {
                        console.log('👥 Spawning more agents');
                        // Could add more agents here
                    } else if (event.data.type === 'updateWeather') {
                        document.getElementById('tempVal').textContent = event.data.temp + '°C';
                        document.getElementById('humVal').textContent = event.data.humidity + '%';
                    }
                });

                // Initialize
                console.log('✅ 3D Campus initialized successfully');
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                    setViewMode('3d');
                    requestAnimationFrame(renderLoop);
                }, 1200);

            } catch (error) {
                console.error('❌ Critical error:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                document.getElementById('errorMsg').textContent = error.message || 'Failed to initialize 3D scene. Please refresh the page.';
            }
        </script>
    </body>
    </html>
    '''
    
    return rx.box(
        rx.html(embedded_html),
        id="campus-3d-container",
        class_name="w-full h-full",
        style={
            "width": "100%", 
            "height": "100%",
            "minHeight": "500px",
            "borderRadius": "12px",
            "overflow": "hidden"
        }
    )

def zone_legend() -> rx.Component:
    legend_items = [
        {"color": "#4ade80", "label": "Good (AQI ≤ 50)", "emoji": "✅"},
        {"color": "#facc15", "label": "Moderate (AQI ≤ 100)", "emoji": "⚠️"},
        {"color": "#fb923c", "label": "Unhealthy Sensitive", "emoji": "🚸"},
        {"color": "#f87171", "label": "Unhealthy (AQI > 150)", "emoji": "🚨"},
    ]
    return rx.el.div(
        rx.el.p("📊 Environmental Legend", class_name="font-bold text-sm mb-2 text-slate-800"),
        rx.foreach(
            legend_items,
            lambda item: rx.el.div(
                rx.el.div(class_name=f"w-4 h-4 rounded-full", style={"background-color": item["color"]}),
                rx.el.span(f"{item['emoji']} {item['label']}", class_name="text-xs text-slate-600"),
                class_name="flex items-center gap-2 mb-1",
            ),
        ),
        class_name="absolute bottom-20 left-4 z-[1000] bg-white/70 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200",
    )

def real_weather_display() -> rx.Component:
    return rx.el.div(
        rx.el.p("🌤️ Live Campus Data", class_name="font-bold text-sm mb-2 text-slate-800"),
        rx.el.div(
            rx.el.div(
                rx.el.span("🌡️", class_name="text-base"),
                rx.el.span(
                    f"{CitiPulseState.real_weather_temp}°C",
                    class_name="font-semibold text-slate-700"
                ),
                class_name="flex items-center gap-2",
            ),
            rx.el.div(
                rx.el.span("💧", class_name="text-base"),
                rx.el.span(
                    f"{CitiPulseState.real_weather_humidity}%",
                    class_name="font-semibold text-slate-700"
                ),
                class_name="flex items-center gap-2",
            ),
            rx.el.div(
                rx.el.span("👥", class_name="text-base"),
                rx.el.span("150 People", class_name="font-semibold text-slate-700"),
                class_name="flex items-center gap-2",
            ),
            rx.el.div(
                rx.el.span("📍", class_name="text-base"),
                rx.el.span("Bhiwandi, MH", class_name="font-semibold text-slate-700"),
                class_name="flex items-center gap-2",
            ),
            class_name="flex flex-col gap-2 text-xs text-slate-600",
        ),
        class_name="absolute bottom-4 left-4 z-[1000] bg-white/70 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 min-w-[160px]",
    )

def map_page() -> rx.Component:
    """2.5D Digital Twin Campus Map - FULLY FIXED VERSION"""
    
    return rx.box(
        # Main container
        rx.box(
            # Overlay controls
            view_switcher(),
            campus_controls(),
            real_weather_display(),
            zone_legend(),
            
            # 3D Campus visualization
            working_3d_campus(),
            
            class_name="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        ),
        
        # Outer container with fixed dimensions
        class_name="w-full h-[600px] min-h-[600px] rounded-2xl shadow-2xl border-2 border-emerald-200 bg-white overflow-hidden",
        style={
            "width": "100%",
            "height": "600px",
            "minHeight": "600px",
            "position": "relative"
        }
    )