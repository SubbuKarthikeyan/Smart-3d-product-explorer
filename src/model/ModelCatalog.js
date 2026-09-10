/**
 * ModelCatalog.js
 * Data-driven catalog of available 3D product models.
 * Single source of truth for the Model Selection screen.
 * No application logic — metadata only.
 */
export const MODEL_CATALOG = [
  {
    id: 'product',
    name: 'Demo Product Model',
    tagline: 'Aerodynamic Demo Prototype',
    description:
      'Explore the interactive demo multi-part product assembly. Inspect core subsystems including turbine propulsion, power core, thermal matrix, and autonomous avionics.',
    path: '/models/product.glb',
    type: 'product',
    icon: '⎔'
  },
  {
    id: 'engine',
    name: 'Engine Assembly',
    tagline: 'Propulsion System',
    description:
      'Inspect the high-thrust engine assembly. Examine internal components and structural architecture.',
    path: '/models/engine.glb',
    type: 'engine',
    icon: '⚙'
  }
];
