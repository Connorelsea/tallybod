"use client"

import { useState, useEffect, useRef } from "react"
import WeightChart from "@/app/components/WeightChart"

interface WeightEntry {
  date: string
  weight: number
}

interface Milestone {
  date: string
  description: string
}

interface StoredData {
  entries: WeightEntry[]
  milestones: Milestone[]
}

export default function WeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [importData, setImportData] = useState("")
  const [legacyImportData, setLegacyImportData] = useState("")
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  
  // Use ref to track if we've loaded data from localStorage
  const initialLoadComplete = useRef(false);
  
  // Form states
  const [weight, setWeight] = useState("")
  const [date, setDate] = useState("")
  const [milestoneDesc, setMilestoneDesc] = useState("")
  const [milestoneDate, setMilestoneDate] = useState("")

  // Load data from localStorage
  useEffect(() => {
    try {
      // Log the available localStorage keys for debugging
      console.log("Available localStorage keys:", Object.keys(localStorage));
      
      const storedData = localStorage.getItem("weightData");
      console.log("Raw stored data:", storedData);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log("Parsed data:", parsed);
        
        // Handle different possible data formats
        if (Array.isArray(parsed)) {
          // Legacy format: just an array of entries
          console.log("Setting entries from array:", parsed);
          setEntries(parsed);
          setMilestones([]);
        } else if (parsed && typeof parsed === 'object') {
          // Current format: { entries, milestones }
          const parsedEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
          const parsedMilestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
          
          console.log("Setting entries from object:", parsedEntries);
          console.log("Setting milestones from object:", parsedMilestones);
          
          setEntries(parsedEntries);
          setMilestones(parsedMilestones);
        }
        
        // Mark that we've completed the initial load
        initialLoadComplete.current = true;
      } else {
        console.log("No stored data found in localStorage");
        initialLoadComplete.current = true; // Still mark as complete even if no data found
      }
    } catch (error: unknown) {
      console.error("Error loading data from localStorage:", error);
      initialLoadComplete.current = true; // Mark as complete even on error
    }
  }, []);

  // Save data to localStorage whenever entries or milestones change
  useEffect(() => {
    // Skip if initial load hasn't completed yet
    if (!initialLoadComplete.current) {
      console.log("Skipping localStorage save - initial load not complete");
      return;
    }
    
    try {
      const data = { entries, milestones };
      console.log("Saving to localStorage:", data);
      localStorage.setItem("weightData", JSON.stringify(data));
    } catch (error: unknown) {
      console.error("Error saving data to localStorage:", error);
    }
  }, [entries, milestones]);

  const addEntry = (entry: WeightEntry) => {
    setEntries((prevEntries) =>
      [...prevEntries, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    )
  }

  const addMilestone = (milestone: Milestone) => {
    setMilestones(prev => 
      [...prev, milestone].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    )
  }
  
  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    const entry = {
      date: date || new Date().toISOString().split("T")[0],
      weight: Number.parseFloat(weight),
    }
    addEntry(entry)
    setWeight("")
    setDate("")
  }

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!milestoneDesc || !milestoneDate) return

    addMilestone({
      date: milestoneDate,
      description: milestoneDesc,
    })
    setMilestoneDesc("")
    setMilestoneDate("")
  }

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(importData) as StoredData
      if (Array.isArray(parsedData.entries) && Array.isArray(parsedData.milestones)) {
        setEntries(parsedData.entries.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ))
        setMilestones(parsedData.milestones.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ))
        setImportData("")
      } else {
        alert("Invalid data format. Please provide both entries and milestones arrays.")
      }
    } catch (error: unknown) {
      alert(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleLegacyImport = () => {
    try {
      const parsedData = JSON.parse(legacyImportData) as WeightEntry[]
      if (Array.isArray(parsedData) && parsedData.every(entry => 
        typeof entry.date === 'string' && typeof entry.weight === 'number'
      )) {
        const newData: StoredData = {
          entries: parsedData.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
          milestones: []
        }
        // Show the converted data for easy copying
        alert("Converted data:\n" + JSON.stringify(newData, null, 2))
        setLegacyImportData("")
      } else {
        alert("Invalid legacy data format")
      }
    } catch (error: unknown) {
      alert(`Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const deleteEntry = (index: number) => {
    console.log("Deleting entry at index:", index, "with value:", entries[index]);
    setEntries(prevEntries => prevEntries.filter((_, i) => i !== index));
  }

  // DEBUGGING: Add button to inspect localStorage directly
  const inspectLocalStorage = () => {
    try {
      const rawData = localStorage.getItem("weightData");
      console.log("Raw localStorage content:", rawData);
      
      // Try parsing different formats
      if (rawData) {
        try {
          const parsedJson = JSON.parse(rawData);
          console.log("Parsed as JSON:", parsedJson);
          
          if (Array.isArray(parsedJson)) {
            console.log("Data is an array with", parsedJson.length, "items");
            // Check the first item
            if (parsedJson.length > 0) {
              console.log("First item:", parsedJson[0]);
            }
          } else if (typeof parsedJson === 'object') {
            console.log("Data is an object with keys:", Object.keys(parsedJson));
            if (parsedJson.entries) {
              console.log("Entries found:", parsedJson.entries.length);
            }
            if (parsedJson.milestones) {
              console.log("Milestones found:", parsedJson.milestones.length);
            }
          }
        } catch (error: unknown) {
          console.error("Error parsing JSON:", error);
        }
      }
    } catch (error: unknown) {
      console.error("Error inspecting localStorage:", error);
    }
  };

  // Manual function to load data from localStorage
  const loadDataManually = () => {
    try {
      const storedData = localStorage.getItem("weightData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          console.log("Manually loading data:", parsed);
          
          if (Array.isArray(parsed)) {
            console.log("Setting entries from array");
            setEntries(parsed);
            setMilestones([]);
            alert(`Loaded ${parsed.length} entries from localStorage (array format)`);
          } else if (parsed && typeof parsed === 'object') {
            const parsedEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
            const parsedMilestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
            
            setEntries(parsedEntries);
            setMilestones(parsedMilestones);
            alert(`Loaded ${parsedEntries.length} entries and ${parsedMilestones.length} milestones from localStorage`);
          } else {
            alert("Data found in localStorage but in unknown format");
          }
        } catch (error: unknown) {
          console.error("Error parsing localStorage data:", error);
          alert(`Error parsing data: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      } else {
        alert("No data found in localStorage");
      }
    } catch (error: unknown) {
      console.error("Error manually loading data:", error);
      alert(`Error loading data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="min-h-screen fixed inset-0 bg-gradient-to-b from-purple-100/50 via-purple-100/30 to-purple-100 -z-10"></div>
      <div className="container mx-auto px-4 py-8 relative">
        <h1 className="text-3xl font-bold tracking-tight text-purple-900 mb-8 text-center">
          Weight Tracker
        </h1>
        
        {/* DEBUG BUTTONS - Remove in production */}
        <div className="text-center mb-4 flex justify-center gap-2">
          <button
            onClick={inspectLocalStorage}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium text-sm"
          >
            Debug: Inspect localStorage
          </button>
          <button
            onClick={loadDataManually}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium text-sm"
          >
            Load Data Manually
          </button>
        </div>
        
        {/* Main Row: Chart and Add Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 mb-8">
          {/* Left Column: Chart */}
          <div>
            <WeightChart entries={entries} milestones={milestones} />
          </div>
          
          {/* Right Column: Add Entry and Add Milestone */}
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-white/90 -z-10" />
              <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Add Entry</h3>
              <div className="space-y-5">
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
              <div className="absolute inset-0 bg-gradient-to-bl from-purple-50/40 to-white/90 -z-10" />
              <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Add Milestone</h3>
              <div className="space-y-5">
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
        </div>
        
        {/* Second Row: Recent Entries */}
        <div className="mb-8">
          <div className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-50/40 to-white/90 -z-10" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold tracking-tight text-purple-900">
                {showAllEntries ? "All Entries" : "Recent Entries"}
              </h3>
              <button
                onClick={() => setShowAllEntries(!showAllEntries)}
                className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                {showAllEntries ? "Show Recent" : "Show All"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {entries.length === 0 ? (
                <div className="text-purple-500 text-center py-4 italic col-span-full">No entries yet</div>
              ) : (
                // Display entries based on showAllEntries state
                (() => {
                  // Debug output for entries
                  console.log("Current entries to display:", entries);
                  const sortedEntries = [...entries].sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                  console.log("Sorted entries:", sortedEntries);
                  const slicedEntries = sortedEntries.slice(0, showAllEntries ? entries.length : 8);
                  console.log("Sliced entries:", slicedEntries);
                  
                  return slicedEntries.map((entry, index) => {
                    // Find the original index of this entry in the entries array for deletion
                    const originalIndex = entries.findIndex(e => 
                      e.date === entry.date && 
                      e.weight === entry.weight
                    );
                    
                    console.log(`Entry at index ${index}:`, entry, "Original index:", originalIndex);
                    
                    return (
                      <div 
                        key={`${entry.date}-${entry.weight}-${index}`}
                        className="bg-white p-3.5 rounded-md border border-purple-200 flex justify-between items-center text-sm shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-purple-900">{entry.date}</span>
                          <span className="text-purple-800 font-bold">{entry.weight} lb</span>
                        </div>
                        <button
                          onClick={() => {
                            console.log("Delete clicked for entry:", entry, "at original index:", originalIndex);
                            deleteEntry(originalIndex);
                          }}
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
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
        
        {/* Advanced Settings Toggle */}
        <div className="text-center mb-4">
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium inline-flex items-center gap-2"
          >
            {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
        
        {/* Advanced Settings Section */}
        {showAdvancedSettings && (
          <div className="space-y-8">
            {/* Import/Export Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/40 to-white/90 -z-10" />
                <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Import Data</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="import" className="text-sm font-medium text-purple-800">
                      Paste JSON Data
                    </label>
                    <textarea
                      id="import"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder='{"entries":[{"date":"...","weight":...}],"milestones":[...]}'
                      className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all h-24 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleImport}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
                  >
                    Import
                  </button>
                </div>
              </div>
              
              <div className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/40 to-white/90 -z-10" />
                <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Export Data</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-800">
                      Current Data
                    </label>
                    <div className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-purple-50/60 shadow-sm h-24 overflow-auto text-sm">
                      <code className="text-purple-900 font-mono">{JSON.stringify({ entries, milestones }, null, 2)}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({ entries, milestones }));
                      alert("Data copied to clipboard!");
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
            
            {/* Legacy Import Section */}
            <div className="rounded-lg border border-purple-200 bg-white/90 shadow-md relative overflow-hidden p-6 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/40 to-white/90 -z-10" />
              <h3 className="text-xl font-semibold tracking-tight text-purple-900 mb-4">Legacy Import (CSV)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="legacyImport" className="text-sm font-medium text-purple-800">
                    Format: date,weight (one per line)
                  </label>
                  <textarea
                    id="legacyImport"
                    value={legacyImportData}
                    onChange={(e) => setLegacyImportData(e.target.value)}
                    placeholder="2023-01-01,190.5&#10;2023-01-08,189.2"
                    className="w-full px-3 py-2.5 rounded-md border border-purple-200 bg-white/90 focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 shadow-sm transition-all h-24 text-sm"
                  />
                </div>
                <button
                  onClick={handleLegacyImport}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-md hover:from-purple-500 hover:to-purple-600 transition-all font-medium btn-neomorph"
                >
                  Import CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

