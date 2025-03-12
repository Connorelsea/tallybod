"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { timeFormat } from "d3-time-format"
import { useState, useEffect } from "react"

interface WeightEntry {
  date: string
  weight: number
}

interface Milestone {
  date: string
  description: string
}

interface TimestampedMilestone extends Milestone {
  timestamp: number
}

interface WeightChartProps {
  entries: WeightEntry[]
  milestones: Milestone[]
}

export default function WeightChart({ entries, milestones }: WeightChartProps) {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().setMonth(new Date().getMonth() - 1)), // Default to last month
    new Date()
  ]);
  const [selectedMilestone, setSelectedMilestone] = useState<TimestampedMilestone | null>(null);
  const [futurePeriod, setFuturePeriod] = useState<number>(0); // Future projection in months
  const [recentTrendOnly, setRecentTrendOnly] = useState<boolean>(false); // Whether to use only recent entries for trend
  const [recentEntryCount, setRecentEntryCount] = useState<number>(4); // Number of recent entries to use for trend

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => ({
      ...entry,
      timestamp: new Date(entry.date).getTime()
    }))

  // Filter entries based on selected date range
  const filteredEntries = sortedEntries.filter(
    entry => entry.timestamp >= dateRange[0].getTime() && entry.timestamp <= dateRange[1].getTime()
  );

  // Update calculations to use filteredEntries instead of sortedEntries
  const totalWeightLost =
    filteredEntries.length > 1 ? filteredEntries[0].weight - filteredEntries[filteredEntries.length - 1].weight : 0

  const weeksPassed = Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (7 * 24 * 60 * 60 * 1000))
  const avgWeeklyLoss = weeksPassed > 0 ? totalWeightLost / weeksPassed : 0

  // Convert milestones to timestamps for filtering
  const timestampedMilestones = milestones.map(milestone => ({
    ...milestone,
    timestamp: new Date(milestone.date).getTime()
  }))

  // Filter milestones based on selected date range
  const filteredMilestones = timestampedMilestones.filter(
    milestone => milestone.timestamp >= dateRange[0].getTime() && milestone.timestamp <= dateRange[1].getTime()
  )

  // Set the most recent milestone as default when component mounts or milestones change
  useEffect(() => {
    if (filteredMilestones.length > 0) {
      const mostRecentMilestone = [...filteredMilestones].sort(
        (a, b) => b.timestamp - a.timestamp
      )[0];
      setSelectedMilestone(mostRecentMilestone);
    } else {
      setSelectedMilestone(null);
    }
  }, [JSON.stringify(filteredMilestones)]); // Use JSON.stringify to properly detect changes

  // Calculate linear regression parameters (slope and intercept) using least squares method
  const calculateLinearRegression = (data: { timestamp: number, weight: number }[]) => {
    if (data.length < 2) return { slope: 0, intercept: 0, firstTimestamp: 0 };
    
    // Normalize timestamps to days since first entry to avoid precision issues with large numbers
    const firstTimestamp = data[0].timestamp;
    const normalizedData = data.map(entry => ({
      time: (entry.timestamp - firstTimestamp) / (1000 * 60 * 60 * 24), // Convert to days
      weight: entry.weight
    }));
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = normalizedData.length;
    
    for (const point of normalizedData) {
      sumX += point.time;
      sumY += point.weight;
      sumXY += point.time * point.weight;
      sumXX += point.time * point.time;
    }
    
    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Convert slope back to weight change per millisecond
    const slopePerMs = slope / (1000 * 60 * 60 * 24);
    
    return { 
      slope: slopePerMs, 
      intercept: intercept,
      firstTimestamp: firstTimestamp
    };
  };

  // Calculate trendline data from selected milestone
  const getTrendlineData = () => {
    if (!selectedMilestone || filteredEntries.length === 0) return [];

    // Get entries starting from the selected milestone
    let entriesFromMilestone = filteredEntries
      .filter(entry => entry.timestamp >= selectedMilestone.timestamp);

    if (entriesFromMilestone.length < 2) return [];
    
    // If using recent trend only, limit to the most recent entries
    if (recentTrendOnly && entriesFromMilestone.length > recentEntryCount) {
      entriesFromMilestone = entriesFromMilestone.slice(-recentEntryCount);
    }

    // Calculate regression parameters
    const regression = calculateLinearRegression(entriesFromMilestone);
    
    // For visualization, we'll still show the trendline for all entries from the milestone
    const allEntriesFromMilestone = filteredEntries
      .filter(entry => entry.timestamp >= selectedMilestone.timestamp);
    
    // Create trendline data points within the current date range
    const currentTrendData = allEntriesFromMilestone.map(entry => {
      // Calculate trendline value based on regression
      const timeSinceFirst = entry.timestamp - regression.firstTimestamp;
      const trendWeight = regression.intercept + (regression.slope * timeSinceFirst);
      
      return {
        timestamp: entry.timestamp,
        trendWeight: trendWeight,
        isFuture: false
      };
    });
      
    // If future projection is enabled, add future data points
    if (futurePeriod > 0 && currentTrendData.length > 0) {
      const futureTrendData = [];
      const lastTimestamp = dateRange[1].getTime();
      
      // Calculate future end date
      const futureEndDate = new Date(dateRange[1]);
      futureEndDate.setMonth(futureEndDate.getMonth() + futurePeriod);
      const futureEndTimestamp = futureEndDate.getTime();
      
      // Create data points for each day in the projection (approximately)
      const timeStep = (futureEndTimestamp - lastTimestamp) / 30; // Approximate time for one data point per day
      
      for (let t = lastTimestamp + timeStep; t <= futureEndTimestamp; t += timeStep) {
        const timeSinceFirst = t - regression.firstTimestamp;
        const projectedWeight = regression.intercept + (regression.slope * timeSinceFirst);
        
        futureTrendData.push({
          timestamp: t,
          trendWeight: projectedWeight,
          isFuture: true
        });
      }
      
      return [...currentTrendData, ...futureTrendData];
    }
    
    return currentTrendData;
  };
  
  const trendlineData = getTrendlineData();
  
  // Calculate average weekly weight loss based on trendline
  const calculateWeeklyLossRate = () => {
    if (trendlineData.length < 2) return 0;
    
    // Get only the non-future data points
    const actualTrendData = trendlineData.filter(d => !d.isFuture);
    if (actualTrendData.length < 2) return 0;
    
    const firstPoint = actualTrendData[0];
    const lastPoint = actualTrendData[actualTrendData.length - 1];
    
    // Calculate time difference in weeks
    const timeDiffMs = lastPoint.timestamp - firstPoint.timestamp;
    const timeDiffWeeks = timeDiffMs / (7 * 24 * 60 * 60 * 1000);
    
    if (timeDiffWeeks === 0) return 0;
    
    // Calculate weight change per week
    return (firstPoint.trendWeight - lastPoint.trendWeight) / timeDiffWeeks;
  };
  
  const weeklyLossRate = calculateWeeklyLossRate();
  
  // Calculate future end date and projected goal weight
  const getFutureEndDate = () => {
    if (futurePeriod === 0) return dateRange[1];
    const futureEnd = new Date(dateRange[1]);
    futureEnd.setMonth(futureEnd.getMonth() + futurePeriod);
    return futureEnd;
  };
  
  const futureEndDate = getFutureEndDate();
  
  // Get projected goal weight (last point on trendline)
  const goalWeight = trendlineData.length > 0 
    ? trendlineData[trendlineData.length - 1].trendWeight 
    : null;

  // Add helper functions for date range selection
  const setLastMonth = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    setDateRange([start, end]);
  };

  const setLastSixMonths = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    setDateRange([start, end]);
  };

  const setAllTime = () => {
    if (sortedEntries.length === 0) return;
    const start = new Date(sortedEntries[0].timestamp);
    const end = new Date(sortedEntries[sortedEntries.length - 1].timestamp);
    setDateRange([start, end]);
  };

  // Handle milestone selection change
  const handleMilestoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTimestamp = Number(e.target.value);
    if (selectedTimestamp === 0) {
      setSelectedMilestone(null);
      return;
    }
    
    const milestone = timestampedMilestones.find(m => m.timestamp === selectedTimestamp) || null;
    setSelectedMilestone(milestone);
  };
  
  // Handle future period selection change
  const handleFuturePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFuturePeriod(Number(e.target.value));
  };
  
  // Handle recent trend only toggle
  const handleRecentTrendToggle = () => {
    setRecentTrendOnly(!recentTrendOnly);
  };
  
  // Handle recent entry count change
  const handleRecentEntryCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecentEntryCount(Number(e.target.value));
  };

  return (
    <div className="rounded-lg border border-purple-100 bg-white/95 text-card-foreground shadow-sm backdrop-blur-sm relative overflow-hidden">
      {/* Add subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/20 to-white/95 -z-10" />
      
      <div className="flex flex-col space-y-2 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-purple-900">Weight Over Time</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={setLastMonth}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
            >
              Past Month
            </button>
            <button
              onClick={setLastSixMonths}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
            >
              Past 6 Months
            </button>
            <button
              onClick={setAllTime}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition-all font-medium btn-neomorph"
            >
              All Time
            </button>
          </div>
          <div className="flex gap-5 flex-wrap mt-2">
            <div className="min-w-[180px]">
              <label htmlFor="startDate" className="block text-sm font-medium text-purple-800 mb-1">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={dateRange[0].toISOString().split('T')[0]}
                onChange={(e) => setDateRange([new Date(e.target.value), dateRange[1]])}
                className="w-full border-purple-200 bg-white/90 rounded-md px-3 py-1.5 shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-300 focus:ring-opacity-50 transition-all"
              />
            </div>
            <div className="min-w-[180px]">
              <label htmlFor="endDate" className="block text-sm font-medium text-purple-800 mb-1">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={dateRange[1].toISOString().split('T')[0]}
                onChange={(e) => setDateRange([dateRange[0], new Date(e.target.value)])}
                className="w-full border-purple-200 bg-white/90 rounded-md px-3 py-1.5 shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-300 focus:ring-opacity-50 transition-all"
              />
            </div>
            <div className="min-w-[180px]">
              <label htmlFor="milestone" className="block text-sm font-medium text-purple-800 mb-1">Trendline From:</label>
              <select
                id="milestone"
                value={selectedMilestone?.timestamp || ""}
                onChange={handleMilestoneChange}
                className="w-full border-purple-200 bg-white/90 rounded-md px-3 py-1.5 shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-300 focus:ring-opacity-50 transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="">None</option>
                {filteredMilestones.map((milestone, index) => (
                  <option key={index} value={milestone.timestamp}>
                    {timeFormat("%Y-%m-%d")(new Date(milestone.timestamp))} - {milestone.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label htmlFor="futurePeriod" className="block text-sm font-medium text-purple-800 mb-1">Project Future:</label>
              <select
                id="futurePeriod"
                value={futurePeriod}
                onChange={handleFuturePeriodChange}
                className="w-full border-purple-200 bg-white/90 rounded-md px-3 py-1.5 shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-300 focus:ring-opacity-50 transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="0">None</option>
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[180px]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recentTrendOnly"
                  checked={recentTrendOnly}
                  onChange={handleRecentTrendToggle}
                  className="rounded border-purple-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 h-4 w-4"
                />
                <label htmlFor="recentTrendOnly" className="text-sm font-medium text-purple-800">
                  Use recent trend only
                </label>
              </div>
              {recentTrendOnly && (
                <div className="mt-2">
                  <select
                    id="recentEntryCount"
                    value={recentEntryCount}
                    onChange={handleRecentEntryCountChange}
                    className="w-full border-purple-200 bg-white/90 rounded-md px-3 py-1.5 shadow-sm focus:border-purple-400 focus:ring focus:ring-purple-300 focus:ring-opacity-50 transition-all text-sm appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="2">Last 2 entries</option>
                    <option value="3">Last 3 entries</option>
                    <option value="4">Last 4 entries</option>
                    <option value="5">Last 5 entries</option>
                    <option value="7">Last 7 entries</option>
                    <option value="10">Last 10 entries</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 pt-2">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" strokeOpacity={0.5} />
              <XAxis 
                dataKey="timestamp"
                type="number"
                domain={[
                  dateRange[0].getTime(),
                  futureEndDate.getTime()
                ]}
                scale="time"
                tickFormatter={(timestamp) => timeFormat("%Y-%m-%d")(new Date(timestamp))}
                style={{ fontFamily: 'var(--font-afacad)' }}
                stroke="#8b5cf6"
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                domain={[
                  Math.min(
                    ...filteredEntries.map(e => e.weight),
                    ...(goalWeight !== null ? [goalWeight] : [])
                  ) - 5, 
                  Math.max(
                    ...filteredEntries.map(e => e.weight),
                    ...trendlineData.filter(d => d.isFuture).map(d => d.trendWeight)
                  ) + 5
                ]} 
                style={{ fontFamily: 'var(--font-afacad)' }}
                stroke="#8b5cf6"
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                labelFormatter={(timestamp) => timeFormat("%Y-%m-%d")(new Date(timestamp))}
                contentStyle={{ 
                  fontFamily: 'var(--font-afacad)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderColor: '#d8b4fe',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                formatter={(value: number) => [value.toFixed(2) + ' lb', 'Weight']}
                cursor={{ stroke: '#8b5cf6', strokeDasharray: '3 3' }}
              />
              
              {filteredMilestones.map((milestone, index) => (
                <ReferenceLine
                  key={index}
                  x={milestone.timestamp}
                  stroke="#a78bfa"
                  strokeDasharray="3 3"
                  label={{
                    value: milestone.description,
                    position: 'top',
                    fill: '#8b5cf6',
                    fontSize: 12,
                    offset: 10,
                    style: { 
                      textAnchor: 'middle',
                      fontFamily: 'var(--font-afacad)',
                      fontWeight: 500,
                    }
                  }}
                />
              ))}
              
              {/* Add reference line for current date when showing future projection */}
              {futurePeriod > 0 && (
                <ReferenceLine
                  x={dateRange[1].getTime()}
                  stroke="#8b5cf6"
                  strokeDasharray="3 3"
                  label={{
                    value: "Today",
                    position: 'top',
                    fill: '#8b5cf6',
                    fontSize: 12,
                    offset: 10,
                    style: { 
                      textAnchor: 'middle',
                      fontFamily: 'var(--font-afacad)',
                      fontWeight: 500,
                    }
                  }}
                />
              )}
              
              {/* Add goal marker at the end of future projection */}
              {futurePeriod > 0 && goalWeight !== null && (
                <ReferenceLine
                  x={futureEndDate.getTime()}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{
                    value: `Goal: ${goalWeight.toFixed(1)} lb`,
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 12,
                    offset: 10,
                    style: { 
                      textAnchor: 'middle',
                      fontFamily: 'var(--font-afacad)',
                      fontWeight: 500,
                    }
                  }}
                />
              )}
              
              <Line 
                data={filteredEntries}
                type="monotone" 
                dataKey="weight" 
                stroke="#8b5cf6"
                strokeWidth={2} 
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#a855f7', stroke: '#ffffff', strokeWidth: 2 }}
                name="Actual Weight"
              />
              
              {trendlineData.length > 0 && (
                <Line
                  data={trendlineData}
                  type="linear"
                  dataKey="trendWeight"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                  name="Trend Since Milestone"
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Statistics Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card flex flex-col justify-between">
            <div className="text-sm font-medium text-purple-700 mb-1">Total Weight Lost</div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-purple-900">{Math.abs(totalWeightLost).toFixed(1)}</span>
              <span className="text-sm text-purple-700 mb-1">lb</span>
            </div>
          </div>
          
          <div className="stat-card flex flex-col justify-between">
            <div className="text-sm font-medium text-purple-700 mb-1">Weekly Average</div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-purple-900">{avgWeeklyLoss.toFixed(1)}</span>
              <span className="text-sm text-purple-700 mb-1">lb/week</span>
            </div>
          </div>
          
          {selectedMilestone && trendlineData.length > 1 && (
            <div className="stat-card flex flex-col justify-between md:col-span-2">
              <div className="text-sm font-medium text-purple-700 mb-1">
                Since {selectedMilestone.description} ({timeFormat("%Y-%m-%d")(new Date(selectedMilestone.timestamp))})
                {recentTrendOnly && <span className="text-purple-500 text-xs ml-1">- using {recentEntryCount} most recent entries</span>}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-purple-900">
                  {(trendlineData.filter(d => !d.isFuture)[0].trendWeight - 
                  trendlineData.filter(d => !d.isFuture)[trendlineData.filter(d => !d.isFuture).length - 1].trendWeight).toFixed(1)} lb
                </span>
                {weeklyLossRate > 0 && (
                  <span className="text-lg text-purple-700 mb-1">
                    ({weeklyLossRate.toFixed(1)} lb/week)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Projected goal card */}
        {futurePeriod > 0 && goalWeight !== null && (
          <div className="mt-4">
            <div className="stat-card bg-gradient-to-r from-emerald-50/80 to-white/90 border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <div className="text-sm font-medium text-emerald-700 mb-1">
                    Projected by {timeFormat("%Y-%m-%d")(futureEndDate)}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-emerald-700">{goalWeight.toFixed(1)}</span>
                    <span className="text-sm text-emerald-600 mb-1">lb</span>
                  </div>
                </div>
                
                {selectedMilestone && (
                  <div className="sm:text-right">
                    <div className="text-sm font-medium text-emerald-700 mb-1">Total Loss</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {(trendlineData[0].trendWeight - goalWeight).toFixed(1)} lb
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

