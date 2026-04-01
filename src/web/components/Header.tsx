import { useState, useEffect, useRef } from 'react';
import s from './Header.module.css';

interface Project {
  id: string;
  name: string;
}

interface Props {
  projectName: string;
  milestone: { name: string; tasksDone: number; tasksTotal: number };
  notifications: number;
  userInitials: string;
  projects: Project[];
  currentProjectId: string | null;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
}

export function Header({
  projectName,
  milestone,
  notifications,
  userInitials,
  projects,
  currentProjectId,
  onSwitchProject,
  onNewProject,
}: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <header className={s.bar}>
      <div className={s.left}>
        <span className={s.logo}>CodeSync</span>
        <span className={s.sep}>/</span>
        <div className={s.switcher} ref={dropdownRef}>
          <button className={s.project} onClick={() => setOpen(prev => !prev)}>
            {projectName} <span className={`${s.caret} ${open ? s.caretOpen : ''}`}>&#9662;</span>
          </button>
          {open && (
            <div className={s.dropdown}>
              <div className={s.dropdownList}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    className={`${s.dropdownItem} ${p.id === currentProjectId ? s.dropdownItemActive : ''}`}
                    onClick={() => {
                      onSwitchProject(p.id);
                      setOpen(false);
                    }}
                  >
                    <span className={s.dropdownCheck}>
                      {p.id === currentProjectId ? '\u2713' : ''}
                    </span>
                    <span className={s.dropdownName}>{p.name}</span>
                  </button>
                ))}
              </div>
              <div className={s.dropdownDivider} />
              <button
                className={s.dropdownNew}
                onClick={() => {
                  setOpen(false);
                  onNewProject();
                }}
              >
                + New Project
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={s.right}>
        <span className={s.milestone}>{milestone.name} &middot; {milestone.tasksDone}/{milestone.tasksTotal}</span>
        <button className={s.icon}>
          {notifications > 0 && <span className={s.dot} />}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <span className={s.avatar}>{userInitials}</span>
      </div>
    </header>
  );
}
