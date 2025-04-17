import { useRef, useEffect } from "react";
import { useGameStore } from "@/store/game-store";

export function AuditSidebar() {
  const { auditLog } = useGameStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [auditLog]);
  
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };
  
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="space-y-3">
        {auditLog.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <span className="material-icons text-3xl mb-2">article</span>
            <p className="text-sm">No game activity yet</p>
            <p className="text-xs mt-1">Game events will be shown here</p>
          </div>
        ) : (
          auditLog.map((log) => (
            <div key={log.id} className="audit-log rounded-md bg-neutral-900 p-3">
              <div className="flex items-start">
                <span className={`material-icons text-lg ${getTypeStyles(log.type)}`}>
                  {getTypeIcon(log.type)}
                </span>
                <div className="ml-2">
                  <p className="text-sm text-neutral-200">{log.text}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
