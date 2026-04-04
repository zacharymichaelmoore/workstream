import React, { useState, useEffect, useRef } from 'react';
import s from './LiveLogs.module.css';

export function WorkstreamLogs({ workstreamId }: { workstreamId: string }) {
  const [lines, setLines] = useState<{ text: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleLog(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail.workstreamId === workstreamId && detail.text) {
        setLines(prev => [...prev.slice(-200), { text: detail.text }]);
      }
    }
    window.addEventListener('workstream_review_log', handleLog);
    return () => {
      window.removeEventListener('workstream_review_log', handleLog);
    };
  }, [workstreamId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerTitle}>Review &amp; PR Generation Logs</div>
        <div className={s.headerStatus}>
          <span className={s.statusDot} />
          Running
        </div>
      </div>
      <div className={s.scrollArea} ref={scrollRef}>
        <div className={s.content}>
          {lines.length === 0 && (
            <div className={s.line} style={{ opacity: 0.5 }}>
              Initializing PR agent...
            </div>
          )}
          {lines.map((line, i) => (
            <div key={i} className={s.line}>
              {line.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}