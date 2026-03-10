import React from 'react';
import { Player, ScoutReportCreate } from '../services/api';

interface ReportFormModalProps {
  showReportForm: boolean;
  setShowReportForm: (show: boolean) => void;
  selectedPlayer: Player | null;
  reportForm: ScoutReportCreate;
  setReportForm: (form: ScoutReportCreate) => void;
  formSection: 'general' | 'tecnico' | 'fisico' | 'mental' | 'seguimiento';
  setFormSection: (section: 'general' | 'tecnico' | 'fisico' | 'mental' | 'seguimiento') => void;
  handleSubmitReport: () => void;
  playerMatches: any[];
  loadingMatches: boolean;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({
  showReportForm,
  setShowReportForm,
  selectedPlayer,
  reportForm,
  setReportForm,
  formSection,
  setFormSection,
  handleSubmitReport,
  playerMatches,
  loadingMatches,
}) => {
  if (!showReportForm || !selectedPlayer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-card border border-border-strong rounded-lg w-[90%] max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-elevated px-6 py-4 border-b border-border-strong">
          <h2 className="text-base font-medium text-text m-0">
            Reporte de Scouting Profesional
          </h2>
          <p className="mt-1 mb-0 text-[13px] text-text-muted">
            Jugador: {selectedPlayer.name} | {selectedPlayer.team}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border-b border-border">
          {[
            { id: 'general', label: 'General' },
            { id: 'tecnico', label: 'Tecnico' },
            { id: 'fisico', label: 'Fisico' },
            { id: 'mental', label: 'Mental/Tactico' },
            { id: 'seguimiento', label: 'Seguimiento' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFormSection(tab.id as any)}
              className={`px-5 py-3 border-none text-sm transition-all cursor-pointer ${
                formSection === tab.id
                  ? 'text-accent border-b-2 border-b-accent bg-transparent font-medium'
                  : 'text-text-muted hover:text-text-secondary bg-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* General Section */}
          {formSection === 'general' && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Fecha de Observacion
                  </label>
                  <input
                    type="date"
                    value={reportForm.fecha_observacion}
                    onChange={(e) => setReportForm({ ...reportForm, fecha_observacion: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Tipo de Visionado
                  </label>
                  <select
                    value={reportForm.tipo_visionado}
                    onChange={(e) => setReportForm({ ...reportForm, tipo_visionado: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm cursor-pointer focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Estadio">Estadio</option>
                    <option value="TV">TV</option>
                  </select>
                </div>

                {/* Selector de Partido */}
                <div className="col-span-2">
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Seleccionar Partido Jugado
                  </label>
                  {loadingMatches ? (
                    <div className="py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-center">
                      Cargando partidos...
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        const selectedMatch = playerMatches.find(m => m.match_id === parseInt(e.target.value));
                        if (selectedMatch) {
                          setReportForm({
                            ...reportForm,
                            competicion: selectedMatch.competition,
                            rival: selectedMatch.player_team === 'home' ? selectedMatch.away_team : selectedMatch.home_team,
                            resultado: selectedMatch.result,
                            fecha_observacion: selectedMatch.date.split(' ')[0],
                            minutos_observados: selectedMatch.minutes_played
                          });
                        }
                      }}
                      className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm cursor-pointer focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                    >
                      <option value="">Seleccionar partido o ingresar manualmente...</option>
                      {playerMatches.map(match => (
                        <option key={match.match_id} value={match.match_id}>
                          {match.date.split(' ')[0]} | {match.competition} | {match.description} | {match.minutes_played} min
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Competicion
                  </label>
                  <input
                    type="text"
                    placeholder="Se completa al seleccionar partido"
                    value={reportForm.competicion}
                    onChange={(e) => setReportForm({ ...reportForm, competicion: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Rival
                  </label>
                  <input
                    type="text"
                    placeholder="Se completa al seleccionar partido"
                    value={reportForm.rival}
                    onChange={(e) => setReportForm({ ...reportForm, rival: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Resultado
                  </label>
                  <input
                    type="text"
                    placeholder="Se completa al seleccionar partido"
                    value={reportForm.resultado}
                    onChange={(e) => setReportForm({ ...reportForm, resultado: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Posicion Jugada
                  </label>
                  <select
                    value={reportForm.position_played}
                    onChange={(e) => setReportForm({ ...reportForm, position_played: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm cursor-pointer focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  >
                    <option value="">Seleccionar...</option>
                    <optgroup label="Arqueros">
                      <option value="Arquero - Clasico">Arquero - Clasico</option>
                      <option value="Arquero - De juego">Arquero - De juego</option>
                    </optgroup>
                    <optgroup label="Laterales Derechos">
                      <option value="Lateral Derecho - Equilibrado">Lateral Derecho - Equilibrado</option>
                      <option value="Lateral Derecho - Ofensivo">Lateral Derecho - Ofensivo</option>
                      <option value="Lateral Derecho - Defensivo">Lateral Derecho - Defensivo</option>
                    </optgroup>
                    <optgroup label="Laterales Izquierdos">
                      <option value="Lateral Izquierdo - Equilibrado">Lateral Izquierdo - Equilibrado</option>
                      <option value="Lateral Izquierdo - Ofensivo">Lateral Izquierdo - Ofensivo</option>
                      <option value="Lateral Izquierdo - Defensivo">Lateral Izquierdo - Defensivo</option>
                    </optgroup>
                    <optgroup label="Centrales Derechos">
                      <option value="Central Derecho - Equilibrado">Central Derecho - Equilibrado</option>
                      <option value="Central Derecho - Duelista">Central Derecho - Duelista</option>
                      <option value="Central Derecho - Asociativo">Central Derecho - Asociativo</option>
                    </optgroup>
                    <optgroup label="Centrales Izquierdos">
                      <option value="Central Izquierdo - Equilibrado">Central Izquierdo - Equilibrado</option>
                      <option value="Central Izquierdo - Duelista">Central Izquierdo - Duelista</option>
                      <option value="Central Izquierdo - Asociativo">Central Izquierdo - Asociativo</option>
                    </optgroup>
                    <optgroup label="Volantes Centrales">
                      <option value="Volante Central - De construccion">Volante Central - De construccion</option>
                      <option value="Volante Central - Defensivo">Volante Central - Defensivo</option>
                    </optgroup>
                    <optgroup label="Volantes Internos">
                      <option value="Volante Interno - Box to box">Volante Interno - Box to box</option>
                      <option value="Volante Interno - Ofensivo">Volante Interno - Ofensivo</option>
                    </optgroup>
                    <optgroup label="Volantes por Afuera">
                      <option value="Volante por Afuera - Carrilero">Volante por Afuera - Carrilero</option>
                      <option value="Volante por Afuera - Ofensivo">Volante por Afuera - Ofensivo</option>
                    </optgroup>
                    <optgroup label="Extremos Derechos">
                      <option value="Extremo Derecho - Finalizador">Extremo Derecho - Finalizador</option>
                      <option value="Extremo Derecho - Asociativo">Extremo Derecho - Asociativo</option>
                      <option value="Extremo Derecho - Desequilibrante">Extremo Derecho - Desequilibrante</option>
                    </optgroup>
                    <optgroup label="Extremos Izquierdos">
                      <option value="Extremo Izquierdo - Finalizador">Extremo Izquierdo - Finalizador</option>
                      <option value="Extremo Izquierdo - Asociativo">Extremo Izquierdo - Asociativo</option>
                      <option value="Extremo Izquierdo - Desequilibrante">Extremo Izquierdo - Desequilibrante</option>
                    </optgroup>
                    <optgroup label="Delanteros">
                      <option value="Delantero - De area">Delantero - De area</option>
                      <option value="Delantero - Mediapunta">Delantero - Mediapunta</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Minutos Observados
                  </label>
                  <input
                    type="number"
                    value={reportForm.minutos_observados}
                    onChange={(e) => setReportForm({ ...reportForm, minutos_observados: parseInt(e.target.value) })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] text-text mb-1.5">
                  Rating General: {reportForm.overall_rating}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={reportForm.overall_rating}
                  onChange={(e) => setReportForm({ ...reportForm, overall_rating: parseInt(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                  Notas Generales
                </label>
                <textarea
                  placeholder="Observaciones generales sobre el rendimiento del jugador..."
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  rows={4}
                  className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted resize-y"
                />
              </div>
            </div>
          )}

          {/* Tecnico Section */}
          {formSection === 'tecnico' && (
            <div className="grid gap-6">
              <h3 className="text-sm font-medium text-text tracking-tight">
                Aspectos Tecnicos
              </h3>

              {[
                { key: 'tecnica_individual', label: 'Tecnica Individual' },
                { key: 'pase', label: 'Pase' },
                { key: 'primer_toque', label: 'Primer Toque' },
                { key: 'control_balon', label: 'Control del Balon' },
                { key: 'vision_juego', label: 'Vision de Juego' }
              ].map(skill => (
                <div key={skill.key}>
                  <label className="block text-[13px] text-text mb-1.5">
                    {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                    onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Fisico Section */}
          {formSection === 'fisico' && (
            <div className="grid gap-6">
              <h3 className="text-sm font-medium text-text tracking-tight">
                Aspectos Fisicos
              </h3>

              {[
                { key: 'velocidad', label: 'Velocidad' },
                { key: 'resistencia', label: 'Resistencia' },
                { key: 'fuerza', label: 'Fuerza' },
                { key: 'salto', label: 'Salto' },
                { key: 'agilidad', label: 'Agilidad' }
              ].map(skill => (
                <div key={skill.key}>
                  <label className="block text-[13px] text-text mb-1.5">
                    {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                    onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Mental Section */}
          {formSection === 'mental' && (
            <div className="grid gap-6">
              <h3 className="text-sm font-medium text-text tracking-tight">
                Aspectos Mentales/Tacticos
              </h3>

              {[
                { key: 'inteligencia_tactica', label: 'Inteligencia Tactica' },
                { key: 'posicionamiento', label: 'Posicionamiento' },
                { key: 'concentracion', label: 'Concentracion' },
                { key: 'liderazgo', label: 'Liderazgo' },
                { key: 'trabajo_equipo', label: 'Trabajo en Equipo' }
              ].map(skill => (
                <div key={skill.key}>
                  <label className="block text-[13px] text-text mb-1.5">
                    {skill.label}: {reportForm[skill.key as keyof ScoutReportCreate]}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reportForm[skill.key as keyof ScoutReportCreate] as number}
                    onChange={(e) => setReportForm({ ...reportForm, [skill.key]: parseInt(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Fortalezas
                  </label>
                  <textarea
                    placeholder="Principales fortalezas del jugador..."
                    value={reportForm.fortalezas}
                    onChange={(e) => setReportForm({ ...reportForm, fortalezas: e.target.value })}
                    rows={3}
                    className="w-full py-2.5 px-3 border border-accent/15 bg-accent/5 text-text rounded-md text-sm resize-y focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Debilidades
                  </label>
                  <textarea
                    placeholder="Areas de mejora..."
                    value={reportForm.debilidades}
                    onChange={(e) => setReportForm({ ...reportForm, debilidades: e.target.value })}
                    rows={3}
                    className="w-full py-2.5 px-3 border border-red-500/15 bg-red-500/5 text-text rounded-md text-sm resize-y focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Seguimiento Section */}
          {formSection === 'seguimiento' && (
            <div className="grid gap-6">
              <h3 className="text-sm font-medium text-text tracking-tight">
                Seguimiento y Mercado
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Recomendacion
                  </label>
                  <select
                    value={reportForm.recomendacion}
                    onChange={(e) => setReportForm({ ...reportForm, recomendacion: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm cursor-pointer focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Comprar">Comprar</option>
                    <option value="Seguir">Seguir Observando</option>
                    <option value="Descartar">Descartar</option>
                    <option value="Prestamo">Prestamo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Condicion de Mercado
                  </label>
                  <select
                    value={reportForm.condicion_mercado}
                    onChange={(e) => setReportForm({ ...reportForm, condicion_mercado: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm cursor-pointer focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Libre">Agente Libre</option>
                    <option value="Ultimo año">Ultimo Ano de Contrato</option>
                    <option value="Contrato largo">Contrato Largo</option>
                    <option value="Clausula">Con Clausula de Rescision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Precio Estimado (EUR M)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="ej: 15.5"
                    value={reportForm.precio_estimado}
                    onChange={(e) => setReportForm({ ...reportForm, precio_estimado: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                    Agente/Representante
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del agente..."
                    value={reportForm.agente}
                    onChange={(e) => setReportForm({ ...reportForm, agente: e.target.value })}
                    className="w-full py-2.5 px-3 border border-border-strong bg-elevated text-text rounded-md text-sm focus:border-accent/50 focus:outline-none placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Promesa', 'Listo para primer equipo', 'Proyecto', 'Titular inmediato', 'Suplente de calidad', 'Para revender'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const tags = reportForm.tags || [];
                        if (tags.includes(tag)) {
                          setReportForm({ ...reportForm, tags: tags.filter(t => t !== tag) });
                        } else {
                          setReportForm({ ...reportForm, tags: [...tags, tag] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
                        (reportForm.tags || []).includes(tag)
                          ? 'bg-accent text-white border border-accent'
                          : 'bg-elevated text-text-muted border border-border'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-elevated flex justify-between items-center">
          <div className="text-[11px] text-text-muted">
            {formSection === 'general' && 'Complete la informacion general del partido'}
            {formSection === 'tecnico' && 'Evalue las habilidades tecnicas del jugador'}
            {formSection === 'fisico' && 'Evalue las capacidades fisicas del jugador'}
            {formSection === 'mental' && 'Evalue aspectos mentales y tacticos'}
            {formSection === 'seguimiento' && 'Complete la informacion de seguimiento y mercado'}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowReportForm(false)}
              className="px-5 py-2.5 bg-transparent border border-border-strong text-text-secondary hover:text-text rounded-md text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitReport}
              className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white border-none rounded-md text-sm font-medium cursor-pointer"
            >
              Guardar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFormModal;
