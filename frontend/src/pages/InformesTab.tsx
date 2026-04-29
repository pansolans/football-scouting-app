import React, { useState, useEffect } from 'react';
import ReportList from '../components/ReportBuilder/ReportList';
import ReportEditor from '../components/ReportBuilder/ReportEditor';
import { API_URL } from '../config';

interface Props {
  preselectedPlayer?: { playerId: string; playerName: string } | null;
  onClearPreselected?: () => void;
  pendingPlayers?: { name: string; id: string; count: number }[];
  editingInformeId?: string | null;
  onClearEditingId?: () => void;
  marketRequestedReports?: any[];
  onRefreshMarketRequests?: () => void;
  currentUserId?: string;
  currentUserRole?: string;
}

const InformesTab: React.FC<Props> = ({
  preselectedPlayer,
  onClearPreselected,
  pendingPlayers = [],
  editingInformeId,
  onClearEditingId,
  marketRequestedReports = [],
  onRefreshMarketRequests,
  currentUserId,
  currentUserRole,
}) => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [newPlayerData, setNewPlayerData] = useState<{ playerId: string; playerName: string } | undefined>();
  const [linkedMarketPlayerId, setLinkedMarketPlayerId] = useState<string | undefined>();

  // When a preselected player arrives, open editor for new informe
  useEffect(() => {
    if (preselectedPlayer) {
      setEditingId(undefined);
      setNewPlayerData(preselectedPlayer);
      setLinkedMarketPlayerId(undefined);
      setView('editor');
      onClearPreselected?.();
    }
  }, [preselectedPlayer]);

  // When opening an existing informe by id (e.g. from "Ver informe" en mercado)
  useEffect(() => {
    if (editingInformeId) {
      setEditingId(editingInformeId);
      setNewPlayerData(undefined);
      setLinkedMarketPlayerId(undefined);
      setView('editor');
      onClearEditingId?.();
    }
  }, [editingInformeId]);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setNewPlayerData(undefined);
    setLinkedMarketPlayerId(undefined);
    setView('editor');
  };

  const handleNew = () => {
    setEditingId(undefined);
    setNewPlayerData(undefined);
    setLinkedMarketPlayerId(undefined);
    setView('editor');
  };

  const handleCreateInforme = (playerId: string, playerName: string) => {
    setEditingId(undefined);
    setNewPlayerData({ playerId, playerName });
    setLinkedMarketPlayerId(undefined);
    setView('editor');
  };

  const handleCreateFromMarketRequest = (mp: any) => {
    setEditingId(undefined);
    setNewPlayerData({ playerId: String(mp.player_id || ''), playerName: mp.player_name });
    setLinkedMarketPlayerId(mp.id);
    setView('editor');
  };

  const handleBack = () => {
    setEditingId(undefined);
    setNewPlayerData(undefined);
    setLinkedMarketPlayerId(undefined);
    setView('list');
  };

  // Cuando el editor crea/guarda por primera vez, marcamos el market_player como "done"
  const handleInformeSaved = async (newReportId: string) => {
    if (!linkedMarketPlayerId) return;
    try {
      await fetch(`${API_URL}/api/markets/players/${linkedMarketPlayerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report_status: 'done', report_id: newReportId })
      });
      onRefreshMarketRequests?.();
    } catch (e) {
      console.error('Error linking informe to market_player:', e);
    }
  };

  return view === 'list' ? (
    <ReportList
      onEdit={handleEdit}
      onNew={handleNew}
      pendingPlayers={pendingPlayers}
      onCreateInforme={handleCreateInforme}
      marketRequestedReports={marketRequestedReports}
      onCreateFromMarketRequest={handleCreateFromMarketRequest}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  ) : (
    <ReportEditor
      reportId={editingId}
      onBack={handleBack}
      preselectedPlayer={newPlayerData}
      marketPlayerId={linkedMarketPlayerId}
      onMarketLinked={handleInformeSaved}
    />
  );
};

export default InformesTab;
