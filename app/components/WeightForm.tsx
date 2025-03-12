import { useState } from "react"

interface WeightFormProps {
  onAddEntry: (entry: { date: string; weight: number }) => void
  onAddMilestone: (milestone: { date: string; description: string }) => void
}

export default function WeightForm({ onAddEntry, onAddMilestone }: WeightFormProps) {
  const [weight, setWeight] = useState("")
  const [date, setDate] = useState("")
  const [milestoneDesc, setMilestoneDesc] = useState("")
  const [milestoneDate, setMilestoneDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    const entry = {
      date: date || new Date().toISOString().split("T")[0],
      weight: Number.parseFloat(weight),
    }
    onAddEntry(entry)
    setWeight("")
    setDate("")
  }

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!milestoneDesc || !milestoneDate) return

    onAddMilestone({
      date: milestoneDate,
      description: milestoneDesc,
    })
    setMilestoneDesc("")
    setMilestoneDate("")
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
        {/* Add subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-white/90 -z-10" />
        
        <div className="space-y-5">
          <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Add Entry</h3>
          <div className="space-y-2">
            <label htmlFor="weight" className="text-sm font-medium text-purple-800">
              Weight (lb)
            </label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              required
              className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-purple-800">
              Date (optional)
            </label>
            <input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2.5 mt-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
          >
            Add Entry
          </button>
        </div>
      </form>

      <form onSubmit={handleMilestoneSubmit} className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
        {/* Add subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-50/40 to-white/90 -z-10" />
        
        <div className="space-y-5">
          <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Add Milestone</h3>
          <div className="space-y-2">
            <label htmlFor="milestoneDate" className="text-sm font-medium text-purple-800">
              Date
            </label>
            <input 
              id="milestoneDate" 
              type="date" 
              value={milestoneDate} 
              onChange={(e) => setMilestoneDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="milestone" className="text-sm font-medium text-purple-800">
              Description
            </label>
            <input
              id="milestone"
              type="text"
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              placeholder="e.g., Started new diet"
              required
              className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2.5 mt-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-md hover:from-purple-500 hover:to-purple-600 transition-all font-medium btn-neomorph"
          >
            Add Milestone
          </button>
        </div>
      </form>
    </div>
  )
}

