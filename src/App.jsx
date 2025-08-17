import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'

const fmtRUB = (n) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(isFinite(n)?Math.round(n):0)
const fmtCNY = (n) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'CNY',maximumFractionDigits:2}).format(isFinite(n)?n:0)
const clamp = (n,min=0,max=1_000_000_000)=> (isFinite(n)?Math.min(Math.max(n,min),max):0)

const K = { theme:'sc.theme', accent:'sc.accent', base:'sc.base', rate:'sc.rate', logi:'sc.logi', comm:'sc.comm', mark:'sc.mark', hist:'sc.history' }

export default function App(){
  const [dark,setDark]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.theme)==='dark'
    }
    return false
  })
  const [accent,setAccent]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.accent) || 'purple'
    }
    return 'purple'
  })
  
  useEffect(()=>{ 
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.theme,dark?'dark':'light'); 
      document.documentElement.classList.toggle('dark',dark) 
    }
  },[dark])
  useEffect(()=>{ 
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.accent,accent) 
    }
  },[accent])
  
  const accentColors = {
    purple: { primary: '#8B5CF6', secondary: '#A78BFA', bg: 'from-purple-900 via-blue-900 to-indigo-900' },
    cyan: { primary: '#06B6D4', secondary: '#67E8F9', bg: 'from-cyan-900 via-teal-900 to-blue-900' },
    orange: { primary: '#F97316', secondary: '#FB923C', bg: 'from-orange-900 via-red-900 to-pink-900' },
    green: { primary: '#10B981', secondary: '#34D399', bg: 'from-emerald-900 via-green-900 to-teal-900' }
  }
  
  const currentAccent = accentColors[accent]

  // inputs as strings
  const [baseCny,setBaseCny]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.base) || '400'
    }
    return '400'
  })
  const [rate,setRate]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.rate) || '13.2'
    }
    return '13.2'
  })
  const [logistics,setLogistics]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.logi) || '1000'
    }
    return '1000'
  })
  const [commissionPct,setCommissionPct]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.comm) || '10'
    }
    return '10'
  })
  const [markupPct,setMarkupPct]=useState(()=> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(K.mark) || '50'
    }
    return '50'
  })

  // Save to localStorage
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.base,baseCny)
    }
  },[baseCny])
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.rate,rate)
    }
  },[rate])
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.logi,logistics)
    }
  },[logistics])
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.comm,commissionPct)
    }
  },[commissionPct])
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      localStorage.setItem(K.mark,markupPct)
    }
  },[markupPct])

  const calc = useMemo(()=>{
    const baseRub = clamp(Number(baseCny))*clamp(Number(rate))
    const commissionYuan = clamp(Number(baseCny))*clamp(Number(commissionPct))/100
    const commissionRub = commissionYuan*clamp(Number(rate))
    const cost = baseRub + clamp(Number(logistics)) + commissionRub
    const markupRub = cost * (clamp(Number(markupPct))/100)
    const finalPrice = cost + markupRub
    const profit = finalPrice - cost
    return { baseRub, commissionYuan, commissionRub, cost, markupRub, finalPrice, profit }
  },[baseCny,rate,logistics,commissionPct,markupPct])

  const mv = useMotionValue(calc.finalPrice)
  const finalDisplay = useTransform(mv, v => fmtRUB(v))
  useEffect(()=>{ const c=animate(mv, calc.finalPrice, {duration:0.4, ease:'easeOut'}); return ()=>c.stop() },[calc.finalPrice])

  // history
  const [history,setHistory]=useState(()=> { 
    if (typeof window !== 'undefined') {
      try { 
        return JSON.parse(localStorage.getItem(K.hist)||'[]') 
      } catch { 
        return [] 
      }
    }
    return []
  })
  
  const saveToHistory = async () => {
    const entry = { 
      t: new Date().toLocaleString(), 
      base: Number(baseCny), 
      rate: Number(rate), 
      logi: Number(logistics), 
      comm: Number(commissionPct), 
      mark: Number(markupPct), 
      final: Math.round(calc.finalPrice) 
    }
    
    setHistory(prev => {
      const next = [entry, ...prev].slice(0,10)
      if (typeof window !== 'undefined') {
        localStorage.setItem(K.hist, JSON.stringify(next))
      }
      return next
    })
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fmtRUB(calc.finalPrice))
        showToast('💰 Расчёт сохранён! Цена скопирована')
      } catch {
        showToast('💰 Расчёт сохранён!')
      }
    } else {
      showToast('💰 Расчёт сохранён!')
    }
  }

  const [toast,setToast]=useState(null)
  
  const showToast = (msg) => {
    setToast({msg})
    setTimeout(() => setToast(null), 2500)
  }

  const copySummary = async () => {
    const text = [
      '📦 Расчёт стоимости кроссовок',
      `База: ${fmtCNY(Number(baseCny))} × курс ${rate}`,
      `Перевод в ₽: ${fmtRUB(calc.baseRub)}`,
      `Комиссия (${commissionPct}% от базы): ${fmtCNY(calc.commissionYuan)} → ${fmtRUB(calc.commissionRub)}`,
      `Логистика: ${fmtRUB(Number(logistics))}`,
      `Себестоимость: ${fmtRUB(calc.cost)}`,
      `Наценка: ${Number(markupPct).toFixed(1)}% → ${fmtRUB(calc.markupRub)}`,
      `Прибыль: ${fmtRUB(calc.profit)}`,
      `💰 Итог: ${fmtRUB(calc.finalPrice)}`,
    ].join('\n')
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        showToast('📋 Детальный отчёт скопирован!')
      } catch {
        showToast('❌ Ошибка копирования')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-slate-900"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${currentAccent.primary}40, transparent 70%)`
          }}
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: `radial-gradient(circle, ${currentAccent.secondary}30, transparent 70%)`
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center text-lg"
                style={{ background: `linear-gradient(45deg, ${currentAccent.primary}, ${currentAccent.secondary})` }}
              >
                👟
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Sneaker Calculator Pro
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Colors */}
              <div className="flex gap-2 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                {Object.entries(accentColors).map(([key, colors]) => (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    className={`w-6 h-6 rounded-full transition-all ${accent === key ? 'ring-2 ring-white/50 scale-110' : 'hover:scale-105'}`}
                    style={{ background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})` }}
                  />
                ))}
              </div>
              
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDark(!dark)}
                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
              >
                {dark ? '☀️' : '🌙'}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-center">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                💼 Параметры расчёта
              </span>
            </h2>
            
            <div className="space-y-6">
              <InputField 
                label="Базовая стоимость (¥)" 
                value={baseCny} 
                onChange={setBaseCny} 
                icon="💰"
                accentColor={currentAccent.primary}
              />
              <InputField 
                label="Курс юаня (₽)" 
                value={rate} 
                onChange={setRate} 
                step="0.01" 
                icon="📈"
                accentColor={currentAccent.primary}
              />
              <InputField 
                label="Логистика (₽)" 
                value={logistics} 
                onChange={setLogistics} 
                icon="🚚"
                accentColor={currentAccent.primary}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Комиссия (%)" 
                  value={commissionPct} 
                  onChange={setCommissionPct} 
                  step="0.1" 
                  icon="🏦"
                  accentColor={currentAccent.primary}
                />
                <InputField 
                  label="Наценка (%)" 
                  value={markupPct} 
                  onChange={setMarkupPct} 
                  step="0.1" 
                  icon="📊"
                  accentColor={currentAccent.primary}
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveToHistory}
                className="w-full py-4 rounded-2xl font-semibold text-lg text-white shadow-2xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${currentAccent.primary}, ${currentAccent.secondary})`,
                  boxShadow: `0 10px 30px ${currentAccent.primary}40`
                }}
              >
                🧮 Рассчитать и сохранить
              </motion.button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-center">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                📊 Результаты
              </span>
            </h2>
            
            <div className="space-y-4 mb-8">
              <ResultRow label="Стоимость в юанях" value={fmtCNY(Number(baseCny))} />
              <ResultRow label="Перевод в рубли" value={fmtRUB(calc.baseRub)} />
              <ResultRow label={`Комиссия (${commissionPct}%)`} value={`${fmtCNY(calc.commissionYuan)} → ${fmtRUB(calc.commissionRub)}`} />
              <ResultRow label="Логистика" value={fmtRUB(Number(logistics))} />
              <ResultRow label="Себестоимость" value={fmtRUB(calc.cost)} />
              <ResultRow label="Прибыль" value={fmtRUB(calc.profit)} />
            </div>

            {/* Final Price Card */}
            <motion.div
              className="rounded-2xl p-6 text-center border"
              style={{
                background: `linear-gradient(135deg, ${currentAccent.primary}20, ${currentAccent.secondary}10)`,
                borderColor: `${currentAccent.primary}40`,
                boxShadow: `0 0 30px ${currentAccent.primary}20`
              }}
            >
              <div className="text-sm opacity-80 mb-2">Финальная цена</div>
              <motion.div
                className="text-4xl font-black mb-4"
                style={{ 
                  background: `linear-gradient(135deg, ${currentAccent.primary}, ${currentAccent.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {finalDisplay}
              </motion.div>
              
              <div className="flex gap-3">
                <button
                  onClick={copySummary}
                  className="flex-1 py-2 px-4 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm"
                >
                  📋 Копировать отчёт
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">💾 История расчётов</h3>
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(K.hist)
                  }
                  setHistory([])
                  showToast('🗑️ История очищена')
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all text-sm border border-red-500/40"
              >
                🗑️ Очистить
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <div className="text-6xl mb-4">📈</div>
              <p>История пуста</p>
              <p className="text-sm mt-2 opacity-70">Сделайте первый расчёт</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.slice(0, 5).map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div>
                    <div className="font-bold text-lg" style={{ color: currentAccent.primary }}>
                      {fmtRUB(item.final)}
                    </div>
                    <div className="text-sm opacity-70">{item.t}</div>
                  </div>
                  <div className="text-right text-sm opacity-80">
                    <div>База: {fmtCNY(item.base)}</div>
                    <div>Курс: {item.rate}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 text-white font-medium shadow-2xl">
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InputField({ label, value, onChange, step = '1', icon, accentColor }) {
  const [focused, setFocused] = useState(false)
  
  const handleChange = (e) => {
    let v = e.target.value
    if (v.length > 1 && v.startsWith('0')) {
      v = v.replace(/^0+/, '')
      if (v === '') v = '0'
    }
    onChange(v)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium opacity-90">
        <span>{icon}</span>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={handleChange}
          onFocus={() => {
            setFocused(true)
            if (value === '0') onChange('')
          }}
          onBlur={() => {
            setFocused(false)
            if (value === '') onChange('0')
          }}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 outline-none transition-all"
          style={{
            borderColor: focused ? accentColor : undefined,
            boxShadow: focused ? `0 0 0 2px ${accentColor}40` : undefined
          }}
          placeholder="0"
        />
      </div>
    </div>
  )
}

function ResultRow({ label, value }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
      <span className="text-sm opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
