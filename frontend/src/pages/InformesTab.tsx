import React, { useState, useEffect } from 'react';
import ReportList from '../components/ReportBuilder/ReportList';
import ReportEditor from '../components/ReportBuilder/ReportEditor';

interface Props {
  preselectedPlayer?: { playerId: string; playerName: string } | null;
  onClearPreselected?: () => void;
  pendingPlayers?: { name: string; id: string; count: number }[];
}

const InformesTab: React.FC<Props> = ({ preselectedPlayer, onClearPreselected, pendingPlayers = [] }) => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [newPlayerData, setNewPlayerData] = useState<{ playerId: string; playerName: string } | undefined>();

  // When a preselected player arrives, open editor for new informe
  useEffect(() => {
    if (preselectedPlayer) {
      setEditingId(undefined);
      setNewPlayerData(preselectedPlayer);
      setView('editor');
      onClearPreselected?.();
    }
  }, [preselectedPlayer]);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setNewPlayerData(undefined);
    setView('editor');
  };

  const handleNew = () => {
    setEditingId(undefined);
    setNewPlayerData(undefined);
    setView('editor');
  };

  const handleCreateInforme = (playerId: string, playerName: string) => {
    setEditingId(undefined);
    setNewPlayerData({ playerId, playerName });
    setView('editor');
  };

  const handleBack = () => {
    setEditingId(undefined);
    setNewPlayerData(undefined);
    setView('list');
  };

  return view === 'list' ? (
    <ReportList
      onEdit={handleEdit}
      onNew={handleNew}
      pendingPlayers={pendingPlayers}
      onCreateInforme={handleCreateInforme}
    />
  ) : (
    <ReportEditor reportId={editingId} onBack={handleBack} preselectedPlayer={newPlayerData} />
  );
};

export default InformesTab;
