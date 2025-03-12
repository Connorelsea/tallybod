interface WeightEntry {
  date: string
  weight: number
}

interface WeightListProps {
  entries: WeightEntry[]
  onDeleteEntry: (index: number) => void
}

export default function WeightList({ entries, onDeleteEntry }: WeightListProps) {
  return (
    <div className="overflow-y-auto max-h-[400px] pr-2 rounded-lg border border-purple-200 bg-white/90 shadow-md relative p-6 backdrop-blur-sm">
      {/* Add subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-50/40 to-white/90 -z-10" />
      
      <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Recent Entries</h3>
      
      <div className="grid grid-cols-1 gap-2.5">
        {entries.length === 0 ? (
          <div className="text-purple-500 text-center py-4 italic">No entries yet</div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={index} 
              className="bg-white p-3.5 rounded-md border border-purple-200 flex justify-between items-center text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <span className="font-medium text-purple-900">{entry.date}</span>
                <span className="text-purple-800 font-bold">{entry.weight} lb</span>
              </div>
              <button
                onClick={() => onDeleteEntry(index)}
                className="text-purple-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                aria-label="Delete entry"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

