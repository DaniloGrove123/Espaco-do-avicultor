
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-center p-6">
      <h1 className="text-9xl font-extrabold text-sky-600">404</h1>
      <p className="text-2xl md:text-3xl font-semibold text-slate-800 mt-4">
        Página Não Encontrada
      </p>
      <p className="text-slate-600 mt-2 mb-8">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors duration-150"
      >
        Voltar para o Dashboard
      </Link>
    </div>
  );
};
