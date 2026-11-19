import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { RetroCard } from '@/types/game';

interface RetroExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetroExportModal: React.FC<RetroExportModalProps> = ({ isOpen, onClose }) => {
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<'all' | 'mailboxes'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { retroCards, players } = gameState;
  const greenCards = retroCards.filter((c) => c.category === 'seguir');
  const yellowCards = retroCards.filter((c) => c.category === 'mejorar');
  const redCards = retroCards.filter((c) => c.category === 'dejar');

  // Generate clean Markdown Report
  const generateMarkdownReport = (): string => {
    let md = `# 🏁 Acta de Retrospectiva: Sprint Party 3D (Senda Arcoíris)\n`;
    md += `**Fecha:** ${new Date().toLocaleDateString('es-ES')} | **Sala:** ${gameState.roomCode}\n\n`;

    md += `## 🏆 Podio Final y Clasificación\n`;
    const sorted = [...players].sort((a, b) => b.stars - a.stars);
    sorted.forEach((p, i) => {
      md += `${i + 1}. **${p.name}** (${CHARACTERS[p.characterId].name}) — ⭐ ${p.stars} Estrellas [${p.medals.seguir ? '🟢' : '⚪'}${p.medals.mejorar ? '🟡' : '⚪'}${p.medals.dejar ? '🔴' : '⚪'}]\n`;
    });
    md += `\n---\n\n`;

    md += `## 🟢 Seguir Haciendo (Elogios y Aciertos)\n`;
    if (greenCards.length === 0) md += `*Sin registros.*\n`;
    greenCards.forEach((c) => {
      const target = c.recipientName ? ` (Para @${c.recipientName})` : '';
      md += `- **@${c.playerName}${target}:** "${c.content}"\n`;
    });
    md += `\n`;

    md += `## 🟡 Mejorar / Potenciar (Planes de Acción)\n`;
    if (yellowCards.length === 0) md += `*Sin registros.*\n`;
    yellowCards.forEach((c) => {
      md += `- **@${c.playerName}:** "${c.content}"\n`;
    });
    md += `\n`;

    md += `## 🔴 Dejar de Hacer (Frenos y Deuda Técnica)\n`;
    if (redCards.length === 0) md += `*Sin registros.*\n`;
    redCards.forEach((c) => {
      md += `- **@${c.playerName}:** "${c.content}"\n`;
    });
    md += `\n---\n*Generado por Sprint Party 3D*`;

    return md;
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Retrospectiva_Sprint_${gameState.roomCode}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-yellow-400/50 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <span>📋</span> Acta Completa de la Retrospectiva
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Revisión de tarjetas recogidas durante el juego y buzones individuales.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center text-base font-bold active:scale-95 transition-all shadow-md"
            aria-label="Cerrar Acta"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 pt-3 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Categorías Globales ({retroCards.length})
          </button>
          <button
            onClick={() => setActiveTab('mailboxes')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'mailboxes'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Buzones Personales ({players.length})
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-white/20 text-xs font-bold text-white hover:bg-slate-750 flex items-center gap-1.5"
            >
              <span>{copied ? '✓ Copiado' : '📋 Copiar Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 hover:brightness-110"
            >
              <span>💾 Descargar .md</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2 scrollbar-thin">
          {activeTab === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Seguir */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm mb-3">
                  <span>🟢</span>
                  <span>Seguir Haciendo ({greenCards.length})</span>
                </div>
                <div className="space-y-2.5">
                  {greenCards.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No hay tarjetas aún.</div>
                  ) : (
                    greenCards.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-xs">
                        <div className="text-emerald-300 font-bold mb-1 flex items-center justify-between">
                          <span>{c.playerName}</span>
                          {c.recipientName && (
                            <span className="text-[10px] text-emerald-400/80">➔ @{c.recipientName}</span>
                          )}
                        </div>
                        <p className="text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mejorar */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm mb-3">
                  <span>🟡</span>
                  <span>Mejorar / Potenciar ({yellowCards.length})</span>
                </div>
                <div className="space-y-2.5">
                  {yellowCards.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No hay tarjetas aún.</div>
                  ) : (
                    yellowCards.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs">
                        <div className="text-amber-300 font-bold mb-1">{c.playerName}</div>
                        <p className="text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dejar */}
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm mb-3">
                  <span>🔴</span>
                  <span>Dejar de Hacer ({redCards.length})</span>
                </div>
                <div className="space-y-2.5">
                  {redCards.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No hay tarjetas aún.</div>
                  ) : (
                    redCards.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/20 text-xs">
                        <div className="text-rose-300 font-bold mb-1">{c.playerName}</div>
                        <p className="text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Personal Mailboxes */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((p) => {
                const char = CHARACTERS[p.characterId];
                const receivedPraise = greenCards.filter((c) => c.recipientId === p.id);

                return (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/10">
                      <CharacterAvatar characterId={p.characterId} size="md" />
                      <div>
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="text-xs text-yellow-300">⭐ {p.stars} Estrellas</div>
                      </div>
                      <div className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-bold">
                        {receivedPraise.length} Elogios Recibidos
                      </div>
                    </div>

                    <div className="space-y-2">
                      {receivedPraise.length === 0 ? (
                        <div className="text-xs text-slate-500 italic">Aún no ha recibido elogios directos.</div>
                      ) : (
                        receivedPraise.map((pr) => (
                          <div key={pr.id} className="p-2.5 rounded-xl bg-slate-900/80 text-xs text-slate-300">
                            <span className="font-bold text-emerald-400">De @{pr.playerName}:</span> "{pr.content}"
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
