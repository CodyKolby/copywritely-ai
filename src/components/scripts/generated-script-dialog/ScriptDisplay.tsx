
import React from 'react';

interface ScriptDisplayProps {
  script: string;
  bestHook: string;
  hookIndex?: number;
  totalHooks?: number;
  adStructure?: string;
  rawResponse?: string;
  debugInfo?: any;
}

const ScriptDisplay = ({
  script,
  bestHook,
  hookIndex = 0,
  totalHooks = 0,
  adStructure = '',
  rawResponse,
  debugInfo
}: ScriptDisplayProps) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || true; // Always show debug in preview

  return (
    <div className="p-6 pt-0">
      <div className="mb-4">
        {totalHooks > 1 && (
          <div className="mb-4">
            <h3 className="text-sm uppercase font-medium text-gray-500 mb-1">
              Hook {hookIndex + 1} z {totalHooks}
            </h3>
            <p className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
              {bestHook}
            </p>
          </div>
        )}

        {adStructure && (
          <div className="mb-2 py-1 px-2 text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-600 inline-block rounded">
            Format: {adStructure}
          </div>
        )}
        
        <div className="prose max-w-none">
          {script.split('\n').map((line, i) => (
            line ? (
              <p key={i} className="mb-4 last:mb-0">
                {line}
              </p>
            ) : <br key={i} />
          ))}
        </div>

        {isDevelopment && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium text-sm text-gray-500 mb-2">Debug Information:</h4>
            
            {rawResponse && (
              <div className="mb-4">
                <h5 className="text-xs font-medium mb-1">Raw API Response:</h5>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {rawResponse}
                </pre>
              </div>
            )}

            {debugInfo && (
              <div className="mb-4">
                <h5 className="text-xs font-medium mb-1">Debug Info:</h5>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptDisplay;
