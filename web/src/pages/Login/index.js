import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveAuth } from '@/lib/api';
// ── 4-digit PIN input ─────────────────────────────────────────────────────────
function PinInput({ value, onChange, error, }) {
    const inputs = useRef([]);
    function handleChange(i, e) {
        const digit = e.target.value.replace(/\D/g, '').slice(-1);
        const arr = value.padEnd(4, ' ').split('');
        arr[i] = digit || ' ';
        const next = arr.join('').trimEnd();
        onChange(next);
        if (digit && i < 3)
            inputs.current[i + 1]?.focus();
    }
    function handleKeyDown(i, e) {
        if (e.key === 'Backspace') {
            if (!value[i] && i > 0) {
                inputs.current[i - 1]?.focus();
                const arr = value.padEnd(4, ' ').split('');
                arr[i - 1] = ' ';
                onChange(arr.join('').trimEnd());
            }
            else {
                const arr = value.padEnd(4, ' ').split('');
                arr[i] = ' ';
                onChange(arr.join('').trimEnd());
            }
        }
        if (e.key === 'ArrowLeft' && i > 0)
            inputs.current[i - 1]?.focus();
        if (e.key === 'ArrowRight' && i < 3)
            inputs.current[i + 1]?.focus();
    }
    function handlePaste(e) {
        e.preventDefault();
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        onChange(digits);
        inputs.current[Math.min(digits.length, 3)]?.focus();
    }
    return (_jsx("div", { className: "flex gap-3 justify-center", children: [0, 1, 2, 3].map(i => (_jsx("input", { ref: el => { inputs.current[i] = el; }, type: "password", inputMode: "numeric", maxLength: 1, value: value[i] && value[i] !== ' ' ? value[i] : '', onChange: e => handleChange(i, e), onKeyDown: e => handleKeyDown(i, e), onPaste: handlePaste, onClick: () => inputs.current[i]?.select(), className: `w-14 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all focus:outline-none
            ${error
                ? 'border-red-400 bg-red-50 text-red-600'
                : value[i] && value[i] !== ' '
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-red-400 focus:bg-white'}` }, i))) }));
}
// ── Login page ────────────────────────────────────────────────────────────────
export function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('signin');
    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pinError, setPinError] = useState(false);
    // Auto-focus first PIN box when switching to signin
    const emailRef = useRef(null);
    useEffect(() => { emailRef.current?.focus(); }, [mode]);
    function switchMode(m) {
        setMode(m);
        setPin('');
        setError('');
        setPinError(false);
    }
    async function submit(e) {
        e.preventDefault();
        if (pin.trim().length < 4) {
            setPinError(true);
            setError('Please enter all 4 PIN digits');
            return;
        }
        setError('');
        setPinError(false);
        setLoading(true);
        try {
            const path = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
            const body = mode === 'signin'
                ? { email, pin }
                : { shopName, email, pin };
            const result = await api.post(path, body, false);
            saveAuth(result.token, result.user);
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            const msg = err.message || 'Something went wrong';
            setError(msg);
            if (msg.includes('PIN') || msg.includes('pin') || msg.includes('Invalid')) {
                setPinError(true);
                setPin('');
            }
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex", children: [_jsxs("div", { className: "hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden select-none", children: [_jsx("div", { className: "absolute -top-32 -left-32 w-96 h-96 rounded-full border border-white/5" }), _jsx("div", { className: "absolute -top-16 -left-16 w-80 h-80 rounded-full border border-white/5" }), _jsx("div", { className: "absolute bottom-10 right-0 w-64 h-64 rounded-full border border-white/5" }), _jsx("div", { className: "relative z-10", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/40", children: _jsxs("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }) }), _jsxs("div", { children: [_jsx("p", { className: "text-white font-black text-lg leading-tight tracking-wide", children: "Blessed Auto Spares" }), _jsx("p", { className: "text-red-400/60 text-[10px] uppercase tracking-widest font-semibold", children: "Web Portal" })] })] }) }), _jsxs("div", { className: "relative z-10 space-y-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-[52px] font-black text-white leading-[1.1] tracking-tight", children: ["Blessed Auto", _jsx("br", {}), _jsx("span", { className: "text-red-400", children: "Spares." })] }), _jsx("p", { className: "text-slate-400 mt-4 text-base leading-relaxed max-w-sm", children: "Sondu Nyamira's trusted source for genuine auto parts & accessories. Filters, oils, brakes, engine & electrical parts for Toyota, Nissan, Mitsubishi and more." }), _jsxs("div", { className: "flex items-center gap-2 mt-4", children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" }), _jsx("span", { className: "text-slate-500 text-xs", children: "Sondu, Nyamira County \u2014 Kenya" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" }), _jsx("span", { className: "text-slate-500 text-xs", children: "+254 700 225849" })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                    { icon: '🔧', label: 'Filters & Oils' },
                                    { icon: '⚙️', label: 'Brakes & Engine' },
                                    { icon: '☁️', label: 'Live Inventory' },
                                ].map(f => (_jsxs("div", { className: "bg-white/5 border border-white/8 rounded-2xl p-4 backdrop-blur-sm text-center", children: [_jsx("div", { className: "text-xl mb-2", children: f.icon }), _jsx("div", { className: "text-white/70 text-[11px] font-semibold leading-tight", children: f.label })] }, f.label))) }), _jsx("div", { className: "bg-white/5 border border-white/8 rounded-2xl px-5 py-4 backdrop-blur-sm", children: _jsx("p", { className: "text-white/60 text-xs leading-relaxed", children: "\"Quality parts, honest prices. Serving Nyamira County and the greater Kisii region.\"" }) })] }), _jsxs("p", { className: "relative z-10 text-slate-600 text-xs", children: ["\u00A9 ", new Date().getFullYear(), " Blessed Auto Spares \u00B7 Sondu Nyamira, Kenya"] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 lg:p-16", children: _jsxs("div", { className: "w-full max-w-[400px]", children: [_jsxs("div", { className: "flex flex-col items-center mb-8 lg:hidden", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mb-3 shadow-2xl", children: _jsxs("svg", { className: "w-7 h-7 text-white", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }) }), _jsx("h1", { className: "text-white text-xl font-black", children: "Blessed Auto Spares" }), _jsx("p", { className: "text-red-400/70 text-xs tracking-widest uppercase mt-1", children: "Sondu Nyamira, Kenya" })] }), _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl overflow-hidden", children: [_jsx("div", { className: "grid grid-cols-2 bg-slate-50 border-b border-slate-100", children: ['signin', 'register'].map(m => (_jsx("button", { type: "button", onClick: () => switchMode(m), className: `py-4 text-sm font-semibold transition-all ${mode === m
                                            ? 'bg-white text-red-600 border-b-2 border-red-600'
                                            : 'text-slate-400 hover:text-slate-600'}`, children: m === 'signin' ? 'Sign In' : 'Create Account' }, m))) }), _jsxs("form", { onSubmit: submit, className: "p-8 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-black text-slate-900", children: mode === 'signin' ? 'Welcome back' : 'Create account' }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: mode === 'signin'
                                                        ? 'Access your Blessed Auto Spares portal'
                                                        : 'Link your Blessed Auto Spares app account' })] }), mode === 'register' && (_jsx(FormField, { label: "Shop Name", children: _jsx("input", { type: "text", value: shopName, onChange: e => setShopName(e.target.value), placeholder: "Blessed Auto Spares", required: true, className: inputCls }) })), _jsx(FormField, { label: "Email Address", children: _jsx("input", { ref: emailRef, type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "you@example.com", required: true, className: inputCls }) }), _jsxs(FormField, { label: "4-Digit PIN", children: [_jsx(PinInput, { value: pin, onChange: v => { setPin(v); setPinError(false); setError(''); }, error: pinError }), _jsx("p", { className: "text-center text-xs text-slate-400 mt-2", children: mode === 'signin'
                                                        ? 'Use the same PIN as your mobile app'
                                                        : 'Choose a 4-digit PIN — also used in the app' })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-start gap-2", children: [_jsx("svg", { className: "w-4 h-4 mt-0.5 shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), error] })), _jsx("button", { type: "submit", disabled: loading || pin.replace(/\s/g, '').length < 4, className: "w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-[15px] shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2", children: loading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), mode === 'signin' ? 'Signing in…' : 'Creating account…'] })) : (mode === 'signin' ? 'Sign In →' : 'Create Account →') }), mode === 'signin' && (_jsxs("p", { className: "text-center text-xs text-slate-400", children: ["Forgot PIN?", ' ', _jsx("a", { href: "#", className: "text-red-500 hover:text-red-600 font-semibold", onClick: e => { e.preventDefault(); window.location.href = '/forgot-pin'; }, children: "Reset via email" })] }))] })] }), _jsx("p", { className: "text-slate-600 text-[11px] text-center mt-5", children: "Account created in the app? Sign in with the same email & PIN." })] }) })] }));
}
const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-slate-50 focus:bg-white';
function FormField({ label, children }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wider", children: label }), children] }));
}
