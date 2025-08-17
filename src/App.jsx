import React, { useEffect, useMemo, useState } from 'react'
import useDebouncedLocalStorage from './hooks/useDebouncedLocalStorage'
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

  useDebouncedLocalStorage(K.base, baseCny, 300)
  useDebouncedLocalStorage(K.rate, rate, 300)
  useDebouncedLocalStorage(K.logi, logistics, 300)
  useDebouncedLocalStorage(K.comm, commissionPct, 300)
  useDebouncedLocalStorage(K.mark, markupPct, 300)
  
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
  useEffect(()=>{
    const entry = { t:new Date().toLocaleString(), base:Number(baseCny), rate:Number(rate), logi:Number(logistics), comm:Number(commissionPct), mark:Number(markupPct), final:Math.round(calc.finalPrice) }
    const next=[entry, ...history].slice(0,10)
    setHistory(next)
    localStorage.setItem(K.hist, JSON.stringify(next))
    // eslint-disable-next-line
  },[calc.finalPrice])

  const [toast,setToast]=useState(null)
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
    ].join('\\n')
    await navigator.clipboard.writeText(fmtRUB(calc.finalPrice))
    setToast({type:'ok', msg:'Скопировано ✅'})
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
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm opacity-70">Финальная цена</div>
                  <motion.div
                    initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.35,ease:'easeOut'}}
                    className="mt-1 font-extrabold tracking-tight"
                    style={{fontSize:'clamp(34px, 6vw, 56px)', color:accentHex, textShadow:`0 0 16px ${accentHex}55`}}
                  >
                    {finalDisplay}
                  </motion.div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-2xl px-3 py-2 text-right text-xs" style={{border:`1px dashed ${accentHex}55`}}>
                    <div className="opacity-70">Наценка</div>
                    <div className="font-semibold">{Number(markupPct).toFixed(1)}% · {fmtRUB(calc.markupRub)}</div>
                  </div>
                  <button className="btn" onClick={copySummary}>Скопировать итог</button>
                </div>
              </div>
            </motion.div>

            <p className="mt-4 text-xs opacity-70">
              Формула: (База ¥ × курс ₽ + логистика + комиссия(¥→₽)) × (1 + наценка%). Пересчёт мгновенный, значения сохраняются в LocalStorage.
            </p>
          </section>
        </motion.div>

        <section className="card mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">История расчётов</h3>
            {history.length>0 && <button className="btn" onClick={()=>{localStorage.removeItem(K.hist); setHistory([])}}>Очистить</button>}
          </div>
          <ul className="mt-3 text-sm opacity-80 grid gap-1">
            {history.length===0 && <li>Пока пусто — сделайте расчёт.</li>}
            {history.map((h,i)=>(
              <li key={i} className="flex justify-between">
                <span>{h.t}</span>
                <span className="font-semibold">{fmtRUB(h.final)}</span>
              </li>
            ))}
          </ul>
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
