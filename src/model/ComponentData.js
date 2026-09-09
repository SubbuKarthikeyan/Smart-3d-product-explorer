/**
 * ComponentData.js
 * Prepared component metadata schema mapping product nodes to interactive properties.
 */
export const components = [
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
