import React, { useState, useEffect, useRef } from 'react';
import { BuilderReport, ReportBlock, ReportPage, BlockType, BlockStyle, DEFAULT_BLOCK_STYLE, createBlock, createPage, BLOCK_LABELS } from './types';
import { reportBuilderService } from '../../services/reportBuilderService';
import { scoutingService, playerService, ScoutReport } from '../../services/api';
import BlockPalette from './BlockPalette';
import CoverEditor from './CoverEditor';
import HeaderBlock from './blocks/HeaderBlock';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';
import StatsTableBlock from './blocks/StatsTableBlock';
import ShapeBlock from './blocks/ShapeBlock';
import BannerBlock from './blocks/BannerBlock';

interface Props {
  reportId?: string;
  onBack: () => void;
  preselectedPlayer?: { playerId: string; playerName: string };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Default sizes per block type (% of page)
const BLOCK_SIZES: Record<BlockType, { w: number; h: number }> = {
  header: { w: 90, h: 8 },
  text: { w: 88, h: 18 },
  image: { w: 70, h: 35 },
  video: { w: 60, h: 8 },
  stats_table: { w: 88, h: 40 },
  divider: { w: 90, h: 1.5 },
  shape: { w: 40, h: 10 },
  banner: { w: 94, h: 10 },
};

const ReportEditor: React.FC<Props> = ({ reportId, onBack, preselectedPlayer }) => {
  const [report, setReport] = useState<BuilderReport>({
    title: 'Nuevo Informe',
    cover_data: { title: 'Informe de Jugador', date: new Date().toISOString().split('T')[0] },
    blocks: [],
    pages: [createPage()],
    is_template: false,
  });

  const [activePage, setActivePage] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize';
    blockId: string;
    startX: number;
    startY: number;
    origStyle: BlockStyle;
  } | null>(null);
  const [playerReports, setPlayerReports] = useState<ScoutReport[]>([]);
  const [playerPhoto, setPlayerPhoto] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const pages = report.pages || [{ id: crypto.randomUUID(), blocks: report.blocks }];
  const coverBlocks = report.cover_data.blocks || [];
  const isCoverActive = activePage === -1 && (report.cover_data.enabled ?? false);
  const currentPage = isCoverActive
    ? { id: '__cover__', blocks: coverBlocks }
    : (pages[activePage] || pages[0]);

  const setPages = (updater: (prev: ReportPage[]) => ReportPage[]) => {
    setReport(prev => {
      const cur = prev.pages || [{ id: crypto.randomUUID(), blocks: prev.blocks }];
      const newPages = updater(cur);
      return { ...prev, pages: newPages, blocks: newPages.flatMap(p => p.blocks) };
    });
  };

  const setCoverBlocks = (updater: (prev: ReportBlock[]) => ReportBlock[]) => {
    setReport(prev => ({
      ...prev,
      cover_data: { ...prev.cover_data, blocks: updater(prev.cover_data.blocks || []) },
    }));
  };

  // ─── Load ───
  useEffect(() => {
    if (reportId) {
      reportBuilderService.get(reportId).then(r => {
        if (!r.pages || r.pages.length === 0) {
          r.pages = [{ id: crypto.randomUUID(), blocks: r.blocks || [] }];
        }
        setReport(r);
        if (r.player_id) loadPlayerData(r.player_id);
      }).catch(console.error);
    }
  }, [reportId]);

  useEffect(() => {
    if (preselectedPlayer && !reportId) {
      const { playerId, playerName } = preselectedPlayer;
      setReport(prev => ({
        ...prev,
        player_id: playerId,
        player_name: playerName,
        cover_data: { ...prev.cover_data, title: `Informe: ${playerName}` },
      }));
      loadPlayerData(playerId);
    }
  }, [preselectedPlayer]);

  // ─── Drag / Resize via window events ───
  useEffect(() => {
    if (!interaction) return;

    const handleMove = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - interaction.startX) / rect.width) * 100;
      const dy = ((e.clientY - interaction.startY) / rect.height) * 100;
      const o = interaction.origStyle;

      const newStyle: BlockStyle = interaction.type === 'move'
        ? { ...o, x: clamp(o.x + dx, 0, 100 - o.w), y: clamp(o.y + dy, 0, 100 - o.h) }
        : { ...o, w: clamp(o.w + dx, 5, 100 - o.x), h: clamp(o.h + dy, 2, 100 - o.y) };

      setReport(prev => {
        // Check if block is in cover
        const inCover = (prev.cover_data.blocks || []).some(b => b.id === interaction.blockId);
        if (inCover) {
          return {
            ...prev,
            cover_data: {
              ...prev.cover_data,
              blocks: (prev.cover_data.blocks || []).map(b => b.id === interaction.blockId ? { ...b, style: newStyle } : b),
            },
          };
        }
        const newPages = (prev.pages || []).map(p => ({
          ...p,
          blocks: p.blocks.map(b => b.id === interaction.blockId ? { ...b, style: newStyle } : b),
        }));
        return { ...prev, pages: newPages, blocks: newPages.flatMap(p => p.blocks) };
      });
    };

    const handleUp = () => setInteraction(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [interaction]);

  // ─── Data loading ───
  const loadPlayerData = async (playerId: string, autoGenerate = false) => {
    try {
      const [reports, profileData] = await Promise.allSettled([
        scoutingService.getPlayerReports(playerId),
        playerService.getPlayersBatchInfo([parseInt(playerId)], [], true),
      ]);
      let loadedReports: ScoutReport[] = [];
      let playerInfo: any = null;
      if (reports.status === 'fulfilled') { loadedReports = reports.value; setPlayerReports(loadedReports); }
      if (profileData.status === 'fulfilled') {
        playerInfo = Object.values(profileData.value)[0] as any;
        if (playerInfo?.player_image) {
          setPlayerPhoto(playerInfo.player_image);
          setReport(prev => ({ ...prev, cover_data: { ...prev.cover_data, playerPhoto: playerInfo.player_image } }));
        }
      }
      if (autoGenerate && loadedReports.length > 0) {
        const newPages = generatePagesFromReports(loadedReports, playerInfo);
        setReport(prev => ({ ...prev, pages: newPages, blocks: newPages.flatMap(p => p.blocks) }));
      }
    } catch (e) { console.error(e); }
  };

  const generatePagesFromReports = (reports: ScoutReport[], playerInfo: any): ReportPage[] => {
    const id = () => crypto.randomUUID();
    const pagesOut: ReportPage[] = [];
    const s = (x: number, y: number, w: number, h: number): BlockStyle => ({ x, y, w, h });

    // Page 1: info + radar
    const p1: ReportBlock[] = [];
    p1.push({ id: id(), type: 'header', content: { text: 'Resumen de Scouting', level: 1 }, style: s(5, 14, 90, 8) });
    if (playerInfo) {
      const lines = [
        playerInfo.team_name ? `Equipo: ${playerInfo.team_name}` : '',
        playerInfo.position ? `Posicion: ${playerInfo.position}` : '',
        playerInfo.age ? `Edad: ${playerInfo.age} años` : '',
        playerInfo.height ? `Altura: ${playerInfo.height}cm` : '',
        playerInfo.foot ? `Pie: ${playerInfo.foot === 'right' ? 'Derecho' : playerInfo.foot === 'left' ? 'Izquierdo' : 'Ambidiestro'}` : '',
        playerInfo.market_value ? `Valor de Mercado: EUR ${(playerInfo.market_value / 1000000).toFixed(1)}M` : '',
        playerInfo.contract_expires ? `Contrato hasta: ${new Date(playerInfo.contract_expires).toLocaleDateString('es-ES')}` : '',
      ].filter(Boolean).join('\n');
      if (lines) p1.push({ id: id(), type: 'text', content: { text: lines }, style: s(5, 20, 90, 14) });
    }
    p1.push({ id: id(), type: 'divider', content: { style: 'accent' }, style: s(5, 35, 90, 1.5) });
    p1.push({ id: id(), type: 'stats_table', content: { reportIds: [], categories: ['tecnico', 'fisico', 'mental'] }, style: s(5, 38, 90, 40) });
    pagesOut.push({ id: id(), blocks: p1 });

    reports.forEach((r, idx) => {
      const blocks: ReportBlock[] = [];
      let y = 3;
      const add = (type: BlockType, content: any, h: number) => {
        blocks.push({ id: id(), type, content, style: s(5, y, 90, h) });
        y += h + 1.5;
      };
      add('header', { text: `Reporte ${idx + 1}${r.fecha_observacion ? ` — ${r.fecha_observacion}` : ''}${r.competicion ? ` (${r.competicion})` : ''}`, level: 2 }, 5);
      add('text', { text: `Rating General: ${r.overall_rating}/10` }, 3.5);
      add('text', { text: `TECNICO\nTecnica: ${r.tecnica_individual}/10 | Pase: ${r.pase}/10 | Primer Toque: ${r.primer_toque}/10\nControl: ${r.control_balon}/10 | Vision: ${r.vision_juego}/10` }, 9);
      add('text', { text: `FISICO\nVelocidad: ${r.velocidad}/10 | Resistencia: ${r.resistencia}/10 | Fuerza: ${r.fuerza}/10\nSalto: ${r.salto}/10 | Agilidad: ${r.agilidad}/10` }, 9);
      add('text', { text: `MENTAL\nTactica: ${r.inteligencia_tactica}/10 | Posicionamiento: ${r.posicionamiento}/10\nConcentracion: ${r.concentracion}/10 | Liderazgo: ${r.liderazgo}/10 | Equipo: ${r.trabajo_equipo}/10` }, 9);
      if (r.fortalezas) add('text', { text: `FORTALEZAS: ${r.fortalezas}` }, 7);
      if (r.debilidades) add('text', { text: `DEBILIDADES: ${r.debilidades}` }, 7);
      if (r.notes) add('text', { text: `NOTAS: ${r.notes}` }, 10);
      if (r.recomendacion) add('text', { text: `RECOMENDACION: ${r.recomendacion}${r.condicion_mercado ? ` | MERCADO: ${r.condicion_mercado}` : ''}` }, 5);
      pagesOut.push({ id: id(), blocks });
    });

    return pagesOut;
  };

  // ─── Import report data into current page ───
  const importReportData = () => {
    if (playerReports.length === 0) return;
    const id = () => crypto.randomUUID();
    const nextY = getNextY();

    // Build one big text with ALL report data
    const lines: string[] = [];
    playerReports.forEach((r, idx) => {
      if (idx > 0) lines.push('\n─────────────────────────────────');
      lines.push(`REPORTE ${idx + 1}${r.fecha_observacion ? ` — ${r.fecha_observacion}` : ''}${r.competicion ? ` (${r.competicion})` : ''}`);
      lines.push(`Rating General: ${r.overall_rating}/10`);
      lines.push('');
      lines.push(`TECNICO: Tecnica ${r.tecnica_individual}/10 | Pase ${r.pase}/10 | Primer Toque ${r.primer_toque}/10 | Control ${r.control_balon}/10 | Vision ${r.vision_juego}/10`);
      lines.push(`FISICO: Velocidad ${r.velocidad}/10 | Resistencia ${r.resistencia}/10 | Fuerza ${r.fuerza}/10 | Salto ${r.salto}/10 | Agilidad ${r.agilidad}/10`);
      lines.push(`MENTAL: Tactica ${r.inteligencia_tactica}/10 | Posicionamiento ${r.posicionamiento}/10 | Concentracion ${r.concentracion}/10 | Liderazgo ${r.liderazgo}/10 | Equipo ${r.trabajo_equipo}/10`);
      if (r.fortalezas) lines.push(`\nFORTALEZAS: ${r.fortalezas}`);
      if (r.debilidades) lines.push(`DEBILIDADES: ${r.debilidades}`);
      if (r.notes) lines.push(`\nNOTAS: ${r.notes}`);
      if (r.recomendacion) lines.push(`RECOMENDACION: ${r.recomendacion}${r.condicion_mercado ? ` | MERCADO: ${r.condicion_mercado}` : ''}`);
    });

    // Insert: one header + one radar + one text block with everything
    const newBlocks: ReportBlock[] = [
      { id: id(), type: 'header', content: { text: `Datos de ${playerReports.length} Reporte${playerReports.length > 1 ? 's' : ''}`, level: 1 }, style: { x: 3, y: nextY, w: 94, h: 7 } },
      { id: id(), type: 'stats_table', content: { reportIds: [], categories: ['tecnico', 'fisico', 'mental'] }, style: { x: 3, y: nextY + 9, w: 94, h: 40 } },
      { id: id(), type: 'text', content: { text: lines.join('\n') }, style: { x: 3, y: nextY + 51, w: 94, h: 45 } },
    ];

    setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: [...p.blocks, ...newBlocks] } : p));
  };

  // ─── Search ───
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try { setSearchResults(await playerService.searchPlayers(searchQuery)); } catch (e) { console.error(e); }
    setSearching(false);
  };

  const selectPlayer = (player: any) => {
    const pid = String(player.wyscout_id || player.id);
    setReport(prev => ({
      ...prev, player_id: pid, player_name: player.name, player_wyscout_id: player.wyscout_id || player.id,
      cover_data: { ...prev.cover_data, title: `Informe: ${player.name}` },
    }));
    setSearchResults([]); setSearchQuery('');
    loadPlayerData(pid);
  };

  // ─── Page ops ───
  const addPage = () => { setPages(prev => [...prev, createPage()]); setActivePage(pages.length); };
  const deletePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== idx));
    setActivePage(Math.max(0, activePage - 1));
  };

  // ─── Block ops ───
  const getNextY = (): number => {
    if (currentPage.blocks.length === 0) return 3;
    let maxBottom = 0;
    currentPage.blocks.forEach(b => {
      const st = b.style || DEFAULT_BLOCK_STYLE;
      maxBottom = Math.max(maxBottom, st.y + st.h);
    });
    return Math.min(maxBottom + 2, 90);
  };

  const addBlock = (type: BlockType) => {
    const nextY = getNextY();
    const sz = BLOCK_SIZES[type];
    const block = createBlock(type);
    block.style = { x: (100 - sz.w) / 2, y: nextY, w: sz.w, h: sz.h };
    if (isCoverActive) {
      setCoverBlocks(prev => [...prev, block]);
    } else {
      setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: [...p.blocks, block] } : p));
    }
    setSelectedBlock(block.id);
  };

  const addCoverBlock = (type: BlockType) => {
    const sz = BLOCK_SIZES[type];
    const block = createBlock(type);
    const cb = report.cover_data.blocks || [];
    let maxBottom = 0;
    cb.forEach(b => { const st = b.style || DEFAULT_BLOCK_STYLE; maxBottom = Math.max(maxBottom, st.y + st.h); });
    const nextY = cb.length === 0 ? 30 : Math.min(maxBottom + 2, 90);
    block.style = { x: (100 - sz.w) / 2, y: nextY, w: sz.w, h: sz.h };
    setCoverBlocks(prev => [...prev, block]);
    setActivePage(-1);
    setSelectedBlock(block.id);
  };

  const updateBlock = (blockId: string, content: any) => {
    if (isCoverActive) {
      setCoverBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b));
    } else {
      setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, content } : b) } : p));
    }
  };

  // When an image loads, resize the block to match the image's real aspect ratio
  const fitBlockToImage = (blockId: string, imgW: number, imgH: number) => {
    if (!imgW || !imgH) return;
    const ratio = imgH / imgW;
    const pageRatio = 210 / 297;
    const resizer = (blocks: ReportBlock[]) => blocks.map(b => {
      if (b.id !== blockId) return b;
      const bs = b.style || DEFAULT_BLOCK_STYLE;
      return { ...b, style: { ...bs, h: clamp(bs.w * ratio * pageRatio, 5, 90) } };
    });
    if (isCoverActive) {
      setCoverBlocks(prev => resizer(prev));
    } else {
      setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: resizer(p.blocks) } : p));
    }
  };

  const deleteBlock = (blockId: string) => {
    if (isCoverActive) {
      setCoverBlocks(prev => prev.filter(b => b.id !== blockId));
    } else {
      setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: p.blocks.filter(b => b.id !== blockId) } : p));
    }
    if (selectedBlock === blockId) setSelectedBlock(null);
  };

  const duplicateBlock = (block: ReportBlock) => {
    const bs = block.style || DEFAULT_BLOCK_STYLE;
    const newBlock: ReportBlock = { ...block, id: crypto.randomUUID(), content: { ...block.content }, style: { ...bs, x: bs.x + 2, y: Math.min(bs.y + 3, 90) } };
    if (isCoverActive) {
      setCoverBlocks(prev => [...prev, newBlock]);
    } else {
      setPages(prev => prev.map((p, i) => i === activePage ? { ...p, blocks: [...p.blocks, newBlock] } : p));
    }
    setSelectedBlock(newBlock.id);
  };

  // ─── Interaction start ───
  const startInteraction = (e: React.PointerEvent, blockId: string, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    const block = currentPage.blocks.find(b => b.id === blockId);
    if (!block) return;
    setSelectedBlock(blockId);
    setInteraction({ type, blockId, startX: e.clientX, startY: e.clientY, origStyle: block.style || DEFAULT_BLOCK_STYLE });
  };

  // ─── Save ───
  const save = async () => {
    setSaving(true);
    try {
      if (report.id) { setReport(await reportBuilderService.update(report.id, report)); }
      else { setReport(await reportBuilderService.create(report)); }
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); alert('Error al guardar'); }
    setSaving(false);
  };

  // ─── Templates ───
  const [templates, setTemplates] = useState<BuilderReport[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await reportBuilderService.list(true);
      setTemplates(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadTemplates(); }, []);

  const saveAsTemplate = async () => {
    const name = prompt('Nombre de la plantilla:');
    if (!name) return;
    try {
      // Clone current report structure but clear content
      const cleanBlock = (b: ReportBlock): ReportBlock => {
        const empty: Record<string, any> = {
          header: { text: b.content?.text || 'Titulo', level: b.content?.level || 1 },
          text: { text: '' },
          image: { url: '', caption: '' },
          video: { url: '', caption: '' },
          stats_table: { reportIds: [], categories: ['tecnico', 'fisico', 'mental'] },
          divider: { style: 'accent' },
          shape: { ...b.content },
          banner: { title: b.content?.title || 'Titulo', subtitle: '', date: '', logoUrl: '', photoUrl: '' },
        };
        return { ...b, id: crypto.randomUUID(), content: empty[b.type] || b.content };
      };

      const templatePages = (report.pages || []).map(p => ({
        id: crypto.randomUUID(),
        blocks: p.blocks.map(cleanBlock),
      }));

      const coverBlocks = (report.cover_data.blocks || []).map(cleanBlock);

      await reportBuilderService.create({
        title: name,
        is_template: true,
        template_name: name,
        cover_data: {
          ...report.cover_data,
          blocks: coverBlocks,
          title: name,
        },
        blocks: templatePages.flatMap(p => p.blocks),
        pages: templatePages,
      });
      alert('Plantilla guardada!');
      loadTemplates();
    } catch (e) { console.error(e); alert('Error al guardar plantilla'); }
  };

  const applyTemplate = (tmpl: BuilderReport) => {
    // Generate new IDs for all blocks
    const reId = (b: ReportBlock): ReportBlock => ({ ...b, id: crypto.randomUUID(), content: { ...b.content } });
    const newPages = (tmpl.pages || []).map(p => ({ id: crypto.randomUUID(), blocks: p.blocks.map(reId) }));
    const newCoverBlocks = (tmpl.cover_data?.blocks || []).map(reId);

    setReport(prev => ({
      ...prev,
      pages: newPages,
      blocks: newPages.flatMap(p => p.blocks),
      cover_data: {
        ...prev.cover_data,
        enabled: tmpl.cover_data?.enabled,
        backgroundImage: tmpl.cover_data?.backgroundImage,
        overlayOpacity: tmpl.cover_data?.overlayOpacity,
        blocks: newCoverBlocks,
      },
    }));
    setActivePage(0);
    setShowTemplates(false);
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Eliminar plantilla?')) return;
    try {
      await reportBuilderService.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) { alert('Error al eliminar'); }
  };

  // ─── PDF Export ───
  const buildRadarSvg = (): string => {
    if (playerReports.length === 0) return '';
    const avg = (key: string) => {
      const vals = playerReports.map(r => (r as any)[key]).filter((v: any) => typeof v === 'number');
      return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    };
    const metrics = [
      { label: 'Tecnica', value: avg('tecnica_individual') },
      { label: 'Pase', value: avg('pase') },
      { label: 'Vision', value: avg('vision_juego') },
      { label: 'Velocidad', value: avg('velocidad') },
      { label: 'Resistencia', value: avg('resistencia') },
      { label: 'Fuerza', value: avg('fuerza') },
      { label: 'Agilidad', value: avg('agilidad') },
      { label: 'Tactica', value: avg('inteligencia_tactica') },
      { label: 'Posicion.', value: avg('posicionamiento') },
      { label: 'Liderazgo', value: avg('liderazgo') },
    ];
    const n = metrics.length, cx = 400, cy = 360, R = 210;
    const step = (2 * Math.PI) / n;
    const xy = (i: number, r: number) => ({ x: cx + r * Math.sin(i * step), y: cy - r * Math.cos(i * step) });
    const rings = [0.25, 0.5, 0.75, 1].map(p => {
      const pts = Array.from({ length: n }, (_, i) => xy(i, R * p));
      return `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
    }).join('');
    const axes = Array.from({ length: n }, (_, i) => `<line x1="${cx}" y1="${cy}" x2="${xy(i, R).x}" y2="${xy(i, R).y}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`).join('');
    const pts = metrics.map((m, i) => xy(i, R * (m.value / 10)));
    const poly = `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="rgba(0,191,99,0.25)" stroke="#00bf63" stroke-width="3"/>`;
    const dots = pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#00bf63"/>`).join('');
    const labels = metrics.map((m, i) => {
      const p = xy(i, R + 56);
      const a = p.x < cx - 20 ? 'end' : p.x > cx + 20 ? 'start' : 'middle';
      return `<text x="${p.x}" y="${p.y + 8}" fill="#d1d5db" font-size="22" text-anchor="${a}" font-family="Segoe UI,sans-serif">${m.label} (${m.value.toFixed(1)})</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="740" viewBox="0 0 800 740">${rings}${axes}${poly}${dots}${labels}</svg>`;
  };

  // PDF_SCALE: factor for doubling base HTML size (794→1588)
  const PDF_SCALE = 2;
  const px = (n: number) => `${n * PDF_SCALE}px`;

  const textStyleToCss = (ts: any, defaults: { fontSize: string; color: string; fontWeight?: string }) => {
    const rawFs = ts?.fontSize ? ts.fontSize : parseInt(defaults.fontSize);
    const fs = `${rawFs * PDF_SCALE}px`;
    const col = ts?.color || defaults.color;
    const fw = ts?.bold === false ? 'normal' : ts?.bold ? 'bold' : (defaults.fontWeight || 'normal');
    const fi = ts?.italic ? 'italic' : 'normal';
    const ta = ts?.align || 'left';
    return `font-size:${fs};color:${col};font-weight:${fw};font-style:${fi};text-align:${ta};`;
  };

  const buildCoverHtml = (): string => {
    const c = report.cover_data;
    const overlay = (c.overlayOpacity ?? 60) / 100;
    const cb = c.blocks || [];

    // Reuse the same blockToHtml from buildPageHtml
    const blockToHtml = (block: ReportBlock): string => {
      const bs = block.style || DEFAULT_BLOCK_STYLE;
      const pos = `position:absolute;left:${bs.x}%;top:${bs.y}%;width:${bs.w}%;height:${bs.h}%;overflow:hidden;box-sizing:border-box;`;
      const inner = (() => {
        switch (block.type) {
          case 'header': {
            const defSizes: Record<string, string> = { '1': '36', '2': '26', '3': '20' };
            const hCss = textStyleToCss(block.content?.textStyle, { fontSize: defSizes[String(block.content?.level)] || '26', color: '#fff', fontWeight: 'bold' });
            return `<h2 style="${hCss}margin:0;padding:${px(6)} 0;">${block.content?.text || ''}</h2>`;
          }
          case 'text': {
            const tCss = textStyleToCss(block.content?.textStyle, { fontSize: '14', color: 'rgba(255,255,255,0.7)' });
            return `<div style="${tCss}line-height:1.6;white-space:pre-wrap;">${block.content?.text || ''}</div>`;
          }
          case 'image':
            return block.content?.url ? `<div style="width:100%;height:100%;background-image:url(${block.content.url});background-size:contain;background-position:center;background-repeat:no-repeat;border-radius:${px(8)};"></div>` : '';
          case 'shape': {
            const sc = block.content || {};
            const bg = sc.backgroundColor || '#00bf63';
            const op = (sc.opacity ?? 100) / 100;
            const br = (sc.borderRadius ?? 0) * PDF_SCALE;
            const bw = (sc.borderWidth ?? 0) * PDF_SCALE;
            const bc = sc.borderColor || 'transparent';
            const label = sc.label || '';
            return `<div style="width:100%;height:100%;background:${bg};opacity:${op};border-radius:${br}px;${bw > 0 ? `border:${bw}px solid ${bc};` : ''}box-sizing:border-box;display:flex;align-items:center;justify-content:center;">${label ? `<span style="color:#fff;font-weight:600;font-size:${px(13)};text-align:center;">${label}</span>` : ''}</div>`;
          }
          case 'divider':
            return `<hr style="border:none;border-top:${px(2)} solid rgba(0,191,99,0.25);margin:0;"/>`;
          case 'banner': {
            const bc = block.content || {};
            return `<div style="width:100%;height:100%;border-radius:${px(10)};background:linear-gradient(135deg,rgba(0,191,99,0.2),#0d0d10,rgba(59,130,246,0.1));border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:${px(20)};padding:${px(16)} ${px(24)};box-sizing:border-box;">
              ${bc.logoUrl ? `<div style="width:${px(50)};height:${px(50)};background-image:url(${bc.logoUrl});background-size:contain;background-position:center;background-repeat:no-repeat;"></div>` : ''}
              <div style="flex:1;">
                <h1 style="font-size:${px(20)};font-weight:bold;color:#fff;margin:0;">${bc.title || ''}</h1>
                ${bc.subtitle ? `<p style="font-size:${px(12)};color:#9ca3af;margin:${px(3)} 0 0;">${bc.subtitle}</p>` : ''}
                ${bc.date ? `<p style="font-size:${px(10)};color:#6b7280;margin:${px(3)} 0 0;">${bc.date}</p>` : ''}
              </div>
              ${bc.photoUrl ? `<div style="width:${px(55)};height:${px(55)};border-radius:${px(8)};background-image:url(${bc.photoUrl});background-size:cover;background-position:center;"></div>` : ''}
            </div>`;
          }
          default: return '';
        }
      })();
      return `<div style="${pos}">${inner}</div>`;
    };

    return `<div style="width:1588px;height:2246px;background:#0d0d10;position:relative;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
      ${c.backgroundImage ? `<div style="position:absolute;inset:0;background-image:url(${c.backgroundImage});background-size:${c.bgZoom ?? 100}%;background-position:${c.bgPositionX ?? 50}% ${c.bgPositionY ?? 50}%;background-repeat:no-repeat;"></div>` : ''}
      <div style="position:absolute;inset:0;background:rgba(0,0,0,${overlay});"></div>
      ${cb.map(blockToHtml).join('')}
    </div>`;
  };

  const buildPageHtml = (page: ReportPage, pageIdx: number, totalPages: number): string => {
    const blockToHtml = (block: ReportBlock): string => {
      const bs = block.style || DEFAULT_BLOCK_STYLE;
      const pos = `position:absolute;left:${bs.x}%;top:${bs.y}%;width:${bs.w}%;height:${bs.h}%;overflow:hidden;box-sizing:border-box;`;

      const inner = (() => {
        switch (block.type) {
          case 'header': {
            const defSz: Record<string, string> = { '1': '28', '2': '22', '3': '17' };
            const hStyle = textStyleToCss(block.content?.textStyle, { fontSize: defSz[String(block.content?.level)] || '22', color: '#fff', fontWeight: 'bold' });
            return `<h2 style="${hStyle}margin:0;padding:${px(6)} 0;border-bottom:${px(3)} solid rgba(0,191,99,0.4);">${block.content?.text || ''}</h2>`;
          }
          case 'text': {
            const tStyle = textStyleToCss(block.content?.textStyle, { fontSize: '12', color: '#d1d5db' });
            return `<div style="${tStyle}line-height:1.6;white-space:pre-wrap;">${block.content?.text || ''}</div>`;
          }
          case 'image':
            return block.content?.url
              ? `<div style="width:100%;height:100%;background-image:url(${block.content.url});background-size:contain;background-position:center;background-repeat:no-repeat;border-radius:${px(8)};"></div>`
              : '';
          case 'video':
            return block.content?.url ? `<div style="padding:${px(8)} ${px(12)};background:rgba(255,255,255,0.05);border-radius:${px(6)};"><p style="color:#9ca3af;font-size:${px(12)};margin:0;">Video: ${block.content.url}</p></div>` : '';
          case 'stats_table': {
            const svg = buildRadarSvg();
            if (!svg) return `<p style="color:#6b7280;font-size:${px(12)};margin:0;">Sin datos</p>`;
            return `<p style="color:#00bf63;font-size:${px(13)};font-weight:600;margin:0 0 ${px(6)};text-align:center;">Promedios de ${playerReports.length} reportes</p><div style="display:flex;justify-content:center;">${svg}</div>`;
          }
          case 'divider':
            return `<hr style="border:none;border-top:${px(2)} solid rgba(0,191,99,0.25);margin:0;"/>`;
          case 'shape': {
            const sc = block.content || {};
            const bg = sc.backgroundColor || '#00bf63';
            const op = (sc.opacity ?? 100) / 100;
            const br = (sc.borderRadius ?? 0) * PDF_SCALE;
            const bw = (sc.borderWidth ?? 0) * PDF_SCALE;
            const bc = sc.borderColor || 'transparent';
            const label = sc.label || '';
            return `<div style="width:100%;height:100%;background:${bg};opacity:${op};border-radius:${br}px;${bw > 0 ? `border:${bw}px solid ${bc};` : ''}box-sizing:border-box;display:flex;align-items:center;justify-content:center;">${label ? `<span style="color:#fff;font-weight:600;font-size:${px(13)};text-align:center;">${label}</span>` : ''}</div>`;
          }
          case 'banner': {
            const bnr = block.content || {};
            return `<div style="width:100%;height:100%;border-radius:${px(10)};background:linear-gradient(135deg,rgba(0,191,99,0.2),#0d0d10,rgba(59,130,246,0.1));border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:${px(20)};padding:${px(16)} ${px(24)};box-sizing:border-box;">
              ${bnr.logoUrl ? `<div style="width:${px(50)};height:${px(50)};background-image:url(${bnr.logoUrl});background-size:contain;background-position:center;background-repeat:no-repeat;"></div>` : ''}
              <div style="flex:1;">
                <h1 style="font-size:${px(20)};font-weight:bold;color:#fff;margin:0;">${bnr.title || ''}</h1>
                ${bnr.subtitle ? `<p style="font-size:${px(12)};color:#9ca3af;margin:${px(3)} 0 0;">${bnr.subtitle}</p>` : ''}
                ${bnr.date ? `<p style="font-size:${px(10)};color:#6b7280;margin:${px(3)} 0 0;">${bnr.date}</p>` : ''}
              </div>
              ${bnr.photoUrl ? `<div style="width:${px(55)};height:${px(55)};border-radius:${px(8)};background-image:url(${bnr.photoUrl});background-size:cover;background-position:center;"></div>` : ''}
            </div>`;
          }
          default: return '';
        }
      })();

      return `<div style="${pos}">${inner}</div>`;
    };

    return `<div style="width:1588px;height:2246px;background:#0d0d10;font-family:'Segoe UI',Arial,sans-serif;color:#fff;position:relative;box-sizing:border-box;">
      ${page.blocks.map(blockToHtml).join('')}
      <div style="position:absolute;bottom:${px(12)};right:${px(24)};font-size:${px(10)};color:#4b5563;">Pagina ${pageIdx + 1} de ${totalPages}</div>
    </div>`;
  };

  const exportPdf = async () => {
    setShowPreview(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const hasCover = report.cover_data.enabled;
      const totalPages = pages.length + (hasCover ? 1 : 0);
      let pageNum = 0;

      // Helper: preload all images (both <img> tags and background-image divs)
      const preloadImages = async (el: HTMLElement) => {
        // Preload <img> tags
        const imgs = el.querySelectorAll('img');
        const imgPromises = Array.from(imgs).map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; }));
        // Preload background-image URLs
        const allEls = el.querySelectorAll('*');
        const bgUrls: string[] = [];
        allEls.forEach(node => {
          const bg = (node as HTMLElement).style?.backgroundImage;
          if (bg) {
            const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (match?.[1]) bgUrls.push(match[1]);
          }
        });
        const bgPromises = bgUrls.map(url => new Promise<void>(res => {
          const img = new Image();
          img.onload = () => res();
          img.onerror = () => res();
          img.src = url;
        }));
        await Promise.allSettled([...imgPromises, ...bgPromises]);
        await new Promise(r => setTimeout(r, 300));
      };

      // Render cover page first if enabled
      if (hasCover) {
        container.innerHTML = buildCoverHtml();
        const el = container.firstElementChild as HTMLElement;
        await preloadImages(el);
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0d0d10', useCORS: true, allowTaint: true });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pageW, pageH);
        pageNum = 1;
      }

      for (let i = 0; i < pages.length; i++) {
        if (pageNum > 0) pdf.addPage();
        container.innerHTML = buildPageHtml(pages[i], i, totalPages);
        const el = container.firstElementChild as HTMLElement;
        await preloadImages(el);
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0d0d10', useCORS: true, allowTaint: true });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pageW, pageH);
        pageNum++;
      }

      document.body.removeChild(container);
      pdf.save(`Informe_${report.player_name || 'Sin_jugador'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
      alert('Error al exportar PDF');
    }
    setShowPreview(false);
  };

  // ─── Render block content ───
  const renderBlock = (block: ReportBlock) => {
    switch (block.type) {
      case 'header': return <HeaderBlock content={block.content} onChange={c => updateBlock(block.id, c)} readOnly={false} />;
      case 'text': return <TextBlock content={block.content} onChange={c => updateBlock(block.id, c)} readOnly={false} />;
      case 'image': return <ImageBlock content={block.content} onChange={c => updateBlock(block.id, c)} onImageLoad={(w, h) => fitBlockToImage(block.id, w, h)} readOnly={false} />;
      case 'video': return <VideoBlock content={block.content} onChange={c => updateBlock(block.id, c)} readOnly={false} />;
      case 'stats_table': return <StatsTableBlock reports={playerReports} readOnly={false} />;
      case 'divider': return <div style={{ borderTop: '2px solid rgba(0,191,99,0.25)', width: '100%', marginTop: '40%' }} />;
      case 'shape': return <ShapeBlock content={block.content} onChange={c => updateBlock(block.id, c)} readOnly={false} />;
      case 'banner': return <BannerBlock content={block.content} onChange={c => updateBlock(block.id, c)} readOnly={false} />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in" style={{ userSelect: interaction ? 'none' : 'auto' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 card-glass rounded-xl sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-3 py-2 bg-white/8 text-text-secondary rounded-lg text-sm cursor-pointer border-none hover:bg-white/12 transition-colors">← Volver</button>
          <input type="text" value={report.title} onChange={e => setReport(prev => ({ ...prev, title: e.target.value }))} className="bg-transparent border-none outline-none text-lg font-bold text-text" />
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-accent text-xs">Guardado</span>}
          <button onClick={() => setShowTemplates(!showTemplates)} className="px-3 py-2 bg-white/8 text-text-secondary rounded-lg text-xs font-medium cursor-pointer border-none hover:bg-white/12 transition-colors">
            Plantillas
          </button>
          <button onClick={saveAsTemplate} className="px-3 py-2 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-medium cursor-pointer border-none hover:bg-purple-500/25 transition-colors">
            Guardar formato
          </button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg text-sm font-semibold cursor-pointer border-none transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={exportPdf} className="px-4 py-2 bg-info/15 text-info rounded-lg text-sm font-medium cursor-pointer border-none hover:bg-info/25 transition-colors">
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="mb-4 p-4 card-elevated rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text">Mis Plantillas</h4>
            <button onClick={() => setShowTemplates(false)} className="text-text-muted hover:text-text text-xs cursor-pointer border-none bg-transparent">Cerrar</button>
          </div>
          {templates.length === 0 ? (
            <p className="text-text-muted text-xs py-4 text-center">No hay plantillas guardadas. Arma un informe y usa "Guardar formato" para crear una.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="bg-white/5 border border-border-strong rounded-lg p-3 hover:border-accent/30 transition-all group">
                  <div className="text-xs font-medium text-text truncate mb-1">{tmpl.template_name || tmpl.title}</div>
                  <div className="text-[10px] text-text-muted mb-2">
                    {tmpl.pages?.length || 1} pag. - {tmpl.blocks?.length || 0} bloques
                    {tmpl.cover_data?.enabled && ' + portada'}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => applyTemplate(tmpl)}
                      className="flex-1 py-1.5 bg-accent/15 text-accent text-[10px] rounded cursor-pointer border-none hover:bg-accent/25 font-medium"
                    >
                      Usar
                    </button>
                    <button
                      onClick={() => tmpl.id && deleteTemplate(tmpl.id)}
                      className="px-2 py-1.5 bg-danger/10 text-danger/60 text-[10px] rounded cursor-pointer border-none hover:bg-danger/20 hover:text-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {report.cover_data.enabled && (
          <button
            onClick={() => { setActivePage(-1); setSelectedBlock(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none transition-all ${
              activePage === -1 ? 'bg-accent text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary'
            }`}
          >Portada</button>
        )}
        {pages.map((page, idx) => (
          <div key={page.id} className="flex items-center gap-0.5">
            <button
              onClick={() => { setActivePage(idx); setSelectedBlock(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none transition-all ${
                idx === activePage ? 'bg-accent text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary'
              }`}
            >Pag {idx + 1}</button>
            {pages.length > 1 && (
              <button onClick={() => deletePage(idx)} className="p-1 text-text-muted hover:text-danger text-[10px] cursor-pointer border-none bg-transparent">✕</button>
            )}
          </div>
        ))}
        <button onClick={addPage} className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border border-dashed border-border-strong text-text-muted hover:text-accent hover:border-accent/30 bg-transparent transition-colors">
          + Pagina
        </button>
      </div>

      <div className="flex gap-5">
        {/* ─── Sidebar ─── */}
        <div className="w-[220px] shrink-0 space-y-3">
          {/* Player */}
          <div className="card-elevated rounded-xl p-3">
            <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">Jugador</h4>
            {report.player_name ? (
              <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                {playerPhoto && <img src={playerPhoto} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-text truncate">{report.player_name}</div>
                  <div className="text-[10px] text-text-muted">{playerReports.length} reportes</div>
                </div>
                <button onClick={() => { setReport(prev => ({ ...prev, player_id: undefined, player_name: undefined, player_wyscout_id: undefined })); setPlayerReports([]); setPlayerPhoto(''); }} className="text-[10px] text-text-muted hover:text-danger cursor-pointer border-none bg-transparent">✕</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Buscar..." className="flex-1 p-1.5 bg-surface border border-border-strong rounded-md text-[11px] text-text placeholder:text-text-muted outline-none focus:border-accent/50" />
                  <button onClick={handleSearch} disabled={searching} className="px-2 py-1 bg-accent text-white rounded-md text-[10px] cursor-pointer border-none">{searching ? '...' : 'Ir'}</button>
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-[160px] overflow-auto rounded-lg border border-border-strong">
                    {searchResults.map((p: any) => (
                      <button key={p.id} onClick={() => selectPlayer(p)} className="w-full text-left p-2 hover:bg-white/5 border-none bg-transparent cursor-pointer">
                        <div className="text-[11px] font-medium text-text">{p.name}</div>
                        <div className="text-[9px] text-text-muted">{p.position} - {p.team}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blocks palette */}
          <div className="card-elevated rounded-xl p-3">
            <BlockPalette onAdd={addBlock} />
          </div>

          {/* Import report data button */}
          {report.player_name && playerReports.length > 0 && (
            <div className="card-elevated rounded-xl p-3">
              <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">Datos de Reportes</h4>
              <p className="text-[10px] text-text-muted mb-2">{playerReports.length} reporte{playerReports.length > 1 ? 's' : ''} disponible{playerReports.length > 1 ? 's' : ''}</p>
              <button
                onClick={importReportData}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-accent/15 hover:bg-accent/25 border border-accent/30 hover:border-accent/50 transition-all cursor-pointer text-accent text-xs font-semibold"
              >
                <span>📋</span> Traer Info de Reportes
              </button>
              <p className="text-[9px] text-text-muted mt-1.5">Inserta ratings, notas y radar en la pagina actual. Podes editar y mover todo.</p>
            </div>
          )}

          {/* Cover config */}
          <CoverEditor
            cover={report.cover_data}
            onChange={cover_data => {
              // Auto-generate initial blocks when cover is first enabled
              if (cover_data.enabled && !report.cover_data.enabled && (!cover_data.blocks || cover_data.blocks.length === 0)) {
                const id = () => crypto.randomUUID();
                cover_data = {
                  ...cover_data,
                  blocks: [
                    { id: id(), type: 'header', content: { text: report.cover_data.title || 'Informe', level: 1 }, style: { x: 10, y: 35, w: 80, h: 10 } },
                    { id: id(), type: 'text', content: { text: report.cover_data.date || new Date().toISOString().split('T')[0] }, style: { x: 25, y: 50, w: 50, h: 5 } },
                  ],
                };
                setActivePage(-1);
              }
              setReport(prev => ({ ...prev, cover_data }));
            }}
            onAddCoverBlock={addCoverBlock}
            playerPhoto={playerPhoto}
          />

          {/* Shape editor (when a shape block is selected) */}
          {(() => {
            if (!selectedBlock || activePage < 0) return null;
            const block = currentPage.blocks.find(b => b.id === selectedBlock);
            if (!block || block.type !== 'shape') return null;
            const sc = {
              backgroundColor: block.content.backgroundColor || '#00bf63',
              opacity: block.content.opacity ?? 100,
              borderRadius: block.content.borderRadius ?? 0,
              borderColor: block.content.borderColor || 'transparent',
              borderWidth: block.content.borderWidth ?? 0,
              label: block.content.label || '',
            };
            const update = (partial: Partial<typeof sc>) => updateBlock(block.id, { ...sc, ...partial });
            const PRESET_COLORS = ['#00bf63','#3b82f6','#ef4444','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#ffffff','#6b7280','#0d0d10'];
            return (
              <div className="card-elevated rounded-xl p-3 space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-text-muted font-medium">Editar Forma</h4>
                {/* Color */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1.5">Color</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => update({ backgroundColor: color })}
                        className="w-6 h-6 rounded cursor-pointer border-none transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          outline: sc.backgroundColor === color ? '2px solid #00bf63' : '1px solid rgba(255,255,255,0.2)',
                          outlineOffset: '1px',
                        }}
                      />
                    ))}
                  </div>
                  <input type="color" value={sc.backgroundColor} onChange={e => update({ backgroundColor: e.target.value })} className="w-full h-7 rounded cursor-pointer border border-white/10" />
                </div>
                {/* Opacity */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Opacidad: {sc.opacity}%</label>
                  <input type="range" min="5" max="100" value={sc.opacity} onChange={e => update({ opacity: parseInt(e.target.value) })} className="w-full h-1.5 accent-[#00bf63]" />
                </div>
                {/* Border radius */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Redondeo: {sc.borderRadius}px</label>
                  <input type="range" min="0" max="50" value={sc.borderRadius} onChange={e => update({ borderRadius: parseInt(e.target.value) })} className="w-full h-1.5 accent-[#00bf63]" />
                </div>
                {/* Border */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Borde: {sc.borderWidth}px</label>
                  <div className="flex gap-2 items-center">
                    <input type="range" min="0" max="8" value={sc.borderWidth} onChange={e => update({ borderWidth: parseInt(e.target.value) })} className="flex-1 h-1.5 accent-[#00bf63]" />
                    {sc.borderWidth > 0 && (
                      <input type="color" value={sc.borderColor === 'transparent' ? '#ffffff' : sc.borderColor} onChange={e => update({ borderColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer border border-white/10" />
                    )}
                  </div>
                </div>
                {/* Label */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-medium block mb-1">Texto (opcional)</label>
                  <input type="text" value={sc.label} onChange={e => update({ label: e.target.value })} placeholder="Texto dentro..." className="w-full p-1.5 bg-white/5 border border-white/10 rounded text-[11px] text-white placeholder:text-white/30 outline-none focus:border-[#00bf63]/50" />
                </div>
              </div>
            );
          })()}

          {/* Info */}
          <div className="card-elevated rounded-xl p-3">
            <p className="text-[11px] text-text-secondary">{activePage >= 0 ? `${currentPage.blocks.length} objetos en pag. ${activePage + 1}` : 'Portada seleccionada'}</p>
            <p className="text-[9px] text-text-muted mt-1">Arrastra la barra superior para mover.</p>
            <p className="text-[9px] text-text-muted">Arrastra la esquina verde para redimensionar.</p>
          </div>
        </div>

        {/* ─── Canvas (A4 page) ─── */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className="relative bg-[#0d0d10] rounded-xl border-2 border-border-strong overflow-hidden"
            style={{ aspectRatio: '210/297' }}
            onClick={() => setSelectedBlock(null)}
          >
            {/* ─── Cover background (only on cover page) ─── */}
            {isCoverActive && (
              <>
                {report.cover_data.backgroundImage && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${report.cover_data.backgroundImage})`,
                      backgroundSize: `${report.cover_data.bgZoom ?? 100}%`,
                      backgroundPosition: `${report.cover_data.bgPositionX ?? 50}% ${report.cover_data.bgPositionY ?? 50}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${(report.cover_data.overlayOpacity ?? 60) / 100})` }} />
                {coverBlocks.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <p className="text-white/40 text-sm">Agrega elementos desde el panel izquierdo</p>
                  </div>
                )}
              </>
            )}

            {/* ─── Blocks on canvas ─── */}
            {currentPage.blocks.map(block => {
              const bs = block.style || DEFAULT_BLOCK_STYLE;
              const isSel = selectedBlock === block.id;

              return (
                <div
                  key={block.id}
                  className={`absolute group ${isSel ? 'z-20' : 'z-10'}`}
                  style={{ left: `${bs.x}%`, top: `${bs.y}%`, width: `${bs.w}%`, height: `${bs.h}%` }}
                  onClick={e => { e.stopPropagation(); setSelectedBlock(block.id); }}
                >
                  {/* Border */}
                  <div className={`absolute inset-0 rounded-lg pointer-events-none transition-all ${
                    isSel ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : 'ring-1 ring-transparent group-hover:ring-white/20'
                  }`} />

                  {/* Move handle (top bar) */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-5 cursor-move z-10 flex items-center justify-between px-2 rounded-t-lg transition-opacity ${
                      isSel ? 'bg-accent/30 opacity-100' : 'opacity-0 group-hover:opacity-70 bg-black/40'
                    }`}
                    onPointerDown={e => startInteraction(e, block.id, 'move')}
                  >
                    <div className="flex items-center gap-1">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-white/60">
                        <circle cx="2" cy="2" r="1" /><circle cx="6" cy="2" r="1" />
                        <circle cx="2" cy="6" r="1" /><circle cx="6" cy="6" r="1" />
                      </svg>
                      <span className="text-[8px] uppercase tracking-wider text-white/70 font-medium">{BLOCK_LABELS[block.type]}</span>
                    </div>
                    {isSel && (
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(block); }} className="text-[9px] text-white/60 hover:text-white border-none bg-transparent cursor-pointer" title="Duplicar">⧉</button>
                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="text-[9px] text-white/60 hover:text-red-400 border-none bg-transparent cursor-pointer" title="Eliminar">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`absolute inset-0 pt-5 rounded-lg ${isSel ? 'overflow-auto' : 'overflow-hidden'}`}>
                    <div className="w-full h-full px-1">
                      {renderBlock(block)}
                    </div>
                  </div>

                  {/* Resize handles (visible when selected) */}
                  {isSel && (
                    <>
                      {/* Bottom-right */}
                      <div
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize z-30 bg-accent rounded-tl-md"
                        onPointerDown={e => startInteraction(e, block.id, 'resize')}
                      />
                      {/* Bottom-left */}
                      <div className="absolute bottom-0 left-0 w-2 h-2 bg-accent/60 rounded-tr-md pointer-events-none" />
                      {/* Top-right */}
                      <div className="absolute top-0 right-0 w-2 h-2 bg-accent/60 rounded-bl-md pointer-events-none" />
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {!isCoverActive && currentPage.blocks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-text-muted text-base mb-1">Pagina vacia</p>
                <p className="text-text-muted text-xs">Agrega objetos desde el panel izquierdo</p>
              </div>
            )}

            {/* Page number */}
            <div className="absolute bottom-2 right-3 text-[9px] text-text-muted/50 pointer-events-none">
              {activePage + 1} / {pages.length}
            </div>
          </div>
        </div>
      </div>

      {/* PDF overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-white text-lg">Generando PDF...</div>
        </div>
      )}
    </div>
  );
};

export default ReportEditor;
