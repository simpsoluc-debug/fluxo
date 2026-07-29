'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Conta = {
  id: any
  nome: string
  tipo: string
  categoria: string
  fornecedor_cliente: string
  valor: number
  emissao: string
  vencimento: string
  forma_pagamento: string
  status: string
}

export default function PagarPage(){
  const [contas,setContas]=useState<Conta[]>([])
  const [busca,setBusca]=useState('')
  const [statusFiltro,setStatusFiltro]=useState('todos')
  const [catFiltro,setCatFiltro]=useState('todas')
  const [mes,setMes]=useState('2026-07')

  useEffect(()=>{ load() },[])
  async function load(){
    const { data } = await supabase.from('contas').select('*').eq('tipo','pagar').order('vencimento',{ascending:true})
    if(data) setContas(data as any)
  }

  async function excluir(id:any){
    if(!confirm('Excluir lançamento?')) return
    await supabase.from('contas').delete().eq('id',id)
    setContas(contas.filter(c=>c.id!==id))
  }

  async function togglePago(c:Conta){
    const novo = c.status==='pago'? 'pendente' : 'pago'
    await supabase.from('contas').update({status:novo}).eq('id',c.id)
    setContas(contas.map(x=> x.id===c.id? {...x,status:novo} : x))
  }

  const filtradas = contas.filter(c=>{
    if(statusFiltro!=='todos'){
      if(statusFiltro==='aberto' && c.status!=='pendente') return false
      if(statusFiltro==='vencido' && c.status!=='vencida' && new Date(c.vencimento) >= new Date()) return false
      if(statusFiltro!=='aberto' && statusFiltro!=='vencido' && c.status!==statusFiltro) return false
    }
    if(catFiltro!=='todas' && (c.categoria||'').toLowerCase()!==catFiltro) return false
    if(busca &&! (c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.fornecedor_cliente?.toLowerCase().includes(busca.toLowerCase()))) return false
    if(mes && c.vencimento &&!c.vencimento.startsWith(mes)) return false
    return true
  })

  const saldoMes = filtradas.filter(c=>c.status!=='pago').reduce((a,c)=>a+Number(c.valor||0),0)

  function formatBR(d:string){
    if(!d) return '-'
    try{ return new Date(d).toLocaleDateString('pt-BR') } catch{ return d }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* HEADER igual da imagem */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text- text-slate-900">Contas a pagar</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>📅</span> {mes} • R$ {saldoMes.toFixed(2).replace('.',',')} de saldo previsto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
            <span>📅</span>
            <input type="month" value={mes} onChange={e=>setMes(e.target.value)} className="outline-none bg-transparent text-sm"/>
          </div>
          <div className="bg-[#f0fdf4] border border-green-200 rounded-xl px-4 py-2 text-xs">
            <p className="text- tracking-widest text-slate-500">SALDO DO MÊS</p>
            <p className="font-bold text-green-700 flex items-center gap-2 text-">
              R$ {saldoMes.toFixed(2).replace('.',',')}
              <span className="w-5 h-5 rounded-full bg-green-100 grid place-items-center text-">↗</span>
            </p>
          </div>
        </div>
      </div>

      {/* CARD com filtros + tabela igual da foto */}
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex gap-3 items-center border-b border-slate-100 flex-wrap">
            <div className="flex-1 relative min-w-">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, fornecedor, descrição..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text- outline-none focus:bg-white focus:border-violet-300"/>
            </div>
            <select value={statusFiltro} onChange={e=>setStatusFiltro(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text- bg-white">
              <option value="todos">Todos status</option>
              <option value="aberto">Aberto</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
            </select>
            <select value={catFiltro} onChange={e=>setCatFiltro(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text- bg-white">
              <option value="todas">Todas categorias</option>
              <option value="conta">Conta</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="fatura_cartao">Fatura Cartão</option>
              <option value="boleto">Boleto</option>
            </select>
            <a href="/nova?tipo=pagar" className="ml-auto bg-[#15152b] text-white px-5 py-2.5 rounded-xl text- font-medium hover:bg-black">+ Novo a pagar</a>
          </div>

          <table className="w-full text-">
            <thead className="text- text-slate-500 tracking-widest border-b border-slate-100">
              <tr>
                <th className="text-left font-medium p-4">NOME / FORNECEDOR</th>
                <th className="text-left font-medium">CATEGORIA</th>
                <th className="text-left font-medium">EMISSÃO</th>
                <th className="text-left font-medium">VENCIMENTO</th>
                <th className="text-right font-medium pr-4">VALOR</th>
                <th className="text-left font-medium pl-6">STATUS</th>
                <th className="text-right font-medium pr-4">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c=>{
                const isVencido = c.status!=='pago' && new Date(c.vencimento) < new Date()
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#15152b] text-white grid place-items-center text-xs">↘</div>
                      <div>
                        <p className="font-medium text-slate-900">{c.nome}</p>
                        <p className="text- text-slate-500">{c.fornecedor_cliente||'Sem fornecedor'} • {c.forma_pagamento||'boleto'} • 1x</p>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text- font-medium border ${c.categoria==='fornecedor'?'bg-violet-50 text-violet-700 border-violet-200': c.categoria==='fatura_cartao'?'bg-indigo-50 text-indigo-700 border-indigo-200':'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {c.categoria==='fatura_cartao'?'Fatura Cartão': c.categoria? c.categoria.charAt(0).toUpperCase()+c.categoria.slice(1) : 'Conta'}
                      </span>
                    </td>
                    <td className="text-slate-600">{formatBR(c.emissao)}</td>
                    <td className="text-slate-800 font-medium">{formatBR(c.vencimento)}</td>
                    <td className="text-right pr-4 font-bold text-slate-900">R$ {Number(c.valor).toFixed(2).replace('.',',')}</td>
                    <td className="pl-6">
                      <span className={`px-2.5 py-1 rounded-full text- font-medium border ${isVencido?'bg-red-50 text-red-700 border-red-200': c.status==='pago'?'bg-green-50 text-green-700 border-green-200':'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {c.status==='pago'?'Pago': isVencido?'Vencido':'Aberto'}
                      </span>
                    </td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={()=>togglePago(c)} title="Marcar como pago" className="w-7 h-7 rounded-full border border-slate-200 bg-white grid place-items-center hover:bg-slate-50 text-">⌄</button>
                        <button onClick={()=>window.location.href=`/nova?edit=${c.id}`} className="w-7 h-7 rounded-full border border-slate-200 bg-white grid place-items-center hover:bg-slate-50 text-">✎</button>
                        <button onClick={()=>excluir(c.id)} className="w-7 h-7 rounded-full border border-slate-200 bg-white grid place-items-center hover:bg-red-50 text-">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtradas.length===0 && (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm">Nenhuma conta encontrada. Crie em + Novo a pagar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
