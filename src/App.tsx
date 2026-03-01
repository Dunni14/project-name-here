/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  ChevronRight, 
  Utensils, 
  Flame, 
  Target,
  Loader2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { MacroGoals, FoodItem, DailyLog } from './types';
import { parseFoodDescription } from './services/geminiService';
import { MacroRing } from './components/MacroRing';
import { cn } from './lib/utils';

const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65
};

export default function App() {
  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('macro_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goals, setGoals] = useState<MacroGoals>(() => {
    const saved = localStorage.getItem('macro_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    localStorage.setItem('macro_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('macro_goals', JSON.stringify(goals));
  }, [goals]);

  const currentDayLog = useMemo(() => {
    return logs.find(l => l.date === selectedDate) || { date: selectedDate, items: [] };
  }, [logs, selectedDate]);

  const totals = useMemo(() => {
    return currentDayLog.items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [currentDayLog]);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsParsing(true);
    const parsed = await parseFoodDescription(input);
    setIsParsing(false);

    if (parsed) {
      const newItem = parsed as FoodItem;
      setLogs(prev => {
        const existingLogIndex = prev.findIndex(l => l.date === selectedDate);
        if (existingLogIndex >= 0) {
          const newLogs = [...prev];
          newLogs[existingLogIndex] = {
            ...newLogs[existingLogIndex],
            items: [newItem, ...newLogs[existingLogIndex].items]
          };
          return newLogs;
        } else {
          return [...prev, { date: selectedDate, items: [newItem] }];
        }
      });
      setInput('');
    }
  };

  const removeFood = (id: string) => {
    setLogs(prev => prev.map(l => {
      if (l.date === selectedDate) {
        return { ...l, items: l.items.filter(i => i.id !== id) };
      }
      return l;
    }));
  };

  const macroPercentages = {
    calories: Math.min((totals.calories / goals.calories) * 100, 100),
    protein: Math.min((totals.protein / goals.protein) * 100, 100),
    carbs: Math.min((totals.carbs / goals.carbs) * 100, 100),
    fat: Math.min((totals.fat / goals.fat) * 100, 100),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-bottom border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Flame size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MacroTrack</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Nutrition Assistant</p>
            </div>
          </div>
          <button 
            onClick={() => setShowGoalEditor(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Date Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isActive = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-slate-900 text-white shadow-md scale-105" 
                    : "bg-white text-slate-600 hover:bg-slate-100"
                )}
              >
                {offset === 0 ? 'Today' : format(date, 'EEE, MMM d')}
              </button>
            );
          })}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calories Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="space-y-1 text-center md:text-left">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Daily Calories</span>
              <div className="flex items-baseline gap-2 justify-center md:justify-start">
                <h2 className="text-5xl font-black text-slate-900">{totals.calories}</h2>
                <span className="text-slate-400 font-medium">/ {goals.calories} kcal</span>
              </div>
              <p className="text-sm text-slate-500">
                {goals.calories - totals.calories > 0 
                  ? `${goals.calories - totals.calories} kcal remaining` 
                  : 'Daily goal reached!'}
              </p>
            </div>
            
            <div className="flex gap-6">
              <MacroRing 
                percentage={macroPercentages.protein} 
                color="#10b981" 
                label="Protein" 
                value={totals.protein} 
                unit="g" 
              />
              <MacroRing 
                percentage={macroPercentages.carbs} 
                color="#3b82f6" 
                label="Carbs" 
                value={totals.carbs} 
                unit="g" 
              />
              <MacroRing 
                percentage={macroPercentages.fat} 
                color="#f59e0b" 
                label="Fat" 
                value={totals.fat} 
                unit="g" 
              />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6 space-y-4"
          >
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Target size={18} className="text-emerald-500" />
              Daily Targets
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Protein', value: totals.protein, goal: goals.protein, color: 'bg-emerald-500' },
                { label: 'Carbs', value: totals.carbs, goal: goals.carbs, color: 'bg-blue-500' },
                { label: 'Fat', value: totals.fat, goal: goals.fat, color: 'bg-amber-500' },
              ].map((macro) => (
                <div key={macro.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">{macro.label}</span>
                    <span className="text-slate-900">{macro.value}g / {macro.goal}g</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((macro.value / macro.goal) * 100, 100)}%` }}
                      className={cn("h-full rounded-full", macro.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Add Food Input */}
        <div className="relative group">
          <form onSubmit={handleAddFood} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What did you eat? (e.g., '2 scrambled eggs and a piece of toast')"
              className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-6 py-4 pl-14 text-lg transition-all outline-none shadow-sm"
              disabled={isParsing}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              {isParsing ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
            </div>
            <button
              type="submit"
              disabled={isParsing || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-200"
            >
              <Plus size={24} />
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400 ml-2">
            Try: "A large chicken breast with 1 cup of brown rice"
          </p>
        </div>

        {/* Food Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Utensils size={18} className="text-emerald-500" />
              Food Log
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {currentDayLog.items.length} Items
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {currentDayLog.items.length > 0 ? (
              currentDayLog.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Utensils size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 capitalize">{item.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{item.servingSize} • {item.calories} kcal</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-600">{item.protein}g</span>
                        <span className="text-slate-400">PRO</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-blue-600">{item.carbs}g</span>
                        <span className="text-slate-400">CHO</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-amber-600">{item.fat}g</span>
                        <span className="text-slate-400">FAT</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFood(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Calendar size={32} />
                </div>
                <h4 className="font-bold text-slate-900">No entries yet</h4>
                <p className="text-sm text-slate-500">Log your first meal to start tracking!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Goal Editor Modal */}
      <AnimatePresence>
        {showGoalEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalEditor(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Edit Goals</h2>
                <button 
                  onClick={() => setShowGoalEditor(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(goals).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest capitalize">
                      {key} {key === 'calories' ? '(kcal)' : '(g)'}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setGoals({ ...goals, [key]: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-3 font-bold text-lg transition-all outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowGoalEditor(false)}
                className="w-full mt-8 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all"
              >
                Save Changes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
