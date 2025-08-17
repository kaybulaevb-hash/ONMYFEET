import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'

const fmtRUB = (n) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(isFinite(n)?Math.round(n):0)
const fmtCNY = (n) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'CNY',maximumFractionDigits:2}).format(isFinite(n)?n:0)
const clamp = (n,min=0,max=1_000_000_000)=> (isFinite(n)?Math.min(Math.max(n,min),max):0)

const K = { theme:'sc.theme', accent:'sc.accent', base:'sc.base', rate:'sc.rate', logi:'sc.logi', comm:'sc.comm', mark:'sc.mark', hist:'sc.history' }

export default function App(){
  const [dark,setDark]=useState(()=> localStorage.getItem(K.theme)==='dark')
  const [accent,setAccent]=useState(()=> localStorage.getItem(K.accent) || 'green')
  useEffect(()=>{ localStorage.setItem(K.theme,dark?'dark':'light'); document.documentElement.classList.toggle('dark',dark) },[dark])
  useEffect(()=>{ localStorage.setItem(K.accent,accent) },[accent])
  const accentHex = accent==='green' ? '#00ff88' : '#ff4444'

  // inputs as strings (to control leading zero behavior)
  const [baseCny,setBaseCny]=useState(()=> localStorage.getItem(K.base) || '400')
  const [rate,setRate]=useState(()=> localStorage.getItem(K.rate) || '13.2')
  const [logistics,setLogistics]=useState(()=> localStorage.getItem(K.logi) || '1000')
  const [commissionPct,setCommissionPct]=useState(()=> localStorage.getItem(K.comm) || '10')
  const [markupPct,setMarkupPct]=useState(()=> localStorage.getItem(K.mark) || '50')

  // Immediate localStorage updates for individual fields (for persistence)
  useEffect(()=>localStorage.setItem(K.base,baseCny),[baseCny])
  useEffect(()=>localStorage.setItem(K.rate,rate),[rate])
  useEffect(()=>localStorage.setItem(K.logi,logistics),[logistics])
  useEffect(()=>localStorage.setItem(K.comm,commissionPct),[commissionPct])
  useEffect(()=>localStorage.setItem(K.mark,markupPct),[markupPct])

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
  useEffect(()=>{ const c=animate(mv, calc.finalPrice, {duration:0.35, ease:'easeOut'}); return ()=>c.stop() },[calc.finalPrice])

  // history
  const [history,setHistory]=useState(()=> { try { return JSON.parse(localStorage.getItem(K.hist)||'[]') } catch { return [] } })
  
  // Manual calculation save to history
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
      localStorage.setItem(K.hist, JSON.stringify(next))
      return next
    })
    
    // Auto-copy final price to clipboard
    await navigator.clipboard.writeText(fmtRUB(calc.finalPrice))
    showToast('Расчёт сохранён! Цена скопирована 💰')
  }

  const [toast,setToast]=useState(null)
  
  const showToast = (msg) => {
    setToast({type:'ok', msg})
    setTimeout(() => setToast(null), 2000)
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
    await navigator.clipboard.writeText(text)
    showToast('Скопировано ✅')
  }

  const copyCostPrice = async () => {
    const text = `Себестоимость: ${fmtRUB(calc.cost)}`
    await navigator.clipboard.writeText(text)
    showToast('Себестоимость скопирована ✅')
  }

  return (
    <div style={{'--accent':accentHex}}>
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-950/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full" style={{background:accentHex}} />
            <h1 className="text-2xl font-semibold tracking-tight">Sneaker Price Calculator</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs opacity-90">
              <button className={`rounded-full px-2 py-1 ${ (localStorage.getItem(K.accent)||'green')==='green' ? 'font-semibold':'opacity-60'}`} onClick={()=>setAccent('green')}>#00ff88</button>
              <span className="opacity-40">/</span>
              <button className={`rounded-full px-2 py-1 ${ (localStorage.getItem(K.accent)||'green')==='red' ? 'font-semibold':'opacity-60'}`} onClick={()=>setAccent('red')}>#ff4444</button>
            </div>
            <button onClick={()=>setDark(v=>!v)} className="btn">{dark?'Светлая':'Тёмная'}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-lg font-semibold">Ввод данных</h2>
            <div className="grid gap-3">
              <InputNumber label="Базовая стоимость (¥)" value={baseCny} onChange={setBaseCny} />
              <InputNumber label="Курс юаня к рублю (₽)" value={rate} onChange={setRate} step="0.01" />
              <InputNumber label="Логистика (₽)" value={logistics} onChange={setLogistics} />
              <div className="grid grid-cols-2 gap-3">
                <InputNumber label="Комиссия посредника (%)" value={commissionPct} onChange={setCommissionPct} step="0.1" />
                <InputNumber label="Наценка (%)" value={markupPct} onChange={setMarkupPct} step="0.1" />
              </div>
              
              {/* Main Calculate Button */}
              <motion.button 
                onClick={saveToHistory}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full rounded-2xl px-6 py-4 text-lg font-semibold shadow-lg transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${accentHex}, ${accentHex}dd)`,
                  color: '#fff',
                  boxShadow: `0 8px 20px -4px ${accentHex}55, 0 4px 12px -2px ${accentHex}33`
                }}
              >
                🧮 Рассчитать и сохранить
              </motion.button>
              
              {/* Secondary Action */}
              <button 
                className="mt-2 w-full text-sm opacity-70 hover:opacity-100 transition-opacity underline underline-offset-2" 
                onClick={copyCostPrice}
              >
                Скопировать себестоимость ({fmtRUB(calc.cost)})
              </button>
            </div>
          </section>

          <section className="card">
            <h2 className="mb-4 text-lg font-semibold">Результаты</h2>
            <div className="grid gap-3">
              <Row label="Стоимость в юанях" value={fmtCNY(Number(baseCny))} />
              <Row label="Перевод в рубли" value={fmtRUB(calc.baseRub)} />
              <Row label={`Комиссия (${commissionPct}% от базы)`} value={`${fmtCNY(calc.commissionYuan)} → ${fmtRUB(calc.commissionRub)}`} />
              <Row label="Логистика" value={fmtRUB(Number(logistics))} />
              <Row label="Себестоимость" value={fmtRUB(calc.cost)} />
              <Row label="Прибыль" value={fmtRUB(calc.profit)} />
            </div>

            <motion.div layout className="mt-5 rounded-2xl p-4 shadow-md"
              style={{border:`1px solid ${accentHex}33`, boxShadow:`0 8px 28px -8px ${accentHex}55, inset 0 0 0 1px ${accentHex}1a`,
                background:'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))'}}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm opacity-70">Финальная цена</div>
                  <motion.div
                    initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.35,ease:'easeOut'}}
                    className="mt-1 font-extrabold tracking-tight"
                    style={{fontSize:'clamp(28px, 5vw, 42px)', color:accentHex, textShadow:`0 0 16px ${accentHex}55`}}
                  >
                    {finalDisplay}
                  </motion.div>
                  <div className="mt-2 text-xs opacity-60">
                    Прибыль: <span className="font-semibold">{fmtRUB(calc.profit)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="rounded-xl px-4 py-3 text-right text-sm border-2" style={{borderColor:`${accentHex}44`, background:`${accentHex}08`}}>
                    <div className="opacity-70 text-xs">Наценка</div>
                    <div className="font-bold text-lg" style={{color:accentHex}}>{Number(markupPct).toFixed(1)}%</div>
                    <div className="font-semibold text-sm mt-1">{fmtRUB(calc.markupRub)}</div>
                  </div>
                  <button className="text-xs px-3 py-1 rounded-lg border opacity-70 hover:opacity-100 transition-opacity" onClick={copySummary}>
                    📋 Детальный отчёт
                  </button>
                </div>
              </div>
            </motion.div>

            <p className="mt-4 text-xs opacity-60">
              💡 Расчёты обновляются мгновенно. Нажмите кнопку выше для сохранения в историю.
            </p>
          </section>
        </motion.div>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">💾 История расчётов</h3>
            {history.length>0 && <button className="text-xs px-3 py-1 rounded-lg border opacity-70 hover:opacity-100 transition-opacity" onClick={()=>{localStorage.removeItem(K.hist); setHistory([])}}>🗑️ Очистить</button>}
          </div>
          {history.length===0 ? (
            <div className="mt-4 text-center py-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 opacity-50">
              <div className="text-sm">История пуста</div>
              <div className="text-xs mt-1">Нажмите "Рассчитать и сохранить" чтобы добавить запись</div>
            </div>
          ) : (
            <ul className="mt-3 text-sm opacity-90 grid gap-2">
              {history.map((h,i)=>(
                <li key={i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
                  <div>
                    <div className="font-medium">{fmtRUB(h.final)}</div>
                    <div className="text-xs opacity-70">{h.t}</div>
                  </div>
                  <div className="text-xs opacity-60 text-right">
                    <div>База: {fmtCNY(h.base)}</div>
                    <div>Курс: {h.rate}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:40,opacity:0}} transition={{duration:0.25}}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-full px-4 py-2 text-sm shadow-lg" style={{background:'#202e1e',color:'#fff'}}>
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InputNumber({label,value,onChange,step='1'}){
  const [focused,setFocused]=useState(false)
  const handleChange=(e)=>{
    let v=e.target.value
    if(v.length>1 && v.startsWith('0')){ v=v.replace(/^0+/,''); if(v==='') v='0' }
    onChange(v)
  }
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm opacity-70">
        <span>{label}</span>
      </div>
      <input type="number" step={step} value={value}
        onChange={handleChange}
        onFocus={()=>{setFocused(true); if(value==='0') onChange('')}}
        onBlur={()=>{setFocused(false); if(value==='') onChange('0')}}
        className="w-full rounded-2xl border border-neutral-200/70 bg-transparent px-4 py-3 text-base outline-none transition placeholder:opacity-40 focus:border-transparent dark:border-neutral-800"
        style={{ boxShadow: focused ? `0 0 0 2px var(--accent)` : undefined }}
        placeholder="0"
      />
    </label>
  )
}

function Row({label,value}){
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-50/60 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/40">
      <span className="opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
