"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, KeyRound, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const AUTHORIZED_EMAIL = "nicedocesabor@gmail.com";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Estados de Senha
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Campos do formulário
  const [email, setEmail] = useState<string>(AUTHORIZED_EMAIL);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    // 1. Checa se já está logado na sessão atual
    const sessionAuth = sessionStorage.getItem("nice_admin_authenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }

    // 2. Checa se a cliente já cadastrou alguma senha anteriormente
    const registeredPass = localStorage.getItem("nice_admin_registered_pass");
    if (registeredPass) {
      setHasPassword(true);
    } else {
      setHasPassword(false);
      setIsResetting(true); // Começa direto no cadastro de senha no primeiro acesso
    }

    setIsCheckingSession(false);
  }, []);

  const handleRegisterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (email.trim().toLowerCase() !== AUTHORIZED_EMAIL) {
      setErrorMsg(`O e-mail cadastrado deve ser ${AUTHORIZED_EMAIL}`);
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg("A senha deve conter no mínimo 4 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("As senhas digitadas não coincidem. Por favor, verifique.");
      return;
    }

    // Salva a senha cadastrada
    localStorage.setItem("nice_admin_registered_pass", password);
    sessionStorage.setItem("nice_admin_authenticated", "true");
    setHasPassword(true);
    setIsResetting(false);
    setSuccessMsg("Senha cadastrada com sucesso! Entrando no painel...");

    setTimeout(() => {
      setIsAuthenticated(true);
    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (email.trim().toLowerCase() !== AUTHORIZED_EMAIL) {
      setErrorMsg(`E-mail inválido. O e-mail autorizado é ${AUTHORIZED_EMAIL}`);
      return;
    }

    const savedPass = localStorage.getItem("nice_admin_registered_pass");

    if (password === savedPass) {
      sessionStorage.setItem("nice_admin_authenticated", "true");
      setSuccessMsg("Acesso autorizado! Carregando...");
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 500);
    } else {
      setErrorMsg("Senha incorreta. Tente novamente ou redefina sua senha.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("nice_admin_authenticated");
    setIsAuthenticated(false);
    setPassword("");
    setConfirmPassword("");
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FFF5FA] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nice-pink" />
      </div>
    );
  }

  // Se estiver autenticado, exibe a interface do Admin
  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Barra superior de status do usuário autenticado */}
        <div className="bg-nice-wine text-white px-4 py-1.5 text-[11px] sm:text-xs flex items-center justify-between border-b border-pink-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Logada como: <strong>Eunice Pereira</strong> ({AUTHORIZED_EMAIL})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsResetting(true);
                setIsAuthenticated(false);
              }}
              className="text-pink-200 hover:text-white underline transition"
            >
              Trocar Senha
            </button>
            <button
              onClick={handleLogout}
              className="px-2 py-0.5 rounded bg-pink-700/60 hover:bg-pink-700 text-white font-bold transition"
            >
              Sair
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // TELA DE LOGIN E CADASTRO DE SENHA (PRIMEIRO ACESSO)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF0F7] via-[#FFF5FA] to-[#FFE8F3] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-2 border-pink-200/80 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Detalhes de Luxo no Fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Logo e Título */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-20 h-20 mx-auto rounded-full border-4 border-nice-pink p-1 shadow-lg shadow-pink-500/20 bg-white">
            <Image
              src="/logo.jpg"
              alt="Nice Doce Sabor"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-nice-pink-light text-nice-pink border border-pink-200 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel da Dona
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-nice-wine tracking-tight">
              Nice Doce Sabor
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isResetting || !hasPassword
                ? "Cadastre sua senha pessoal de acesso"
                : "Entre com seu e-mail e senha para gerenciar a loja"}
            </p>
          </div>
        </div>

        {/* Feedback de Erro ou Sucesso */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORMULÁRIO 1: CADASTRO DE SENHA (PRIMEIRO ACESSO OU REDEFINIÇÃO) */}
        {isResetting || !hasPassword ? (
          <form onSubmit={handleRegisterPassword} className="space-y-4 relative z-10">
            <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-100 text-xs text-nice-wine space-y-1">
              <div className="font-bold flex items-center gap-1 text-nice-pink">
                <Sparkles className="w-4 h-4" />
                <span>Olá, Eunice!</span>
              </div>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                Digite a senha que você deseja usar para entrar no painel sempre que acessar.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                E-mail do Administrador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-pink-200 rounded-2xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Criar Nova Senha
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-pink-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Repita a senha digitada"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-pink-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-nice-pink to-pink-600 hover:from-pink-600 hover:to-nice-pink text-white text-xs font-bold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Cadastrar Senha e Acessar</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasPassword && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(false);
                    setErrorMsg("");
                  }}
                  className="text-xs text-gray-500 hover:text-nice-pink transition"
                >
                  Já tenho minha senha cadastrada • Fazer login
                </button>
              </div>
            )}
          </form>
        ) : (
          /* FORMULÁRIO 2: LOGIN COM SENHA EXISTENTE */
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-pink-200 rounded-2xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(true);
                    setErrorMsg("");
                  }}
                  className="text-[11px] text-nice-pink hover:underline"
                >
                  Esqueci / Redefinir Senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Sua senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-pink-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-nice-pink"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-nice-pink to-pink-600 hover:from-pink-600 hover:to-nice-pink text-white text-xs font-bold shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>Entrar no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Link para voltar ao cardápio público */}
        <div className="text-center pt-2 border-t border-pink-100 relative z-10">
          <Link
            href="/"
            className="text-xs text-nice-pink hover:text-nice-pink-hover font-semibold transition"
          >
            ← Voltar para o Cardápio dos Clientes
          </Link>
        </div>
      </div>
    </div>
  );
}
