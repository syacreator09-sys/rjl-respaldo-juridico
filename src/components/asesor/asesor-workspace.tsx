'use client'

import { useMemo, useState } from 'react'
import { ActionButton, EmptyState, ListRow, MetricTile, ProfileChip, SectionFrame, StatusBadge } from '@/components/ui/rjl-primitives'

interface AdvisorTicket {
  id: string
  question: string
  response: string | null
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface AdvisorCase {
  id: string
  clientName: string
  clientPhone: string | null
  employerName: string | null
  position: string | null
  salaryDaily: number | null
  startDate: string | null
  hasImss: boolean
  hasContract: boolean
  evidenceCount: number
  gpsEvidenceCount: number
  createdAt: string
  priority: 'Alta' | 'Media' | 'Normal'
  projectionLines: string[]
  missingEvidence: string[]
  tickets: AdvisorTicket[]
}

interface AnalysisPayload {
  overview: string
  risks: string[]
  missingEvidence: string[]
  nextAction: string
  negotiationStrategy: string
  legalAlerts: string[]
}

function toneForPriority(priority: AdvisorCase['priority']) {
  if (priority === 'Alta') return 'danger'
  if (priority === 'Media') return 'warning'
  return 'neutral'
}

function statusTone(status: AdvisorTicket['status']) {
  if (status === 'open') return 'danger'
  if (status === 'in_progress') return 'warning'
  return 'success'
}

function statusLabel(status: AdvisorTicket['status']) {
  if (status === 'open') return 'Abierto'
  if (status === 'in_progress') return 'En proceso'
  return 'Cerrado'
}

export function AsesorWorkspace({
  cases,
  advisorName,
}: {
  cases: AdvisorCase[]
  advisorName: string
}) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id ?? null)
  const [analysisByCase, setAnalysisByCase] = useState<Record<string, AnalysisPayload | null>>({})
  const [analysisTextByCase, setAnalysisTextByCase] = useState<Record<string, string>>({})
  const [loadingCaseId, setLoadingCaseId] = useState<string | null>(null)

  const selectedCase = useMemo(
    () => cases.find((entry) => entry.id === selectedCaseId) ?? cases[0] ?? null,
    [cases, selectedCaseId],
  )

  async function analyzeCase(caseId: string) {
    setLoadingCaseId(caseId)

    try {
      const res = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'No se pudo analizar el expediente.')
      }

      setAnalysisByCase((current) => ({
        ...current,
        [caseId]: data.structured ?? null,
      }))
      setAnalysisTextByCase((current) => ({
        ...current,
        [caseId]: data.analysis ?? '',
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo analizar el expediente.'
      setAnalysisTextByCase((current) => ({ ...current, [caseId]: message }))
      setAnalysisByCase((current) => ({ ...current, [caseId]: null }))
    } finally {
      setLoadingCaseId(null)
    }
  }

  if (cases.length === 0) {
    return (
      <EmptyState
        title="Aun no tienes casos asignados."
        description="Cuando el administrador te asigne expedientes, aqui veras la bandeja, la cartera de clientes y la estrategia sugerida por IA."
      />
    )
  }

  const selectedAnalysis = selectedCase ? analysisByCase[selectedCase.id] : null
  const selectedAnalysisText = selectedCase ? analysisTextByCase[selectedCase.id] : ''
  const totalOpenTickets = cases.reduce(
    (sum, entry) => sum + entry.tickets.filter((ticket) => ticket.status !== 'closed').length,
    0,
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile label="Mi cartera" value={cases.length} hint="Clientes activos asignados." tone="gold" />
        <MetricTile label="Tickets activos" value={totalOpenTickets} hint="Casos que requieren respuesta o seguimiento." tone="danger" />
        <MetricTile label="Casos prioridad alta" value={cases.filter((entry) => entry.priority === 'Alta').length} hint={advisorName} tone="info" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <SectionFrame
            title="Mi perfil profesional"
            description="Resumen operativo de tu carga actual."
            aside={<StatusBadge tone="info">Asesor activo</StatusBadge>}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <ProfileChip label="Asesor" value={advisorName} />
              <ProfileChip label="Clientes activos" value={cases.length} />
              <ProfileChip label="Tickets abiertos" value={totalOpenTickets} />
              <ProfileChip label="Foco actual" value={selectedCase?.clientName ?? 'Sin seleccion'} />
            </div>
          </SectionFrame>

          <SectionFrame
            title="Bandeja de tickets"
            description="Lo primero que requiere triage o respuesta."
            aside={<ActionButton href="/asesor/tickets" variant="secondary">Ver todos</ActionButton>}
          >
            <div className="space-y-3">
              {cases.flatMap((entry) => entry.tickets.filter((ticket) => ticket.status !== 'closed').map((ticket) => ({ ...ticket, clientName: entry.clientName, caseId: entry.id }))).slice(0, 6).map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone(ticket.status)}>{statusLabel(ticket.status)}</StatusBadge>
                    <StatusBadge tone={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}>
                      {ticket.priority === 'high' ? 'Prioridad alta' : ticket.priority === 'medium' ? 'Prioridad media' : 'Prioridad normal'}
                    </StatusBadge>
                    <span className="text-xs text-[#F2EDE0]/42">{ticket.clientName}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#F2EDE0]">
                    {ticket.question.length > 160 ? `${ticket.question.slice(0, 160)}...` : ticket.question}
                  </p>
                  <div className="mt-3 flex justify-between gap-3 text-xs text-[#F2EDE0]/45">
                    <span>{new Date(ticket.created_at).toLocaleDateString('es-MX')}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCaseId(ticket.caseId)}
                      className="text-[#E5C97A] transition hover:text-[#F2EDE0]"
                    >
                      Ver expediente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionFrame>

          <SectionFrame
            title="Mis clientes"
            description="Cartera operativa con senales de riesgo visibles."
            id="clientes"
          >
            <div className="space-y-3">
              {cases.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedCaseId(entry.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedCaseId === entry.id
                      ? 'border-[#C8A84B]/38 bg-[#172240]'
                      : 'border-white/8 bg-[#0F1B31] hover:border-[#C8A84B]/18'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[#F2EDE0]">{entry.clientName}</p>
                    <StatusBadge tone={toneForPriority(entry.priority)}>{entry.priority}</StatusBadge>
                    {!entry.hasImss ? <StatusBadge tone="danger">Sin IMSS</StatusBadge> : null}
                    {!entry.hasContract ? <StatusBadge tone="warning">Sin contrato</StatusBadge> : null}
                  </div>
                  <p className="mt-2 text-xs text-[#F2EDE0]/52">
                    {entry.employerName ?? 'Empleador pendiente'} · {entry.position ?? 'Puesto pendiente'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#F2EDE0]/45">
                    <span>{entry.evidenceCount} evidencia(s)</span>
                    <span>{entry.gpsEvidenceCount} con GPS</span>
                    <span>{entry.tickets.filter((ticket) => ticket.status !== 'closed').length} ticket(s) abiertos</span>
                  </div>
                </button>
              ))}
            </div>
          </SectionFrame>
        </div>

        <div className="space-y-6">
          {selectedCase ? (
            <>
              <SectionFrame
                title="Proyeccion del cliente seleccionado"
                description={`${selectedCase.clientName} · ${selectedCase.employerName ?? 'Empleador pendiente'}`}
                aside={
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={toneForPriority(selectedCase.priority)}>{selectedCase.priority}</StatusBadge>
                    <ActionButton href={`/api/expediente/${selectedCase.id}`}>Generar PDF</ActionButton>
                  </div>
                }
                id="proyeccion"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <ProfileChip label="Puesto" value={selectedCase.position ?? 'Pendiente'} />
                  <ProfileChip label="Salario diario" value={selectedCase.salaryDaily ? `$${selectedCase.salaryDaily} MXN` : 'Pendiente'} />
                  <ProfileChip label="Ingreso" value={selectedCase.startDate ? new Date(selectedCase.startDate).toLocaleDateString('es-MX') : 'Pendiente'} />
                  <ProfileChip label="Telefono" value={selectedCase.clientPhone ?? 'Sin telefono'} />
                </div>
                <div className="mt-5 rounded-3xl border border-[#C8A84B]/14 bg-[#0F1B31] p-4">
                  <p className="text-sm font-medium text-[#F2EDE0]">Desglose minimo de proyeccion</p>
                  <div className="mt-3 space-y-1.5">
                    {selectedCase.projectionLines.length > 0 ? selectedCase.projectionLines.map((line) => (
                      <p key={line} className={`text-sm ${line.startsWith('TOTAL') ? 'font-semibold text-[#E5C97A]' : 'text-[#F2EDE0]/65'}`}>
                        {line}
                      </p>
                    )) : (
                      <p className="text-sm text-[#F2EDE0]/52">Faltan salario o fecha de ingreso para proyectar montos.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#F2EDE0]/45">Evidencia faltante</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCase.missingEvidence.length > 0 ? selectedCase.missingEvidence.map((item) => (
                      <StatusBadge key={item} tone="warning">{item}</StatusBadge>
                    )) : (
                      <StatusBadge tone="success">Expediente con soporte base</StatusBadge>
                    )}
                  </div>
                </div>
              </SectionFrame>

              <SectionFrame
                title="Analisis IA · Estrategia del caso"
                description="Diagnostico rapido para decidir el siguiente mejor movimiento."
                aside={
                  <button
                    type="button"
                    onClick={() => analyzeCase(selectedCase.id)}
                    disabled={loadingCaseId === selectedCase.id}
                    className="rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--gold-dim))] px-4 py-2.5 text-sm font-medium text-[#0A1628] disabled:opacity-50"
                  >
                    {loadingCaseId === selectedCase.id ? 'Analizando...' : 'Analizar con IA'}
                  </button>
                }
                id="analisis"
              >
                {selectedAnalysis ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#E5C97A]/80">Diagnostico preliminar</p>
                      <p className="mt-2 text-sm leading-6 text-[#F2EDE0]/78">{selectedAnalysis.overview}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#F2EDE0]/45">Riesgos</p>
                        <div className="mt-3 space-y-2">
                          {selectedAnalysis.risks.map((risk) => (
                            <p key={risk} className="text-sm text-[#F2EDE0]/72">• {risk}</p>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#F2EDE0]/45">Evidencia faltante</p>
                        <div className="mt-3 space-y-2">
                          {selectedAnalysis.missingEvidence.map((item) => (
                            <p key={item} className="text-sm text-[#F2EDE0]/72">• {item}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <ListRow
                      title="Siguiente mejor accion"
                      description={selectedAnalysis.nextAction}
                    />
                    <ListRow
                      title="Estrategia de negociacion"
                      description={selectedAnalysis.negotiationStrategy}
                    />
                    <div className="rounded-2xl border border-[#E07070]/18 bg-[#0F1B31] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#FFADAD]">Alertas legales</p>
                      <div className="mt-3 space-y-2">
                        {selectedAnalysis.legalAlerts.map((item) => (
                          <p key={item} className="text-sm text-[#F2EDE0]/72">• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedAnalysisText ? (
                  <div className="rounded-2xl border border-white/8 bg-[#0F1B31] p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-[#F2EDE0]/78">{selectedAnalysisText}</pre>
                  </div>
                ) : (
                  <EmptyState
                    title="Aun no hay estrategia generada."
                    description="Selecciona un cliente y ejecuta el analisis para obtener diagnostico, riesgos, evidencia faltante y siguientes pasos."
                  />
                )}
              </SectionFrame>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
