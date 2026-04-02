import { useState, useEffect, useRef } from 'react';
import type { GitAction } from './job-types';
import s from './ApproveDropdown.module.css';

export function ApproveDropdown({ onSelect }: { onSelect: (action: GitAction) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const options: { label: string; action: GitAction }[] = [
    { label: 'Commit', action: 'commit' },
    { label: 'Commit + Push', action: 'commit_push' },
    { label: 'New Branch + PR', action: 'branch_pr' },
  ];

  return (
    <div ref={ref} className={s.approveWrap}>
      <button className="btn btnSuccess btnSm" onClick={() => setOpen(prev => !prev)}>
        Approve &#9662;
      </button>
      {open && (
        <div className={s.approveMenu}>
          {options.map(o => (
            <button
              key={o.action}
              className={s.approveOption}
              onClick={() => { setOpen(false); onSelect(o.action); }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
