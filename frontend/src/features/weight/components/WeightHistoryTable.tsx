import { useState } from 'react'
import { WeightLog } from '../weight.api'

export interface WeightHistoryTableProps {
  weights: WeightLog[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export function WeightHistoryTable({
  weights,
  onDelete,
  isLoading,
}: WeightHistoryTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Format dates for display helper
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(Date.UTC(year, month - 1, day))
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }

  return (
    <div className="weight-card shadow-sm history-card">
      <h2 className="card-title">Log History</h2>
      {weights.length === 0 ? (
        <p className="no-history-text">No weight records found. Log your weight to see your history.</p>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Logged Date</th>
                <th>Weight (kg)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...weights]
                .sort((a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime())
                .map((log) => {
                  const isConfirming = confirmDeleteId === log.id;
                  return (
                    <tr key={log.id}>
                      <td className="font-semibold">{formatDate(log.loggedDate)}</td>
                      <td className="font-bold text-accent">{log.weightKg.toFixed(1)} kg</td>
                      <td className="text-right">
                        {isConfirming ? (
                          <div className="inline-confirm-buttons">
                            <button
                              id={`confirm-delete-btn-${log.id}`}
                              className="confirm-delete-btn-inline"
                              onClick={() => {
                                onDelete(log.id)
                                setConfirmDeleteId(null)
                              }}
                              disabled={isLoading}
                            >
                              Confirm
                            </button>
                            <button
                              id={`cancel-delete-btn-${log.id}`}
                              className="cancel-delete-btn-inline"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`delete-log-btn-${log.id}`}
                            className="delete-log-btn"
                            onClick={() => setConfirmDeleteId(log.id)}
                            aria-label="Delete weight log"
                            disabled={isLoading}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
