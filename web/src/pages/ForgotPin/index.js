import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
export function ForgotPinPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    async function submit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-pin', { email }, false);
            setSent(true);
        }
        catch (err) {
            setError(err.message || 'Failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden", children: [_jsxs("div", { className: "bg-red-600 px-6 py-7 flex flex-col items-center gap-2", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-1", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }), _jsx("h1", { className: "text-white font-black text-xl", children: "Reset Your PIN" }), _jsx("p", { className: "text-red-100 text-xs text-center", children: "Enter your email and we'll send a reset link" })] }), sent ? (_jsxs("div", { className: "p-8 flex flex-col items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-green-100 flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-green-500", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), _jsx("p", { className: "text-slate-700 font-semibold text-center", children: "Email sent!" }), _jsx("p", { className: "text-slate-400 text-sm text-center leading-relaxed", children: "Check your inbox for a PIN reset link. It expires in 15 minutes." }), _jsx(Link, { to: "/login", className: "mt-2 w-full h-11 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center", children: "Back to Sign In" })] })) : (_jsxs("form", { onSubmit: submit, className: "p-8 space-y-5", children: [_jsx("p", { className: "text-slate-500 text-sm leading-relaxed", children: "Enter the email linked to your account and we'll send a secure PIN reset link." }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "you@example.com", required: true, className: "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 focus:bg-white transition" })] }), error && _jsx("p", { className: "text-sm text-red-500 font-medium", children: error }), _jsxs("button", { type: "submit", disabled: loading, className: "w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2", children: [loading && (_jsxs("svg", { className: "w-4 h-4 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] })), loading ? 'Sending…' : 'Send Reset Link'] }), _jsx(Link, { to: "/login", className: "block text-center text-sm text-slate-400 hover:text-slate-600 transition-colors", children: "\u2190 Back to Sign In" })] }))] }) }));
}
