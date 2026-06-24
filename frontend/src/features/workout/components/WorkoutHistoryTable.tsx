import { ExerciseLog } from '../workout.api'

export interface WorkoutHistoryTableProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories: string[];
  isFetching: boolean;
  filteredExercises: ExerciseLog[];
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  handleDelete: (id: string) => Promise<void>;
  handleEditClick: (log: ExerciseLog) => void;
  isDeleting: boolean;
  onExportCSV: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WorkoutHistoryTable({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  isFetching,
  filteredExercises,
  deletingId,
  setDeletingId,
  handleDelete,
  handleEditClick,
  isDeleting,
  onExportCSV,
  onImportCSV,
}: WorkoutHistoryTableProps) {
  return (
    <div className="workout-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Session History</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="workout-export-btn" onClick={onExportCSV} title="Export history to CSV">
            <svg className="action-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          
          <label className="workout-import-btn" title="Import history from CSV">
            <svg className="action-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={onImportCSV}
            />
          </label>
        </div>
      </div>

      <div className="history-controls">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search exercise..."
            className="workout-text-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter-list">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isFetching ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading history...</div>
      ) : filteredExercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No exercise logs found.</div>
      ) : (
        <div className="workout-table-wrapper">
          <table className="workout-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exercise</th>
                <th>Category</th>
                <th>Sets Detail</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExercises.map(log => (
                <tr key={log.id}>
                  <td>{log.loggedDate}</td>
                  <td style={{ fontWeight: 600, color: 'var(--heading-color)' }}>{log.exerciseName}</td>
                  <td>
                    <span className={`workout-category-tag ${log.category.toLowerCase()}`}>
                      {log.category}
                    </span>
                  </td>
                  <td>
                    <div className="sets-detail-list">
                      {log.sets.map(s => (
                        <span key={s.id || s.setNumber} className="set-detail-pill">
                          {log.category === 'Cardio'
                            ? `${s.distanceKm ?? 0}km in ${s.durationMinutes ?? 0}m`
                            : `${s.weight ?? 0}kg x ${s.reps ?? 0}`
                          }
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {deletingId === log.id ? (
                        <div className="inline-confirm-box">
                          <span>Confirm?</span>
                          <button className="confirm-yes-btn" onClick={() => handleDelete(log.id)} disabled={isDeleting}>Yes</button>
                          <button className="confirm-no-btn" onClick={() => setDeletingId(null)}>No</button>
                        </div>
                      ) : (
                        <>
                          <button className="action-icon-btn edit" onClick={() => handleEditClick(log)} aria-label="Edit log">
                            <svg className="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          <button className="action-icon-btn delete" onClick={() => setDeletingId(log.id)} aria-label="Delete log">
                            <svg className="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
