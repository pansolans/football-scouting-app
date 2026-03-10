export type BlockType = 'header' | 'text' | 'image' | 'video' | 'stats_table' | 'divider' | 'shape' | 'banner';

export interface TextStyle {
  color?: string;
  fontSize?: number;     // px
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
}
export interface HeaderContent { text: string; level: 1 | 2 | 3; textStyle?: TextStyle; }
export interface TextContent { text: string; textStyle?: TextStyle; }
export interface ImageContent { url: string; caption?: string; width?: number; }
export interface VideoContent { url: string; caption?: string; }
export interface StatsTableContent { reportIds: string[]; categories: string[]; }
export interface DividerContent { style?: 'solid' | 'dashed' | 'accent'; }
export interface ShapeContent {
  backgroundColor: string;
  opacity: number;       // 0-100
  borderRadius: number;  // px
  borderColor: string;
  borderWidth: number;   // px
  label?: string;        // optional text inside
}
export interface BannerContent {
  title: string;
  subtitle?: string;
  date?: string;
  logoUrl?: string;
  photoUrl?: string;
}

export interface BlockStyle {
  x: number;  // % from left (0-100)
  y: number;  // % from top (0-100)
  w: number;  // width % (0-100)
  h: number;  // height % (0-100)
}

export const DEFAULT_BLOCK_STYLE: BlockStyle = { x: 5, y: 3, w: 90, h: 10 };

export interface ReportBlock {
  id: string;
  type: BlockType;
  content: any;
  style?: BlockStyle;
}

export interface ReportPage {
  id: string;
  blocks: ReportBlock[];
}

export interface CoverData {
  enabled?: boolean;
  backgroundImage?: string;
  overlayOpacity?: number;  // 0-100, default 60
  blocks?: ReportBlock[];   // movable elements on cover page
  // Legacy fields (kept for backwards compat, ignored if blocks exist)
  clubLogo?: string;
  playerPhoto?: string;
  title: string;
  subtitle?: string;
  date?: string;
  titleAlign?: 'left' | 'center' | 'right';
}

export interface BuilderReport {
  id?: string;
  title: string;
  player_id?: string;
  player_name?: string;
  player_wyscout_id?: number;
  cover_data: CoverData;
  blocks: ReportBlock[];       // kept for backwards compat
  pages?: ReportPage[];        // new page-based layout
  is_template: boolean;
  template_name?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const createBlock = (type: BlockType): ReportBlock => {
  const id = crypto.randomUUID();
  switch (type) {
    case 'header': return { id, type, content: { text: 'Titulo', level: 1 } };
    case 'text': return { id, type, content: { text: '' } };
    case 'image': return { id, type, content: { url: '', caption: '' } };
    case 'video': return { id, type, content: { url: '', caption: '' } };
    case 'stats_table': return { id, type, content: { reportIds: [], categories: ['tecnico', 'fisico', 'mental'] } };
    case 'divider': return { id, type, content: { style: 'accent' } };
    case 'shape': return { id, type, content: { backgroundColor: '#00bf63', opacity: 100, borderRadius: 0, borderColor: 'transparent', borderWidth: 0, label: '' } };
    case 'banner': return { id, type, content: { title: 'Titulo del Informe', subtitle: '', date: new Date().toISOString().split('T')[0], logoUrl: '', photoUrl: '' } };
  }
};

export const createPage = (): ReportPage => ({
  id: crypto.randomUUID(),
  blocks: [],
});

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: 'Titulo',
  text: 'Texto',
  image: 'Imagen',
  video: 'Video',
  stats_table: 'Estadisticas',
  divider: 'Separador',
  shape: 'Forma',
  banner: 'Barra',
};
