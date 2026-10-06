import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { getMyDolls, addDoll, updateDoll, deleteDoll, type Doll } from '../api/doll'
import { getMyCabinets, createCabinet, updateCabinet, deleteCabinet, type CabinetInfo } from '../api/cabinet'
import { publishDynamic } from '../api/dynamic'
import DollDetailModal from '../components/DollDetailModal'

/**
 * 我的展示柜：两层结构
 * 第一层：娃柜列表（封面 + 名称 + 数量/总价），点进柜子看娃娃
 * 第二层：柜内娃娃（添加/编辑/移除 + 时间）
 * 内联新建/重命名/删除，不弹原生对话框
 * 路由守卫已保证仅普通用户可进入
 */
function Cabinet() {
  const [dolls, setDolls] = useState<Doll[]>([])
  const [cabinets, setCabinets] = useState<CabinetInfo[]>([])
  // null = 娃柜列表视图；数字 = 柜内娃娃视图
  const [activeCabinetId, setActiveCabinetId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  // 表单是否展开（按钮式）
  const [showForm, setShowForm] = useState(false)
  // 新建柜子输入
  const [creatingCab, setCreatingCab] = useState(false)
  const [newCabName, setNewCabName] = useState('')
  // 新建柜子可见性：0公开 1仅自己可见
  const [newCabVisible, setNewCabVisible] = useState(0)
  // 重命名中的柜子
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState('')
  // 删除两段确认中的柜子
  const [confirmDelId, setConfirmDelId] = useState<number | null>(null)
  // 娃娃详情弹窗
  const [detailId, setDetailId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [buyChannel, setBuyChannel] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [visible, setVisible] = useState(0) // 0公开 1仅自己可见
  const [cabinetId, setCabinetId] = useState<number | null>(null)
  // 添加娃娃时同步发布动态（默认勾上；私密娃娃/私密柜自动取消）
  const [syncPublish, setSyncPublish] = useState(true)
  // 同步发布确认卡片：{ image, dollId } + 可编辑文案 pubContent
  const [pubCard, setPubCard] = useState<{ image: string; dollId?: number } | null>(null)
  const [pubContent, setPubContent] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const dollRes: any = await getMyDolls()
    if (dollRes.code === 200) setDolls(dollRes.data)
    const cabRes: any = await getMyCabinets()
    if (cabRes.code === 200) {
      setCabinets(cabRes.data)
      setActiveCabinetId((prev) => (prev === null ? prev : prev))
    }
  }

  const resetForm = (cabId?: number | null) => {
    setEditingId(null)
    setName('')
    setType('')
    setImageUrl('')
    setBuyChannel('')
    setDescription('')
    setPrice('')
    setVisible(0)
    setCabinetId(cabId ?? activeCabinetId)
    setSyncPublish(true)
    setPubCard(null)
    setPubContent('')
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('给娃娃起个名字吧')
      return
    }
    const data: Partial<Doll> = {
      name,
      type,
      imageUrl,
      buyChannel,
      description,
      price: price ? Number(price) : undefined,
      visible,
      cabinetId: cabinetId ?? undefined
    }
    if (editingId) {
      await updateDoll(editingId, data)
      resetForm()
      setShowForm(false)
      load()
      return
    }
    const res: any = await addDoll(data)
    if (res.code !== 200) {
      alert(res.message || '添加失败')
      return
    }
    // 勾选了「同时发布动态」且娃娃/柜子不是私密 → 先记录文案，再重置表单后展开确认卡片
    const newDollId = res.data as number | undefined
    const privateCab = cabinetId != null ? cabinets.find((c) => c.id === cabinetId) : undefined
    const shouldPublish = syncPublish && visible !== 1 && privateCab?.visible !== 1
    const pubText = `新入娃「${name.trim()}」${type ? `（${type}）` : ''}，欢迎来看～`
    const pubImg = imageUrl || ''
    resetForm()
    setShowForm(false)
    if (shouldPublish) {
      setPubContent(pubText)
      setPubCard({ image: pubImg, dollId: newDollId })
    }
    load()
  }

  // 确认发布同步动态（关联新娃娃，动态下会挂娃娃小卡片）
  const handlePublishDynamic = async () => {
    if (!pubCard) return
    if (!pubContent.trim()) {
      alert('写点什么再发布吧')
      return
    }
    await publishDynamic({
      content: pubContent.trim(),
      images: pubCard.image || undefined,
      dollId: pubCard.dollId
    })
    setPubCard(null)
    setPubContent('')
    alert('动态已发布 🎉')
  }

  const handleEdit = (d: Doll) => {
    setEditingId(d.id)
    setName(d.name)
    setType(d.type || '')
    setImageUrl(d.imageUrl || '')
    setBuyChannel(d.buyChannel || '')
    setDescription(d.description || '')
    setPrice(d.price != null ? String(d.price) : '')
    setVisible(d.visible ?? 0)
    setCabinetId(d.cabinetId ?? activeCabinetId)
    setShowForm(true)
  }

  const handleDeleteDoll = async (d: Doll) => {
    await deleteDoll(d.id)
    load()
  }

  // 新建柜子（内联输入 + 可见性选择）
  const handleCreateCabinet = async () => {
    if (!newCabName.trim()) return
    await createCabinet(newCabName.trim(), newCabVisible)
    setNewCabName('')
    setNewCabVisible(0)
    setCreatingCab(false)
    load()
  }

  // 重命名柜子（内联输入）
  const handleRename = async () => {
    if (!renameVal.trim() || renamingId === null) return
    await updateCabinet(renamingId, renameVal.trim())
    setRenamingId(null)
    load()
  }

  // 切换柜子可见性：公开 ⇄ 仅自己可见
  const handleToggleVisible = async (c: CabinetInfo) => {
    const next = c.visible === 1 ? 0 : 1
    await updateCabinet(c.id, undefined, next)
    load()
  }

  // 删除柜子（两段确认）
  const handleDeleteCabinet = async (c: CabinetInfo) => {
    if (confirmDelId !== c.id) {
      setConfirmDelId(c.id)
      return
    }
    setConfirmDelId(null)
    await deleteCabinet(c.id)
    setActiveCabinetId(null)
    load()
  }

  // 某柜子的封面图（取柜内第一只娃娃）
  const coverOf = (c: CabinetInfo) => {
    const first = dolls.find((d) => d.cabinetId === c.id)
    return first?.imageUrl
  }

  const activeCabinet = activeCabinetId === null ? null : cabinets.find((c) => c.id === activeCabinetId) || null
  const filteredDolls = activeCabinetId === null
    ? dolls
    : dolls.filter((d) => d.cabinetId === activeCabinetId)

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        {/* ============ 第一层：娃柜列表 ============ */}
        {activeCabinetId === null && (
          <>
            <div style={styles.listHeader}>
              <h2 style={{ margin: 0, fontSize: 20 }}>我的娃柜</h2>
              {creatingCab ? (
                <span style={styles.renameBox}>
                  <input
                    style={styles.renameInput}
                    autoFocus
                    placeholder="柜子名称"
                    value={newCabName}
                    onChange={(e) => setNewCabName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCabinet()}
                  />
                  <span style={styles.opsOk} onClick={handleCreateCabinet}>✓</span>
                  <span style={styles.opsCancel} onClick={() => { setCreatingCab(false); setNewCabName(''); setNewCabVisible(0) }}>✗</span>
                </span>
              ) : (
                <button style={styles.newCabinetBtn} onClick={() => setCreatingCab(true)}>+ 新建柜子</button>
              )}
            </div>

            {/* 新建柜子时的可见性选择 */}
            {creatingCab && (
              <div style={styles.createCabRow}>
                <span style={newCabVisible === 0 ? styles.visActive : styles.visOpt} onClick={() => setNewCabVisible(0)}>
                  🌐 公开
                </span>
                <span style={newCabVisible === 1 ? styles.visActive : styles.visOpt} onClick={() => setNewCabVisible(1)}>
                  🔒 仅自己可见
                </span>
              </div>
            )}

            {cabinets.length === 0 && (
              <p style={{ color: '#999', marginTop: 40, textAlign: 'center' }}>
                还没有娃柜～点右上角「+ 新建柜子」建第一个吧
              </p>
            )}

            <div style={styles.cabGrid}>
              {cabinets.map((c) => {
                const cover = coverOf(c)
                const totalDolls = dolls.filter((d) => d.cabinetId === c.id).length
                // 重命名态
                if (renamingId === c.id) {
                  return (
                    <div key={c.id} style={styles.cabCard}>
                      <div style={styles.cabCover}>✏️ 重命名</div>
                      <div style={styles.cabBody}>
                        <input
                          style={styles.renameInput}
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button style={styles.btnSmall} onClick={handleRename}>确定</button>
                          <button style={styles.btnSmallGray} onClick={() => setRenamingId(null)}>取消</button>
                        </div>
                      </div>
                    </div>
                  )
                }
                // 删除确认态
                if (confirmDelId === c.id) {
                  return (
                    <div key={c.id} style={styles.cabCard} onClick={() => handleDeleteCabinet(c)}>
                      <div style={styles.cabCoverDanger}>🗑️</div>
                      <div style={styles.cabBody}>
                        <div style={{ fontWeight: 700, color: '#ff3b5c' }}>「{c.name}」确定删除？</div>
                        <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>柜内娃娃会自动移到「全部柜子」，再点一次确认</div>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={c.id} style={styles.cabCard} onClick={() => setActiveCabinetId(c.id)}>
                    {cover ? (
                      <img src={cover} alt={c.name} style={styles.cabCoverImg} />
                    ) : (
                      <div style={styles.cabCover}>🐻</div>
                    )}
                    <div style={styles.cabBody}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</span>
                        {c.visible === 1 && <span title="仅自己可见" style={{ fontSize: 15 }}>🔒</span>}
                        <span
                          style={styles.cabOps}
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenamingId(c.id)
                            setRenameVal(c.name)
                          }}
                          title="重命名"
                        >
                          ✏️
                        </span>
                        <span
                          style={styles.cabOps}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCabinet(c)
                          }}
                          title="删除柜子"
                        >
                          🗑️
                        </span>
                      </div>
                      <div style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                        {totalDolls} 只 · ¥{c.totalPrice ?? 0}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: 14, color: '#bbb' }}>点击查看柜内娃娃 →</span>
                        <span
                          style={styles.visToggle}
                          onClick={(e) => { e.stopPropagation(); handleToggleVisible(c) }}
                          title={c.visible === 1 ? '当前仅自己可见，点击改为公开' : '当前公开，点击改为仅自己可见'}
                        >
                          {c.visible === 1 ? '🔒 私密' : '🌐 公开'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ============ 第二层：柜内娃娃 ============ */}
        {activeCabinetId !== null && (
          <>
            <div style={styles.innerHeader}>
              <button style={styles.backBtn} onClick={() => { setActiveCabinetId(null); setShowForm(false) }}>← 我的娃柜</button>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{activeCabinet?.name || '柜子'}</span>
              {activeCabinet?.visible === 1 && <span title="仅自己可见" style={{ fontSize: 15 }}>🔒</span>}
              <span style={{ fontSize: 15, color: 'var(--accent)', fontWeight: 600 }}>
                {filteredDolls.length} 只 · ¥{activeCabinet?.totalPrice ?? 0}
              </span>
              <button
                style={styles.addDollBtn}
                onClick={() => {
                  resetForm(activeCabinetId)
                  setShowForm(!showForm)
                }}
              >
                {showForm ? '收起表单' : '➕ 添加娃娃'}
              </button>
            </div>

            <div style={styles.body}>
              {/* 左侧表单（按钮展开） */}
              {showForm && (
                <div style={styles.formCol}>
                  <div style={styles.card}>
                    <h3 style={{ marginBottom: 12 }}>{editingId ? '编辑娃娃' : `添加到「${activeCabinet?.name}」`}</h3>
                    <div style={styles.formHint}>带 * 为必填，其余选填；图片建议填，用作柜子封面和动态配图</div>
                    <input style={styles.input} placeholder="娃娃名字 *（必填）" value={name} onChange={(e) => setName(e.target.value)} />
                    <div style={styles.fieldLabel}>所属柜子（选填，默认当前柜）</div>
                    <select
                      style={styles.input}
                      value={cabinetId ?? ''}
                      onChange={(e) => setCabinetId(e.target.value ? Number(e.target.value) : null)}
                    >
                      {cabinets.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input style={styles.input} placeholder="种类（选填，如 BJD/棉花娃/毛绒）" value={type} onChange={(e) => setType(e.target.value)} />
                    <input style={styles.input} placeholder="图片URL（选填，推荐填：封面和动态配图用它）" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    <input style={styles.input} placeholder="购入渠道（选填）" value={buyChannel} onChange={(e) => setBuyChannel(e.target.value)} />
                    <input style={styles.input} placeholder="价格（选填，单位：元）" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                    <textarea style={styles.textarea} placeholder="介绍/故事（选填）" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <label style={styles.switchRow}>
                      <input type="checkbox" checked={visible === 1} onChange={(e) => setVisible(e.target.checked ? 1 : 0)} />
                      <span>🔒 仅自己可见（他人看不到这只娃娃）</span>
                    </label>
                    {!editingId && (
                      <>
                        <label style={styles.switchRow}>
                          <input
                            type="checkbox"
                            checked={syncPublish}
                            disabled={visible === 1 || (cabinetId != null && cabinets.find((c) => c.id === cabinetId)?.visible === 1)}
                            onChange={(e) => setSyncPublish(e.target.checked)}
                          />
                          <span>📣 同时发布动态（晒晒新娃～）</span>
                        </label>
                        {(visible === 1 || (cabinetId != null && cabinets.find((c) => c.id === cabinetId)?.visible === 1)) && (
                          <div style={styles.hint}>私密内容不会同步发布动态哦</div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button style={styles.btn} onClick={handleSave}>{editingId ? '保存修改' : '添加'}</button>
                      {editingId && <button style={styles.btnGray} onClick={() => { resetForm(); setShowForm(false) }}>取消</button>}
                    </div>
                  </div>
                </div>
              )}

              {/* 同步发布确认卡片：娃娃添加成功后展开，可补一句心情再发布 */}
              {pubCard && (
                <div style={styles.card}>
                  <h3 style={{ marginBottom: 12 }}>📣 同步发布动态</h3>
                  <textarea
                    style={styles.textarea}
                    value={pubContent}
                    onChange={(e) => setPubContent(e.target.value)}
                    placeholder="写点心情..."
                  />
                  {pubCard.image && <img src={pubCard.image} alt="新娃" style={styles.pubImg} />}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button style={styles.btn} onClick={handlePublishDynamic}>发布动态</button>
                    <button style={styles.btnGray} onClick={() => { setPubCard(null); setPubContent('') }}>跳过</button>
                  </div>
                </div>
              )}

              {/* 右侧娃娃卡片 */}
              <div style={styles.listCol}>
                {filteredDolls.length === 0 && (
                  <p style={{ color: '#999', marginTop: 40, textAlign: 'center' }}>
                    这个柜子还空着，点「➕ 添加娃娃」加第一只吧～
                  </p>
                )}
                <div style={styles.grid}>
                  {filteredDolls.map((d) => (
                    <div key={d.id} style={styles.dollCard} onClick={() => setDetailId(d.id)}>
                      {d.imageUrl ? (
                        <img src={d.imageUrl} alt={d.name} style={styles.dollImg} />
                      ) : (
                        <div style={styles.dollPlaceholder}>🐻</div>
                      )}
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {d.name}
                        {d.visible === 1 && <span style={{ fontSize: 14 }}>🔒</span>}
                      </div>
                      <div style={{ fontSize: 15, color: '#888' }}>{d.type || '未分类'}</div>
                      {d.price != null && (
                        <div style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
                          ¥{d.price}
                        </div>
                      )}
                      {d.buyChannel && <div style={{ fontSize: 14, color: '#aaa' }}>来源：{d.buyChannel}</div>}
                      {d.createdAt && (
                        <div style={{ fontSize: 14, color: '#bbb', marginTop: 2 }}>
                          🕐 {d.createdAt.replace('T', ' ').slice(0, 16)}
                        </div>
                      )}
                      {d.description && <div style={{ fontSize: 15, marginTop: 6 }}>{d.description}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button style={styles.btnSmall} onClick={(e) => { e.stopPropagation(); handleEdit(d) }}>编辑</button>
                        <button style={styles.btnSmallGray} onClick={(e) => { e.stopPropagation(); handleDeleteDoll(d) }}>移除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <DollDetailModal dollId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page:{ width:'100%', maxWidth:'100%', margin:'0 auto', padding:'34px 28px 60px' },
  listHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 },
  newCabinetBtn:{ padding:'9px 16px', borderRadius:11, border:'1px solid #f0cbd5', background: 'var(--surface)', color:'var(--accent-strong)', cursor:'pointer', fontSize: 15, fontWeight:700 },
  createCabRow:{ display:'flex', gap:8, marginBottom:18 },
  visOpt:{ padding:'7px 13px', borderRadius:10, border:'1px solid #ece4e6', background: 'var(--surface)', color:'var(--muted)', cursor:'pointer', fontSize: 14 },
  visActive:{ padding:'7px 13px', borderRadius:10, border:'1px solid #efb8c7', background:'var(--accent-soft)', color:'var(--accent-strong)', cursor:'pointer', fontSize: 14, fontWeight:700 },
  visToggle:{ fontSize:11, color:'var(--muted)', cursor:'pointer', padding:'4px 9px', borderRadius:8, border:'1px solid var(--line)', background: 'var(--surface)', whiteSpace:'nowrap' },
  cabGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:22 },
  cabCard:{ background: 'var(--surface)', borderRadius:20, overflow:'hidden', border:'1px solid var(--line)', boxShadow:'0 12px 30px rgba(78,48,58,.065)', cursor:'pointer', transition:'transform .16s ease, box-shadow .16s ease' },
  cabCover:{ height:190, background:'linear-gradient(135deg,var(--surface-soft),#f8e8ec)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 },
  cabCoverDanger:{ height:190, background:'#fff1f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:46 },
  cabCoverImg:{ width:'100%', height:190, objectFit:'cover', display:'block' },
  cabBody:{ padding:'14px 16px 16px' },
  cabOps:{ fontSize: 15, cursor:'pointer', opacity:.65 },
  renameBox:{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:11, background:'var(--surface-soft)', border:'1px solid var(--line)' },
  renameInput:{ width:145, padding:'7px 10px', borderRadius:9, border:'1px solid var(--line)', fontSize: 15, outline:'none' },
  opsOk:{ cursor:'pointer', color:'var(--accent-strong)', fontWeight:700, fontSize: 16 },
  opsCancel:{ cursor:'pointer', color:'#aaa', fontSize: 16 },
  innerHeader:{ display:'flex', alignItems:'center', gap:12, background: 'var(--surface)', borderRadius:17, padding:'13px 16px', marginBottom:18, border:'1px solid var(--line)', boxShadow:'0 6px 20px rgba(78,48,58,.05)' },
  backBtn:{ padding:'7px 11px', borderRadius:9, border:'none', background:'#f8f4f5', color:'var(--muted)', cursor:'pointer', fontSize: 15 },
  addDollBtn:{ padding:'9px 16px', borderRadius:11, border:'none', background:'var(--accent)', color:'#fff', fontSize: 15, fontWeight:700, cursor:'pointer', boxShadow:'0 5px 13px rgba(31,31,35,.18)', marginLeft:'auto' },
  body:{ display:'flex', gap:22, alignItems:'flex-start' },
  formCol:{ flex:'0 0 320px', position:'sticky', top:78 },
  listCol:{ flex:1, minWidth:0 },
  card:{ background: 'var(--surface)', borderRadius:17, padding:17, border:'1px solid var(--line)', boxShadow:'0 6px 20px rgba(78,48,58,.04)' },
  input:{ width:'100%', padding:'10px 11px', marginBottom:10, borderRadius:10, border:'1px solid #ebe3e5', background:'var(--surface-soft)', fontSize: 15, boxSizing:'border-box', outline:'none' },
  textarea:{ width:'100%', padding:'10px 11px', marginBottom:10, borderRadius:10, border:'1px solid #ebe3e5', background:'var(--surface-soft)', fontSize: 15, minHeight:72, resize:'vertical', boxSizing:'border-box', outline:'none' },
  switchRow:{ display:'flex', alignItems:'center', gap:8, fontSize: 14, color:'var(--muted)', marginBottom:10, cursor:'pointer' },
  formHint:{ fontSize: 14, color:'var(--muted)', marginBottom:11, lineHeight:'18px' },
  fieldLabel:{ fontSize: 14, color:'var(--muted)', marginBottom:4 },
  hint:{ fontSize: 14, color:'var(--accent-strong)', marginBottom:10 },
  pubImg:{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:11, marginBottom:10 },
  btn:{ padding:'9px 21px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:700 },
  btnGray:{ padding:'9px 21px', borderRadius:10, border:'1px solid #e8e0e3', background: 'var(--surface)', color:'var(--muted)', cursor:'pointer' },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(205px,1fr))', gap:17 },
  dollCard:{ background: 'var(--surface)', borderRadius:17, padding:10, border:'1px solid var(--line)', boxShadow:'0 6px 20px rgba(78,48,58,.05)', overflow:'hidden', cursor:'pointer' },
  dollImg:{ width:'100%', height:230, objectFit:'cover', borderRadius:12, marginBottom:9, display:'block' },
  dollPlaceholder:{ height:230, borderRadius:12, marginBottom:9, background:'#fff2f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 },
  btnSmall:{ padding:'6px 11px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize: 14, fontWeight:600 },
  btnSmallGray:{ padding:'6px 11px', borderRadius:8, border:'1px solid #e8e0e3', background: 'var(--surface)', color:'var(--muted)', cursor:'pointer', fontSize: 14 }
}

export default Cabinet
