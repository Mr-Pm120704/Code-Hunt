import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTimer } from '../hooks/useTimer';
import CodeEditor from '../components/CodeEditor';
import WebcamMonitor from '../components/WebcamMonitor';
import DistractionBanner from '../components/DistractionBanner';
import TestResults from '../components/TestResults';
import Toast from '../components/Toast';
import useExamSecurity from '../hooks/useExamSecurity';


export default function CodingChallenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatted, start, stop } = useTimer();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [distractionCount, setDistractionCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [leaveCount, setLeaveCount] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [language, setLanguage] = useState('java');
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('code');
  const [isSolved, setIsSolved] = useState(false);
  const [viewMode, setViewMode] = useState('edit');
  const codeRef = useRef(code);
  const getCode = useCallback(() => codeRef.current, []);

  useEffect(() => { codeRef.current = code; }, [code]);

  const addToast = useCallback((message, type = 'default') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const handleSecurityViolation = useCallback((reason) => {
    if (!hasStarted || isDisqualified || submitted) return;

    const labels = {
      contextmenu: 'Right-click is disabled during the exam.',
      copy: 'Copy is disabled during the exam.',
      cut: 'Cut is disabled during the exam.',
      paste: 'Paste is disabled during the exam.',
      beforecopy: 'Copy is disabled during the exam.',
      beforecut: 'Cut is disabled during the exam.',
      beforepaste: 'Paste is disabled during the exam.',
      drop: 'Drag-and-drop is disabled during the exam.',
      selectstart: 'Text selection is disabled during the exam.',
      longpress: 'Long-press is disabled during the exam.',
      'shortcut:escape': 'Esc key is disabled during the exam.',
      'shortcut:f12': 'Developer Tools access is blocked.',
      'shortcut:f5': 'Browser refresh is disabled during the exam.',
      'devtools:size': 'Developer Tools detected. This is a security violation.',
      'devtools:debugger': 'Developer Tools detected via debugger. This is a security violation.',
      'devtools:getter': 'Developer Tools detected. This is a security violation.',
      'resize:suspect': 'Suspicious window resize detected.',
      'navigation:backforward': 'Browser back/forward navigation is disabled during the exam.',
      'mobile:clipboard': 'Clipboard paste is disabled during the exam.',
    };

    const label = labels[reason] || 'Forbidden shortcut or action blocked during the exam.';
    setDistractionCount((prev) => prev + 1);
    addToast(label, 'warn');
    api.post('/logs', { problemId: id }).catch(() => {});
  }, [addToast, hasStarted, id, isDisqualified, submitted]);

  useExamSecurity({
    enabled: hasStarted && !isDisqualified && !submitted,
    onViolation: handleSecurityViolation,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Initial load taking too long, forcing ready state.");
        setLoading(false);
      }
    }, 8000);

    Promise.all([
      api.get(`/problems/${id}`),
      api.get('/settings/webcam'),
    ])
      .then(([{ data: problem }, { data: settings }]) => {
        setProblem(problem);
        if (problem.isSolved && problem.lastSolvedCode) {
          setCode(problem.lastSolvedCode);
          setIsSolved(true);
          setViewMode('view');
        } else {
          setCode(problem.starterCode || '');
        }
        setWebcamEnabled(settings.webcamEnabled);
      })
      .catch((err) => {
        console.error("Failed to load challenge:", err);
        addToast("Error loading challenge. Please try again.", "error");
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timer);
      });
    
    return () => clearTimeout(timer);
  }, [id, navigate, addToast]);

  useEffect(() => {
    if (!hasStarted || isDisqualified || submitted) return;

    let wasFullscreen = !!document.fullscreenElement;

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      if (wasFullscreen && !isNowFullscreen) {
        addToast('Fullscreen exited. The exam requires fullscreen mode.', 'warn');
        api.post('/logs', { problemId: id }).catch(() => {});
        setDistractionCount((prev) => prev + 1);
        // Re-enter fullscreen after a short delay
        setTimeout(() => {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }, 500);
      }
      wasFullscreen = isNowFullscreen;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasStarted, isDisqualified, submitted, id, addToast]);

  const autoSubmitOnDisqualify = useCallback(async () => {
    if (submitted) return;
    try {
      const currentCode = codeRef.current;
      await api.post('/submit', { code: currentCode, problemId: id, distractionCount, language });
    } catch (_) {
      // Best-effort: continue to redirect even if submit fails
    }
  }, [id, distractionCount, language, submitted]);

  useEffect(() => {
    if (!hasStarted || submitted) return;

    const handleHidden = () => {
      if (isDisqualified || submitted) return;
      api.post('/logs', { problemId: id }).catch(() => {});

      setLeaveCount((prev) => {
        const next = prev + 1;
        if (next === 1) {
          // First violation: show overlay, give one chance to rejoin
          setOverlayVisible(true);
          addToast('You left the exam window. You may rejoin once.', 'warn');
        } else {
          // Second violation: auto-submit and redirect to home page
          setIsDisqualified(true);
          addToast('Multiple window switches detected - auto-submitting & redirecting.', 'error');
          autoSubmitOnDisqualify().finally(() => {
            setTimeout(() => {
              alert('SECURITY VIOLATION: Multiple tab/window switches detected. Your session has been terminated and your code has been auto-submitted.');
              localStorage.clear();
              window.location.href = '/';
            }, 1200);
          });
        }
        return next;
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleHidden();
      } else if (document.visibilityState === 'visible') {
        if (overlayVisible) {
          setOverlayVisible(false);
          addToast('You have rejoined the exam. Continue.');
        }
      }
    };

    const handleBlur = () => {
      handleHidden();
    };

    const handlePageHide = () => {
      handleHidden();
    };

    // Detect new tab / window open via window.open or Ctrl+T
    // The focus event fires when user switches back to this tab
    const handleFocus = () => {
      if (overlayVisible) {
        setOverlayVisible(false);
        addToast('You have rejoined the exam. Continue.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
    };
  }, [hasStarted, id, isDisqualified, submitted, overlayVisible, addToast, autoSubmitOnDisqualify]);

  const startChallenge = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
    }
    setHasStarted(true);
    start();
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (lang === 'java') {
      setCode(problem?.starterCode || '');
    } else if (lang === 'python') {
      setCode('import sys\n\ndef main():\n    # Read from stdin\n    # input_data = sys.stdin.read().split()\n    \n    # Your logic here\n    pass\n\nif __name__ == "__main__":\n    main()');
    } else if (lang === 'cpp') {
      setCode('#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Your logic here\n    \n    return 0;\n}');
    } else if (lang === 'c') {
      setCode('#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Your logic here\n    \n    return 0;\n}');
    }
  };

  const handleDistraction = useCallback((direction) => {
    if (direction === 'camera-off') {
      setIsDisqualified(true);
      api.post('/logs', { problemId: id }).catch(() => {});
      alert('Camera access was lost. Your session has been terminated.');
      localStorage.clear();
      window.location.href = '/login';
      return;
    }

    setDistractionCount((prev) => {
      const next = prev + 1;
      let label;
      if (direction === 'away') label = 'Face not detected';
      else if (direction === 'extreme-left' || direction === 'extreme-right') 
        label = 'Head turned too far - looking behind you';
      else if (direction === 'extreme-down') label = 'Looking down - checking external materials?';
      else if (direction === 'extreme-up') label = 'Looking up - checking wall/ceiling?';
      else if (direction === 'extreme-position-warmup') label = 'Extreme head position detected';
      else if (direction.startsWith('object-')) label = `CHEATING: ${direction.replace('object-', '').replace('-', ' ')} detected!`;
      else if (direction === 'multiple-faces') label = 'CHEATING: Multiple people in frame!';
      else label = `Violation: ${direction}`;
      addToast(label, 'warn');
      api.post('/logs', { problemId: id }).catch(() => {});
      if (next >= 10) {
        setShowBanner(true);
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => { });
        }
      }
      return next;
    });
  }, [addToast, id]);

  const runCode = async () => {
    setRunLoading(true);
    try {
      const payload = { code, problemId: id, language };
      const { data } = await api.post('/run', payload);
      setTestResults(data);
      addToast(data.allPassed ? 'Execution complete!' : 'Execution failed.', data.allPassed ? 'success' : 'warn');
    } catch (err) {
      addToast('Error running code.', 'error');
    } finally {
      setRunLoading(false);
    }
  };

  const submitCode = async () => {
    setSubmitLoading(true);
    try {
      const { data } = await api.post('/submit', { code, problemId: id, distractionCount, language });
      setSubmitResult(data);
      setSubmitted(true);
      stop();
      addToast(
        data.allPassed
          ? `Submitted! ${data.summary?.passed ?? 0}/${data.summary?.total ?? 0} test cases passed.`
          : `Submitted. Only ${data.summary?.passed ?? 0}/${data.summary?.total ?? 0} test cases passed.`,
        data.allPassed ? 'success' : 'warn'
      );
      setTimeout(() => navigate('/student'), 2000);
    } catch (err) {
      addToast('Submission failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-foreground font-black text-lg tracking-tight">Preparing Arena</p>
          <p className="text-muted text-xs uppercase tracking-widest mt-1">Initializing Secure Environment</p>
        </div>
      </div>
    </div>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="exam-secure h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {!hasStarted && (
        <div className="fixed inset-0 z-[10000] bg-background/95 backdrop-blur flex items-center justify-center p-4 sm:p-6 text-center">
          <div className="max-w-md w-full lc-card p-6 sm:p-10 border-2 border-brand bg-surface">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Exam Security</h2>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              This environment is proctored by AI. By starting, you agree to:
              <br /><br />
              • Automatic <strong>Full Screen</strong> mode<br />
              {webcamEnabled && <div className="inline">• Active <strong>Face & Gaze</strong> monitoring<br /></div>}
              • <strong>Disqualification</strong> on tab/window switching
            </p>
            <button
              onClick={startChallenge}
              disabled={webcamEnabled && !cameraReady}
              className="lc-btn-primary w-full py-4 text-lg font-bold shadow-[0_0_20px_rgba(255,161,22,0.3)] disabled:opacity-50"
            >
              {webcamEnabled && !cameraReady ? 'Enable Camera to Enter' : 'Enter Exam Arena'}
            </button>
          </div>
        </div>
      )}

      {webcamEnabled && !cameraReady && (
        <div className="fixed inset-0 z-[20000] bg-background/95 backdrop-blur flex items-center justify-center p-4 sm:p-6 text-center">
          <div className="max-w-xl w-full lc-card p-6 sm:p-10 border-2 border-red-500 bg-surface shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">Camera Required</h2>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              This exam requires your webcam to be enabled. Please allow camera access in your browser and refresh the page.
            </p>
            {cameraError ? (
              <p className="text-sm text-red-500 mb-6">{cameraError}</p>
            ) : (
              <p className="text-sm text-gray-500 mb-6">Waiting for camera permission...</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="lc-btn-secondary px-5 py-3 rounded font-bold"
              >
                Retry Camera Access
              </button>
              <button
                onClick={() => navigate('/student')}
                className="px-5 py-3 rounded font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanner && <DistractionBanner count={distractionCount} />}

      {overlayVisible && (
        <div className="fixed inset-0 z-[30000] bg-black/60 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full lc-card p-6 sm:p-8 border-border bg-surface text-center">
            <h3 className="text-lg font-bold mb-3">You left the exam window</h3>
            <p className="text-sm text-muted mb-6">You may rejoin once. Click <strong>Rejoin</strong> to continue. Further tab/window switches will terminate your session.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setOverlayVisible(false); addToast('Rejoined exam.'); }}
                className="lc-btn-primary px-6 py-2"
              >
                Rejoin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="lc-navbar shrink-0 justify-between px-3 sm:px-4 md:px-6 bg-surface border-b border-border">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button onClick={() => navigate('/student')} className="text-muted hover:text-foreground text-xs md:text-sm shrink-0">
            ← <span className="hidden sm:inline">Problems</span>
          </button>
          <span className="text-border hidden sm:inline">|</span>
          <h1 className="text-xs md:text-sm font-bold text-foreground truncate max-w-[100px] sm:max-w-[200px] md:max-w-none">{problem?.title}</h1>
          {isSolved && !submitted && (
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">✓ Solved</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {isSolved && !submitted && (
            <div className="flex bg-background border border-border rounded overflow-hidden">
              <button
                onClick={() => setViewMode('edit')}
                className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 transition-colors ${viewMode === 'edit' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'}`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('view')}
                className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 transition-colors ${viewMode === 'view' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'}`}
              >
                View
              </button>
            </div>
          )}
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-background border border-border text-foreground text-[10px] md:text-sm font-bold rounded px-1.5 py-0.5 md:px-2 md:py-1 outline-none focus:border-brand"
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>

          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted">
             <span className="whitespace-nowrap">⏱ {formatted()}</span>
             {webcamEnabled && (
               <>
                 <span className="text-border">|</span>
                 <span className={`${distractionCount >= 10 ? 'text-red-500' : 'text-brand'} whitespace-nowrap`}>
                   👁️ {distractionCount}/10
                 </span>
               </>
             )}
          </div>
          <div className="flex gap-1 md:gap-2">
            <button
              onClick={runCode}
              disabled={runLoading || submitted}
              className="lc-btn-secondary py-1 px-2 md:py-1.5 md:px-4 text-[10px] md:text-xs font-bold rounded disabled:opacity-50 transition-colors"
            >
              {runLoading ? '...' : 'Run'}
            </button>
            <button
              onClick={submitCode}
              disabled={submitLoading || submitted}
              className="px-2 py-1 md:px-4 md:py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] md:text-xs font-bold rounded disabled:opacity-50 transition-colors"
            >
              {submitLoading ? '...' : submitted ? 'Ok' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      <div className="md:hidden flex border-b border-border bg-surface shrink-0">
        {['code', 'description', 'output'].map((panel) => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              mobilePanel === panel
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-muted'
            }`}
          >
            {panel === 'code' ? 'Code' : panel === 'description' ? 'Problem' : 'Output'}
          </button>
        ))}
      </div>

      {/* Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-1.5 sm:p-2 gap-1.5 sm:gap-2">
        {/* Left: Description */}
        <div className={`${mobilePanel === 'description' ? 'flex' : 'hidden'} md:flex w-full md:w-[45%] md:h-auto bg-surface rounded-lg border border-border overflow-y-auto p-3 sm:p-4 md:p-6 ${mobilePanel === 'description' ? 'flex-1' : ''}`}>
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">{problem?.title}</h2>
            <div className="mb-4">
              <span className={`badge-${problem?.difficulty.toLowerCase()}`}>
                {problem?.difficulty}
              </span>
            </div>
            
            <div 
              className="text-foreground text-sm leading-relaxed problem-desc"
              dangerouslySetInnerHTML={{
                __html: problem?.description
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  .replace(/`([^`]+)`/g, '<code class="bg-background border border-border px-1.5 py-0.5 rounded text-brand font-mono text-[13px]">$1</code>')
                  .replace(/```(java|js)?\n?([\s\S]*?)```/g, '<pre class="bg-background border border-border p-3 sm:p-4 rounded-lg my-4 overflow-x-auto"><code class="text-muted text-xs sm:text-sm">$2</code></pre>')
                  .replace(/\n/g, '<br/>')
              }}
            />

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
              {testResults && (
                <TestResults results={testResults.results} summary={testResults.summary} />
              )}
            </div>
          </div>
        </div>

        {/* Right: Editor + Output */}
        <div className={`${mobilePanel === 'code' || mobilePanel === 'output' ? 'flex' : 'hidden'} md:flex flex-1 flex-col gap-1.5 sm:gap-2 overflow-hidden`}>
          {/* Editor */}
          <div className={`${mobilePanel === 'code' ? 'flex-1' : 'hidden md:flex'} md:flex-1 min-h-0`}>
            <CodeEditor value={code} onChange={setCode} language={language} readOnly={isSolved && viewMode === 'view'} />
          </div>

          {/* Bottom Panel — Console output */}
          {testResults && (
            <div className={`${mobilePanel === 'output' ? 'flex-1' : 'hidden md:block'} h-[30%] md:h-auto bg-[#0d1117] rounded-lg border border-border p-3 sm:p-4 overflow-y-auto font-mono text-xs`}>
              <h3 className="text-[10px] font-bold text-muted uppercase mb-3 tracking-wider">Console Output</h3>
              <div className="space-y-3">
                {testResults.results.map((res, idx) => (
                  <div key={idx}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {'▶ Test Case #'}{idx + 1} {res.passed ? '✓' : '✗'}
                    </span>
                    {res.actual ? (
                      <pre className={`mt-1 whitespace-pre-wrap break-all leading-relaxed text-xs ${res.error ? 'text-red-300' : 'text-green-300'}`}>
                        {res.actual}
                      </pre>
                    ) : (
                      <p className="text-muted italic mt-1">(no output)</p>
                    )}
                    {res.time != null && (
                      <p className="text-[9px] text-muted mt-0.5">Exec: {Math.round(res.time)}ms</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {webcamEnabled && (
        <WebcamMonitor
          onDistraction={handleDistraction}
          getCode={getCode}
          problemId={id}
          onCameraStatusChange={(ready, error) => {
            setCameraReady(ready);
            setCameraError(error);
          }}
        />
      )}
      <Toast toasts={toasts} />
    </div>
  );
}
