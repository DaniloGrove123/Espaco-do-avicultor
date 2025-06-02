
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, ArrowPathIcon } from '../constants';

export const PasswordRecoveryPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl text-center">
        <ArrowPathIcon className="mx-auto h-12 w-12 text-sky-600" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Recuperação de Senha
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Esta funcionalidade é simulada. Em uma aplicação real, você receberia instruções por e-mail para redefinir sua senha.
        </p>
        <div className="mt-5">
          <p className="text-xs text-slate-500">
            Para fins de demonstração, o login é: <br />
            Usuário: <strong>admin</strong> <br />
            Senha: <strong>admin123</strong>
          </p>
        </div>
        <div className="mt-8">
          <Link
            to="/login"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            Voltar para Login
          </Link>
        </div>
         <p className="mt-4 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </div>
  );
};