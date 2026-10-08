export type ThemeId =
  | 'liquid-glass'
  | 'prismatic'
  | 'nano-particle'
  | 'holographic'
  | 'soft-aurora'
  | 'organic-liquid'
  | 'liquid-prism'
  | 'minimal-luxury';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  material: string;
  accentColor: string;
  surfaceBg: string;
  glassTint: string;
  borderStyle: string;
  composerStyle: string;
  shadowStyle: string;
  canvasConfig: {
    coreColor: number;
    secondaryColor: number;
    rimColor: number;
    roughness: number;
    metalness: number;
    transmission: number;
    ior: number;
    dispersion?: number;
    particleCount?: number;
    flowSpeed: number;
  };
}

export type UserGender = 'sele' | 'meye' | null;
export type UserAssignedName = 'Miku' | 'Araan' | null;
