import { useState } from 'react'

const CORRECT_PIN = '1234'

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState(false)

  function press(digit: string) {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setTimeout(onUnlock, 200)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => {
          setPin('')
          setShake(false)
        }, 600)
      }
    }
  }

  function del() {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  const dots = [0, 1, 2, 3]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-6">
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center mb-1">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill="white" stroke="none" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800">Blessed Auto Spares</h1>
          <p className="text-sm text-gray-500">Enter PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div
          className={`flex gap-4 transition-transform ${shake ? 'animate-shake' : ''}`}
          style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          {dots.map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i
                  ? error
                    ? 'bg-red-500 border-red-500'
                    : 'bg-red-600 border-red-600'
                  : 'bg-transparent border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 -mt-3 font-medium">Incorrect PIN. Try again.</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 rounded-xl bg-gray-100 text-gray-800 text-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              {d}
            </button>
          ))}
          {/* empty, 0, delete */}
          <div />
          <button
            onClick={() => press('0')}
            className="h-14 rounded-xl bg-gray-100 text-gray-800 text-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            0
          </button>
          <button
            onClick={del}
            className="h-14 rounded-xl bg-gray-100 text-gray-500 text-xl flex items-center justify-center hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7M19 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
