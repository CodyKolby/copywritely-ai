
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

  // Check if the script contains the debug test marker
  const containsDebugMarker = script && (
    script.includes('DEBUGTEST_V1_2025-04-09') || 
    script === 'TEST' ||
    (script && script.trim().toLowerCase() === 'test')
  );
  
  // Remove the debug marker from the script if present
  const cleanedScript = !script ? '' : (
    containsDebugMarker && script.includes('DEBUGTEST_V1_2025-04-09') 
      ? script.replace('DEBUGTEST_V1_2025-04-09', '') 
      : script
  );

  // If script is just TEST, don't display it as content
  const displayScript = cleanedScript === 'TEST' ? '' : cleanedScript;

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
        
        {/* Display debug notification if debug marker was detected */}
        {containsDebugMarker && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg">
            <p className="font-medium">Debug Test Detected:</p>
            {script.includes('DEBUGTEST') ? (
              <p className="text-sm">System wykonał test z kodem: DEBUGTEST_V1_2025-04-09</p>
            ) : (
              <p className="text-sm">System zwrócił oczekiwaną wiadomość testową: {script}</p>
            )}
          </div>
        )}
        
        {/* Display the content only if there's something to display */}
        {displayScript && (
          <div className="prose max-w-none">
            {displayScript.split('\n').map((line, i) => (
              line ? (
                <p key={i} className="mb-4 last:mb-0">
                  {line}
                </p>
              ) : <br key={i} />
            ))}
          </div>
        )}

        {/* Display empty state message if no content after cleanup */}
        {!displayScript && (
          <div className="text-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-gray-500">Zwrócono tylko dane testowe.</p>
          </div>
        )}

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
            
            {/* Add newly detected request logs */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-1">System Prompt Used:</h5>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {debugInfo?.systemPromptUsed || "Not available"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptDisplay;
