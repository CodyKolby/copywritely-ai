
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScriptDisplayProps {
  script: string;
  bestHook: string;
  hookIndex?: number;
  totalHooks?: number;
  adStructure?: string;
  rawResponse?: string;
  debugInfo?: any;
  showIntro?: boolean;
}

const ScriptDisplay = ({
  script,
  bestHook,
  hookIndex = 0,
  totalHooks = 0,
  adStructure = '',
  rawResponse,
  debugInfo,
  showIntro = true
}: ScriptDisplayProps) => {
  // Always hide debug information in production
  const isDevelopment = false; // Set this to false to always hide debug info
  
  // Check if the script contains any debug test markers
  const containsDebugMarker = script && (
    script.includes('TEST') || 
    script === 'TEST' ||
    script === 'TESTSCRIPT' ||
    script === 'TESTSCRIPT2' ||
    script === 'TESTSCRIPT3' ||
    (script && script.trim().toLowerCase() === 'test')
  );
  
  // Check if hook contains test markers
  const containsHookDebugMarker = bestHook && (
    bestHook.includes('TEST') ||
    bestHook === 'TESTHOOK' ||
    bestHook === 'TESTHOOK2' ||
    bestHook === 'TESTHOOK4'
  );
  
  // Remove the debug marker from the script if present
  const cleanedScript = !script ? '' : (
    containsDebugMarker && script.includes('TEST TEST TEST') 
      ? script.replace('TEST TEST TEST', '') 
      : script
  );

  // If script is just a test message (TEST), don't display it as content
  const isTestMessage = containsDebugMarker || containsHookDebugMarker;
  const displayScript = isTestMessage ? '' : cleanedScript;

  return (
    <div className="p-6 pt-0">
      <div className="mb-4">
        {/* Display test message notification with more prominence */}
        {isTestMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
            <p className="font-medium text-lg">✅ Test Successful!</p>
            <p className="text-base">System returned the expected test message:</p>
            <p className="font-mono bg-white p-2 rounded mt-2 border border-green-200">
              {containsDebugMarker ? `Script: "${script}"` : ''}
              {containsDebugMarker && containsHookDebugMarker ? <br /> : ''}
              {containsHookDebugMarker ? `Hook: "${bestHook}"` : ''}
            </p>
            <p className="text-sm mt-2">This confirms that your custom prompt is working correctly.</p>
            {debugInfo && (
              <div className="mt-2 text-xs bg-white p-2 rounded border border-green-200 overflow-auto">
                <p><strong>Debug Info:</strong></p>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        
        {adStructure && (
          <div className="mb-2 py-1 px-2 text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-600 inline-block rounded">
            Format: {adStructure}
          </div>
        )}
        
        {/* Display the content only if there's something to display */}
        {displayScript && (
          <ScrollArea className="h-[300px] pr-4">
            <div className="prose max-w-none">
              {displayScript.split('\n').map((line, i) => (
                line ? (
                  <p key={i} className="mb-4 last:mb-0">
                    {line}
                  </p>
                ) : <br key={i} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Display empty state message if no content after cleanup */}
        {!displayScript && !isTestMessage && (
          <div className="text-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-gray-500">Brak treści do wyświetlenia.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptDisplay;
