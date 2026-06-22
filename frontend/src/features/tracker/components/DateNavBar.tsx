interface DateNavBarProps {
  selectedDate: string;
  onDateChange: (days: number) => void;
  onPickerChange: (dateStr: string) => void;
}

export function DateNavBar({ selectedDate, onDateChange, onPickerChange }: DateNavBarProps) {
  return (
    <div className="tracker-date-navbar">
      <button className="date-nav-btn" onClick={() => onDateChange(-1)}>
        &larr; Prev
      </button>
      <div className="date-display-box">
        <input
          type="date"
          className="date-picker-input"
          value={selectedDate}
          onChange={e => onPickerChange(e.target.value)}
        />
      </div>
      <button className="date-nav-btn" onClick={() => onDateChange(1)}>
        Next &rarr;
      </button>
    </div>
  )
}
