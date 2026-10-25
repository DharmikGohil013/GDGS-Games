import { TrackConfig } from '../types/game';

export const DEFAULT_TRACKS: TrackConfig[] = [
  {
    id: 'monza',
    name: 'Monza Grand Prix',
    location: 'Autodromo Nazionale Monza, Italy',
    description: 'The Temple of Speed. Long high-speed straights, Prima Variante chicane, Curva Grande, and the sweeping Parabolica.',
    isLoop: true,
    surfaceGrip: 1.05,
    drsZoneStartDist: 100,
    drsZoneEndDist: 450,
    points: [
      { id: 'm1', x: 0, y: 0, z: 0, width: 15, kerb: 'none', hasDrs: true },
      { id: 'm2', x: 0, y: 0, z: 220, width: 15, kerb: 'none', hasDrs: true },
      { id: 'm3', x: 0, y: 0, z: 420, width: 14, kerb: 'left' },
      // Prima Variante Chicane
      { id: 'm4', x: 28, y: 0.2, z: 470, width: 13, kerb: 'right', banking: 2 },
      { id: 'm5', x: 8, y: 0.1, z: 520, width: 13, kerb: 'left', banking: -2 },
      // Curva Grande sweeping right
      { id: 'm6', x: 45, y: 0, z: 620, width: 15, kerb: 'right', banking: 4 },
      { id: 'm7', x: 120, y: 0, z: 720, width: 15, kerb: 'right', banking: 5 },
      { id: 'm8', x: 220, y: 0, z: 760, width: 14, kerb: 'none' },
      // Variante della Roggia
      { id: 'm9', x: 310, y: 0.5, z: 730, width: 13, kerb: 'left', banking: -3 },
      { id: 'm10', x: 335, y: 0.5, z: 680, width: 13, kerb: 'right', banking: 3 },
      // Lesmo 1 & 2
      { id: 'm11', x: 330, y: 1.2, z: 550, width: 14, kerb: 'right', banking: 5 },
      { id: 'm12', x: 290, y: 1.0, z: 420, width: 14, kerb: 'right', banking: 6 },
      // Serraglio back straight with DRS
      { id: 'm13', x: 250, y: 0.4, z: 280, width: 15, kerb: 'none', hasDrs: true },
      { id: 'm14', x: 210, y: 0.2, z: 120, width: 15, kerb: 'none', hasDrs: true },
      // Variante Ascari
      { id: 'm15', x: 165, y: 0, z: 20, width: 13, kerb: 'left', banking: -4 },
      { id: 'm16', x: 135, y: 0, z: -40, width: 13, kerb: 'right', banking: 4 },
      { id: 'm17', x: 140, y: 0, z: -120, width: 14, kerb: 'left', banking: -3 },
      // Parabolica
      { id: 'm18', x: 110, y: 0, z: -230, width: 15, kerb: 'right', banking: 7 },
      { id: 'm19', x: 30, y: 0, z: -260, width: 16, kerb: 'right', banking: 6 },
      { id: 'm20', x: -20, y: 0, z: -170, width: 15, kerb: 'none' },
    ]
  },
  {
    id: 'silverstone',
    name: 'Silverstone Apex Arena',
    location: 'Northamptonshire, United Kingdom',
    description: 'Legendary flowing high-downforce circuit featuring Copse, the legendary Maggotts-Becketts complex, and Stowe corner.',
    isLoop: true,
    surfaceGrip: 1.02,
    drsZoneStartDist: 150,
    drsZoneEndDist: 500,
    points: [
      { id: 's1', x: 0, y: 0, z: 0, width: 15, kerb: 'none', hasDrs: true },
      { id: 's2', x: 0, y: 0, z: 200, width: 15, kerb: 'none', hasDrs: true },
      // Abbey & Farm
      { id: 's3', x: 45, y: 0.2, z: 300, width: 14, kerb: 'right', banking: 4 },
      { id: 's4', x: 110, y: 0.2, z: 340, width: 14, kerb: 'left', banking: -3 },
      // Arena complex
      { id: 's5', x: 130, y: 0.4, z: 420, width: 13, kerb: 'right', banking: 5 },
      { id: 's6', x: 70, y: 0.2, z: 460, width: 13, kerb: 'left', banking: -4 },
      // Wellington straight
      { id: 's7', x: -20, y: 0, z: 420, width: 14, kerb: 'none', hasDrs: true },
      { id: 's8', x: -140, y: 0, z: 360, width: 14, kerb: 'none', hasDrs: true },
      // Brooklands & Luffield
      { id: 's9', x: -230, y: 0.2, z: 280, width: 14, kerb: 'left', banking: -5 },
      { id: 's10', x: -260, y: 0.3, z: 180, width: 14, kerb: 'right', banking: 6 },
      { id: 's11', x: -210, y: 0.1, z: 100, width: 14, kerb: 'right', banking: 5 },
      // Copse Corner
      { id: 's12', x: -120, y: 0, z: 40, width: 15, kerb: 'right', banking: 6 },
      // Maggotts, Becketts & Chapel S-curves
      { id: 's13', x: -70, y: 0.8, z: -60, width: 14, kerb: 'left', banking: -6 },
      { id: 's14', x: -110, y: 1.0, z: -150, width: 14, kerb: 'right', banking: 7 },
      { id: 's15', x: -50, y: 0.6, z: -220, width: 14, kerb: 'left', banking: -5 },
      // Hangar straight
      { id: 's16', x: 40, y: 0.2, z: -270, width: 15, kerb: 'none', hasDrs: true },
      { id: 's17', x: 150, y: 0, z: -230, width: 15, kerb: 'none', hasDrs: true },
      // Stowe Corner & Vale
      { id: 's18', x: 190, y: 0, z: -130, width: 14, kerb: 'right', banking: 6 },
      { id: 's19', x: 140, y: 0, z: -40, width: 13, kerb: 'left', banking: -4 },
      { id: 's20', x: 60, y: 0, z: -10, width: 14, kerb: 'right', banking: 3 },
    ]
  },
  {
    id: 'spa',
    name: 'Spa Eau Rouge & Raidillon',
    location: 'Circuit de Spa-Francorchamps, Belgium',
    description: 'Iconic roller-coaster circuit in the Ardennes forest with dramatic 24m elevation climb through Eau Rouge and the Kemmel Straight.',
    isLoop: true,
    surfaceGrip: 1.0,
    drsZoneStartDist: 180,
    drsZoneEndDist: 580,
    points: [
      { id: 'sp1', x: 0, y: 0, z: 0, width: 15, kerb: 'none' },
      // La Source Hairpin
      { id: 'sp2', x: -25, y: 0.2, z: 80, width: 13, kerb: 'right', banking: 8 },
      { id: 'sp3', x: -5, y: 0, z: 150, width: 14, kerb: 'none' },
      // Downhill run to Eau Rouge
      { id: 'sp4', x: 30, y: -2.5, z: 240, width: 15, kerb: 'none' },
      // Eau Rouge Left flick
      { id: 'sp5', x: 42, y: -0.5, z: 310, width: 14, kerb: 'left', banking: -7 },
      // Raidillon Blind Crest Right Climb
      { id: 'sp6', x: 25, y: 6.8, z: 380, width: 14, kerb: 'right', banking: 9 },
      { id: 'sp7', x: 15, y: 12.5, z: 460, width: 14, kerb: 'left', banking: -4 },
      // Kemmel Straight High Plateau
      { id: 'sp8', x: 5, y: 14.0, z: 580, width: 15, kerb: 'none', hasDrs: true },
      { id: 'sp9', x: -20, y: 14.0, z: 720, width: 15, kerb: 'none', hasDrs: true },
      // Les Combes Chicane
      { id: 'sp10', x: -60, y: 13.0, z: 820, width: 13, kerb: 'right', banking: 4 },
      { id: 'sp11', x: -110, y: 11.5, z: 800, width: 13, kerb: 'left', banking: -4 },
      // Malmedy & Bruxelles descent
      { id: 'sp12', x: -140, y: 8.0, z: 720, width: 14, kerb: 'right', banking: 7 },
      { id: 'sp13', x: -160, y: 4.5, z: 610, width: 14, kerb: 'right', banking: 8 },
      // Pouhon double-left high-G turn
      { id: 'sp14', x: -210, y: 2.0, z: 480, width: 15, kerb: 'left', banking: -8 },
      { id: 'sp15', x: -230, y: 1.0, z: 350, width: 15, kerb: 'left', banking: -7 },
      // Campus & Stavelot
      { id: 'sp16', x: -190, y: 0.5, z: 220, width: 14, kerb: 'right', banking: 5 },
      { id: 'sp17', x: -120, y: 0.2, z: 120, width: 15, kerb: 'right', banking: 6 },
      // Blanchimont flat-out left
      { id: 'sp18', x: -60, y: 0, z: -20, width: 15, kerb: 'left', banking: -5 },
      // Bus Stop Chicane
      { id: 'sp19', x: -35, y: 0, z: -90, width: 12, kerb: 'right', banking: 3 },
      { id: 'sp20', x: -10, y: 0, z: -60, width: 13, kerb: 'left', banking: -3 },
    ]
  },
  {
    id: 'curves_studio',
    name: 'Curves Studio Apex Loop',
    location: 'Curves Proving Ground, California',
    description: 'Custom engineered testing circuit showcasing extreme 12-degree banked curves, DRS straightaways, elevation roller drops, and dual hairpins.',
    isLoop: true,
    surfaceGrip: 1.10,
    drsZoneStartDist: 120,
    drsZoneEndDist: 480,
    points: [
      { id: 'c1', x: 0, y: 0, z: 0, width: 16, kerb: 'none', hasDrs: true },
      { id: 'c2', x: 0, y: 0, z: 180, width: 16, kerb: 'none', hasDrs: true },
      { id: 'c3', x: 40, y: 1.5, z: 280, width: 15, kerb: 'right', banking: 8 },
      { id: 'c4', x: 120, y: 3.5, z: 340, width: 15, kerb: 'right', banking: 11 },
      { id: 'c5', x: 210, y: 2.0, z: 300, width: 14, kerb: 'none' },
      { id: 'c6', x: 240, y: 0.0, z: 180, width: 13, kerb: 'left', banking: -6 },
      { id: 'c7', x: 190, y: -1.5, z: 80, width: 14, kerb: 'right', banking: 7 },
      { id: 'c8', x: 150, y: 0.0, z: -40, width: 15, kerb: 'none', hasDrs: true },
      { id: 'c9', x: 90, y: 1.0, z: -140, width: 14, kerb: 'right', banking: 10 },
      { id: 'c10', x: 10, y: 0.0, z: -110, width: 15, kerb: 'left', banking: -5 },
    ]
  }
];

export const DEFAULT_UPGRADES = {
  horsepower: 920,
  downforce: 1.8,
  tireCompound: 'soft' as const,
  suspensionStiffness: 1.5,
  brakeBias: 57,
  gearRatioPreset: 'balanced' as const,
  paintColor: '#e10600', // Ferrari F1 Rosso Corsa
  accentColor: '#1a1a1a', // Carbon weave black
  rimColor: '#e5e7eb', // Brushed aluminum
};
