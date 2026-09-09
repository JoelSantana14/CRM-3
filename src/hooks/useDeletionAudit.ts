import { useState, useEffect } from 'react';
import { DeletionAuditRecord, User } from '../types';
import { subscribeToDeletionLogs, logDeletionToFirestore } from '../services/firestoreService';

export function useDeletionAudit() {
  const [deletionLogs, setDeletionLogs] = useState<DeletionAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToDeletionLogs((logs) => {
      setDeletionLogs(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const recordDeletion = async (
    currentUser: User,
    entityType: DeletionAuditRecord['entityType'],
    recordId: string,
    recordIdentifier: string,
    detalhes: string,
    snapshot?: any,
    motivo?: string
  ): Promise<boolean> => {
    const now = new Date();
    const logId = `DEL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: DeletionAuditRecord = {
      id: logId,
      timestamp: now.toISOString(),
      dataHoraFormatada: now.toLocaleString('pt-BR'),
      deletedBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      },
      entityType,
      recordId,
      recordIdentifier,
      detalhes,
      motivo: motivo || 'Exclusão autorizada pelo Administrador.',
      snapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : undefined,
    };

    return await logDeletionToFirestore(record);
  };

  return {
    deletionLogs,
    loading,
    recordDeletion,
  };
}
