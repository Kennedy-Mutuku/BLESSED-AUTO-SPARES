import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, saveAuth } from '@/lib/api';
export function ResetPinPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token') ?? '';
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirm] = useState('');
    const [step, setStep] = useState(token ? 'form' : 'invalid');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    async function submit(e) {
        e.preventDefault();
        if (pin !== confirmPin)
            return setError('PINs do not match');
        if (!/^\d{4}$/.test(pin))
            return setError('PIN must be exactly 4 digits');
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/reset-pin', { token, newPin: pin }, false);
            if (res.token) {
                // Auto-login after reset
                const user = await api.post('/api/auth/verify-token', { token: res.token }, false);
                saveAuth(res.token, user.user);
            }
            setStep('success');
        }
        catch (err) {
            if (err.message?.includes('expired') || err.message?.includes('invalid')) {
                setStep('invalid');
            }
            else {
                setError(err.message || 'Reset failed');
            }
        }
        finally {
            setLoading(false);
        }
    }
    if (step === 'invalid')
        return (_jsx(CenteredCard, { children: _jsxs("div", { className: "flex flex-col items-center gap-4 py-4", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-red-100 flex items-center justify-center", children: _jsx("svg", { className: "w-7 h-7 text-red-500", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) }), _jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Link Expired" }), _jsx("p", { className: "text-slate-500 text-sm text-center", children: "This reset link is invalid or has expired. Please request a new one from the app." }), _jsx("button", { onClick: () => navigate('/login'), className: "mt-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors", children: "Back to Login" })] }) }));
    if (step === 'success')
        return (_jsx(CenteredCard, { children: _jsxs("div", { className: "flex flex-col items-center gap-4 py-4", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-green-100 flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-green-500", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-xl font-bold text-slate-800", children: "PIN Reset!" }), _jsx("p", { className: "text-slate-500 text-sm text-center", children: "Your new PIN is active. You can now log in on your app with the new PIN." }), _jsx("button", { onClick: () => navigate('/', { replace: true }), className: "mt-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors", children: "Go to Dashboard" })] }) }));
    return (_jsxs(CenteredCard, { children: [_jsxs("div", { className: "bg-red-600 -mx-8 -mt-8 px-8 py-6 flex flex-col items-center gap-1 mb-6 rounded-t-3xl", children: [_jsx("div", { className: "w-11 h-11 rounded-full bg-white/20 flex items-center justify-center mb-1", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" }) }) }), _jsx("h1", { className: "text-white font-bold text-lg", children: "Set New PIN" }), _jsx("p", { className: "text-red-100 text-xs", children: "Choose a 4-digit PIN for your app" })] }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsx(PinField, { label: "New PIN (4 digits)", value: pin, onChange: setPin }), _jsx(PinField, { label: "Confirm PIN", value: confirmPin, onChange: setConfirm }), error && (_jsx("p", { className: "text-sm text-red-500 font-medium", children: error })), _jsxs("button", { type: "submit", disabled: loading, className: "w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2", children: [loading && (_jsxs("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] })), loading ? 'Saving…' : 'Save New PIN'] })] })] }));
}
function PinField({ label, value, onChange }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wide", children: label }), _jsx("input", { type: "password", inputMode: "numeric", maxLength: 4, value: value, onChange: e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4)), placeholder: "\u2022\u2022\u2022\u2022", required: true, className: "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 focus:bg-white transition tracking-[0.5em] text-center text-lg font-bold" })] }));
}
function CenteredCard({ children }) {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4", children: _jsx("div", { className: "bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm", children: children }) }));
}
