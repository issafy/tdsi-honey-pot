import { create } from 'zustand';

const MAX_ATTACKS = 50;

const useStore = create((set, get) => ({
  // Active attacks shown as arcs on the globe (max 50)
  attacks: [],

  // Recent attacks for the sidebar feed
  recentAttacks: [],

  // Currently selected attack (for detail card)
  selectedAttack: null,

  // Globe interaction state
  globeAutoRotate: true,
  globeTarget: null, // { lat, lon } to focus on

  // Aggregated stats
  stats: {
    totalAttacks: 0,
    activeSources: 0,
    attacksLastHour: 0,
    attacksPerMinute: 0,
    topCountries: [],
  },

  // Connection status
  connected: false,
  error: null,

  // Actions
  addAttack: (attack) =>
    set((state) => ({
      attacks: [...state.attacks, attack].slice(-MAX_ATTACKS),
      recentAttacks: [attack, ...state.recentAttacks].slice(0, 100),
    })),

  setAttacks: (attacks) => set({ attacks: attacks.slice(-MAX_ATTACKS) }),
  setRecentAttacks: (attacks) => set({ recentAttacks: attacks.slice(0, 100) }),

  setStats: (stats) => set({ stats }),

  selectAttack: (attack) =>
    set({ selectedAttack: attack, globeAutoRotate: false }),

  clearSelection: () =>
    set({ selectedAttack: null, globeAutoRotate: true }),

  setGlobeTarget: (target) => set({ globeTarget: target }),
  setInteraction: (active) => set({ globeAutoRotate: !active }),

  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
}));

export default useStore;
