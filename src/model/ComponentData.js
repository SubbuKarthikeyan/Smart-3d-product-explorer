/**
 * ComponentData.js
 * Multi-model component metadata schema mapping 3D nodes to interactive subsystem properties.
 * Single source of truth for both Demo Product and Engine models.
 */

// ─── Demo Product Model Components ──────────────────────────────────────────

export const productComponents = [
  {
    id: 'engine',
    name: 'Turbine Propulsion System',
    category: 'Power & Propulsion',
    description: 'High-thrust dual-stage electric turbofan generating primary vector acceleration.',
    modelNode: 'Engine',
    hotspotPosition: { x: -1.4, y: 0.5, z: 0.65 },
    explodedPosition: { x: -2.8, y: 0.8, z: 1.2 }
  },
  {
    id: 'battery',
    name: 'Lithium-Solid Power Core',
    category: 'Energy Storage',
    description: 'High-density modular energy array supplying synchronous 800V DC architecture.',
    modelNode: 'Battery',
    hotspotPosition: { x: -0.2, y: -0.8, z: 0 },
    explodedPosition: { x: -0.2, y: -2.0, z: 0 }
  },
  {
    id: 'cooling',
    name: 'Thermal Management Matrix',
    category: 'Climate & Heat Dissipation',
    description: 'Micro-channel fin heat exchanger preventing thermal throttling under peak discharge.',
    modelNode: 'CoolingSystem',
    hotspotPosition: { x: 0, y: 0.8, z: 0 },
    explodedPosition: { x: 0, y: 2.2, z: 0 }
  },
  {
    id: 'control',
    name: 'Avionics & Autonomous Guidance Unit',
    category: 'Computing & Sensor Array',
    description: 'Real-time telemetry processor and optical LiDAR guidance subsystem.',
    modelNode: 'ControlUnit',
    hotspotPosition: { x: 0.6, y: 0.8, z: 0 },
    explodedPosition: { x: 1.8, y: 1.6, z: 0 }
  },
  {
    id: 'body',
    name: 'Carbon Aerodynamic Fuselage',
    category: 'Structural Airframe',
    description: 'Ultra-lightweight structural monocoque chassis engineered for low drag coefficient.',
    modelNode: 'MainBody',
    hotspotPosition: { x: 0.8, y: 0, z: 0 },
    explodedPosition: { x: 0, y: 0, z: 0 }
  }
];

// ─── Engine Assembly Components ─────────────────────────────────────────────

export const engineComponents = [
  {
    id: 'nacelle',
    name: 'Bypass Nacelle & Cowling',
    category: 'Airframe & Aerodynamics',
    description: 'Aerodynamic composite outer cowl regulating high-bypass bypass ratio and providing acoustic dampening.',
    modelNode: 'BypassNacelle',
    hotspotPosition: { x: 0, y: 1.3, z: 0 },
    explodedPosition: { x: 0, y: 2.4, z: 0 }
  },
  {
    id: 'turbine-fan',
    name: 'Titanium Intake Fan & Spinner',
    category: 'Intake & Low-Pressure Stage',
    description: 'Wide-chord titanium swept fan blades drawing intake airflow and delivering high mass-flow thrust.',
    modelNode: 'TurbineFan',
    hotspotPosition: { x: 1.2, y: 0.6, z: 0.5 },
    explodedPosition: { x: 2.5, y: 0.6, z: 0.8 }
  },
  {
    id: 'compressor',
    name: 'High-Pressure Axial Compressor',
    category: 'Core Compression',
    description: 'Multi-stage axial blisk rotor assembly achieving 40:1 overall pressure ratio before combustion.',
    modelNode: 'CompressorCore',
    hotspotPosition: { x: 0.3, y: 0.7, z: 0 },
    explodedPosition: { x: 0.8, y: 1.6, z: 0 }
  },
  {
    id: 'combustion',
    name: 'Annular Combustion Chamber',
    category: 'Combustion & Thermal Core',
    description: 'High-temperature ceramic matrix liner with swirl fuel injectors enabling complete fuel vaporization.',
    modelNode: 'CombustionChamber',
    hotspotPosition: { x: -0.7, y: 0.75, z: 0 },
    explodedPosition: { x: -0.9, y: -1.8, z: 0 }
  },
  {
    id: 'exhaust',
    name: 'Variable Vectoring Exhaust Nozzle',
    category: 'Exhaust & Thrust Vectoring',
    description: 'Convergent-divergent vectoring nozzle accelerating exhaust gases and directing multi-axis thrust.',
    modelNode: 'ExhaustNozzle',
    hotspotPosition: { x: -1.6, y: 0.65, z: 0 },
    explodedPosition: { x: -2.8, y: 0.8, z: 0 }
  }
];

// Alias for backward compatibility
export const components = productComponents;

// ─── Multi-Model Registry & Lookup ──────────────────────────────────────────

export const COMPONENT_REGISTRY = {
  product: productComponents,
  engine: engineComponents
};

/**
 * Retrieve components list for a given model ID or type string
 * @param {string} [modelTypeOrId='product']
 * @returns {Array<Object>}
 */
export function getComponentsForModel(modelTypeOrId = 'product') {
  if (!modelTypeOrId) return productComponents;
  const key = String(modelTypeOrId).toLowerCase();

  if (key.includes('engine')) {
    return engineComponents;
  }
  return productComponents;
}

