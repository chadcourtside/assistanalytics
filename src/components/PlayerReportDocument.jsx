/**
 * Print/PDF layout for the one-page player development report.
 * Rendered off-screen and captured by html2pdf.
 */
export default function PlayerReportDocument({ report }) {
  if (!report) return null;

  const subtitle = [report.team, report.season].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        fontSize: '11px',
        lineHeight: 1.45,
        color: '#111827',
        background: '#fff',
        width: '7.5in',
        padding: '0.35in',
      }}
    >
      <header
        style={{
          borderBottom: '3px solid #2563eb',
          paddingBottom: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e3a8a' }}>
              {report.playerName}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }}>
              Player Development Report
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#9ca3af' }}>
            <div>{report.generatedAt}</div>
            <div>{report.gamesInView} game{report.gamesInView === 1 ? '' : 's'} in view</div>
          </div>
        </div>
      </header>

      <section style={{ marginBottom: '14px' }}>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#2563eb',
          }}
        >
          This week&apos;s focus
        </h2>
        <ul style={{ margin: 0, paddingLeft: '18px' }}>
          {report.focusBullets.map((text, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>
              {text}
            </li>
          ))}
        </ul>
      </section>

      {report.lastGame && (
        <section
          style={{
            marginBottom: '14px',
            padding: '10px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
          }}
        >
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748b',
            }}
          >
            Last game
          </h2>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>{report.lastGame.title}</p>
          {report.lastGame.dateLabel && (
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '10px' }}>
              {report.lastGame.dateLabel}
            </p>
          )}
          {report.lastGame.takeaway ? (
            <p
              style={{
                margin: '8px 0 0',
                paddingLeft: '10px',
                borderLeft: '3px solid #2563eb',
                fontStyle: 'italic',
                color: '#374151',
              }}
            >
              &ldquo;{report.lastGame.takeaway}&rdquo;
            </p>
          ) : (
            <p style={{ margin: '8px 0 0', color: '#9ca3af', fontStyle: 'italic' }}>
              No coach takeaway logged for this game.
            </p>
          )}
          {report.lastGame.highlights?.length > 0 && (
            <p style={{ margin: '6px 0 0', color: '#4b5563' }}>
              {report.lastGame.highlights.join(' · ')}
            </p>
          )}
        </section>
      )}

      <section style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#2563eb',
            }}
          >
            Film clips to watch
          </h2>
          {report.totalStarred > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>
              {report.reviewedCount}/{report.totalStarred} reviewed
            </span>
          )}
        </div>
        {report.starredClips.length === 0 ? (
          <p style={{ margin: 0, color: '#9ca3af' }}>
            No starred clips — coach stars clips in Smart Film Room.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '5px 6px', borderBottom: '1px solid #cbd5e1' }}>
                  Time
                </th>
                <th style={{ textAlign: 'left', padding: '5px 6px', borderBottom: '1px solid #cbd5e1' }}>
                  Play
                </th>
                <th style={{ textAlign: 'left', padding: '5px 6px', borderBottom: '1px solid #cbd5e1' }}>
                  Link
                </th>
                <th style={{ textAlign: 'center', padding: '5px 6px', borderBottom: '1px solid #cbd5e1' }}>
                  ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {report.starredClips.map((clip, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: '5px 6px',
                      borderBottom: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {clip.timeStr}
                  </td>
                  <td style={{ padding: '5px 6px', borderBottom: '1px solid #e2e8f0' }}>
                    <strong>{clip.rawDesc}</strong>
                    <span style={{ color: '#64748b' }}> · vs {clip.opponent}</span>
                  </td>
                  <td
                    style={{
                      padding: '5px 6px',
                      borderBottom: '1px solid #e2e8f0',
                      wordBreak: 'break-all',
                      color: '#2563eb',
                      fontSize: '9px',
                    }}
                  >
                    {clip.watchUrl || '—'}
                  </td>
                  <td
                    style={{
                      padding: '5px 6px',
                      borderBottom: '1px solid #e2e8f0',
                      textAlign: 'center',
                      color: clip.reviewed ? '#15803d' : '#9ca3af',
                      fontWeight: 700,
                    }}
                  >
                    {clip.reviewed ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {report.benchmarkRows?.length > 0 && (
        <section style={{ marginBottom: '14px' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#2563eb',
            }}
          >
            Key development goals
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid #cbd5e1' }}>
                  Metric
                </th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid #cbd5e1' }}>
                  Season avg
                </th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid #cbd5e1' }}>
                  12-mo goal
                </th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid #cbd5e1' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {report.benchmarkRows.map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    {row.current}
                  </td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    {row.target12}
                  </td>
                  <td
                    style={{
                      padding: '5px 8px',
                      borderBottom: '1px solid #e2e8f0',
                      textAlign: 'center',
                      fontWeight: 600,
                      color:
                        row.status === 'On track'
                          ? '#15803d'
                          : row.status === 'Approaching'
                            ? '#a16207'
                            : row.status === 'Needs focus'
                              ? '#b91c1c'
                              : '#6b7280',
                    }}
                  >
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {report.pinnedBlurbs?.length > 0 && (
        <section>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#2563eb',
            }}
          >
            What we&apos;re tracking
          </h2>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {report.pinnedBlurbs.map((item, i) => (
              <li key={i} style={{ marginBottom: '3px' }}>
                <strong>{item.label}</strong> — {item.blurb}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer
        style={{
          marginTop: '16px',
          paddingTop: '8px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '9px',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        Assist Analytics · Generated for player development review
      </footer>
    </div>
  );
}
