import { useMemo } from 'react';
import { UserProgress } from '../types';

interface ProgressHeatmapProps {
  userProgress: UserProgress[];
  currentStreak: number;
  longestStreak: number;
}

interface DayCell {
  date: string;
  totalExercises: number;
  avgAccuracy: number;
  colorClass: string;
}

/**
 * Get color class based on activity level
 */
function getColorClass(exercises: number, accuracy: number): string {
  if (exercises === 0) {
    return 'bg-gray-200 dark:bg-gray-700';
  }
  
  // Calculate intensity based on both exercises and accuracy
  const score = exercises * (accuracy / 100);
  
  if (score >= 3) {
    return 'bg-green-600 hover:bg-green-500';
  } else if (score >= 2) {
    return 'bg-green-500 hover:bg-green-400';
  } else if (score >= 1) {
    return 'bg-green-400 hover:bg-green-300';
  } else {
    return 'bg-green-300 hover:bg-green-200';
  }
}

/**
 * Generate last 365 days of data with proper alignment
 */
function generateLastYearDays(progressData: UserProgress[]): DayCell[] {
  const today = new Date();
  const days: DayCell[] = [];
  
  // Go back 364 days to get 52 weeks (365 days total including today)
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find progress for this date
    const dayProgress = progressData.find(p => p.date === dateStr);
    
    days.push({
      date: dateStr,
      totalExercises: dayProgress?.totalExercises || 0,
      avgAccuracy: dayProgress?.avgAccuracy || 0,
      colorClass: getColorClass(dayProgress?.totalExercises || 0, dayProgress?.avgAccuracy || 0),
    });
  }
  
  return days;
}

/**
 * Organize days into weeks for grid display
 */
function organizeIntoWeeks(days: DayCell[]): DayCell[][] {
  const weeks: DayCell[][] = [];
  let currentWeek: DayCell[] = [];
  
  // Find the starting day of week (Sunday = 0)
  const firstDay = new Date(days[0]?.date || new Date());
  const startDayOfWeek = firstDay.getDay();
  
  // Add padding days for the first week
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push({
      date: '',
      totalExercises: 0,
      avgAccuracy: 0,
      colorClass: 'bg-transparent',
    });
  }
  
  // Fill in the actual days
  days.forEach((day, index) => {
    currentWeek.push(day);
    
    // Start a new week after Saturday (or when we have 7 days)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add remaining days
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
}

export default function ProgressHeatmap({ 
  userProgress, 
  currentStreak, 
  longestStreak 
}: ProgressHeatmapProps) {
  const days = useMemo(() => generateLastYearDays(userProgress), [userProgress]);
  const weeks = useMemo(() => organizeIntoWeeks(days), [days]);
  
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get month labels for top row
  const monthLabels = useMemo(() => {
    const months: string[] = [];
    let lastMonth = -1;
    
    days.forEach((day, index) => {
      if (index % 7 === 0) { // Check first day of each week
        const date = new Date(day.date);
        const month = date.toLocaleString('default', { month: 'short' });
        
        if (month !== lastMonth) {
          months.push(month);
          lastMonth = month;
        } else {
          months.push('');
        }
      }
    });
    
    return months;
  }, [days]);

  return (
    <div className="w-full">
      {/* Streak Summary */}
      <div className="mb-6 flex gap-6 justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {currentStreak}
          </div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {longestStreak}
          </div>
          <div className="text-xs text-muted-foreground">Longest Streak</div>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Month labels */}
          <div className="flex mb-2 ml-6">
            {weeks.map((_, index) => (
              <div 
                key={`month-${index}`} 
                className="flex-1 text-xs text-muted-foreground"
              >
                {monthLabels[index] || ''}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {weekLabels.map((day, index) => (
                <div 
                  key={day}
                  className="h-3 w-3 flex items-center justify-center text-[9px] text-muted-foreground"
                  style={{ minHeight: '12px' }}
                >
                  {index % 2 === 0 ? day : ''}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div 
                  key={`week-${weekIndex}`}
                  className="flex flex-col gap-1"
                >
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${day.date}-${dayIndex}`}
                      className={`h-3 w-3 rounded-sm ${day.colorClass} transition-colors cursor-pointer relative group`}
                      style={{ minHeight: '12px' }}
                      title={day.date ? `${day.date}: ${day.totalExercises} exercises, ${day.avgAccuracy.toFixed(0)}% avg` : ''}
                    >
                      {/* Tooltip */}
                      {day.date && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                            <div className="font-semibold">{new Date(day.date).toLocaleDateString()}</div>
                            <div>Exercises: {day.totalExercises}</div>
                            <div>Avg Score: {day.avgAccuracy.toFixed(0)}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-3 w-3 rounded-sm bg-green-300"></div>
        <div className="h-3 w-3 rounded-sm bg-green-400"></div>
        <div className="h-3 w-3 rounded-sm bg-green-500"></div>
        <div className="h-3 w-3 rounded-sm bg-green-600"></div>
        <span>More</span>
      </div>
    </div>
  );
}
