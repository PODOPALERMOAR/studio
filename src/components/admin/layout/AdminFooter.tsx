'use client';

import { Heart, Clock } from 'lucide-react';

export default function AdminFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>© 2025 PODOPALERMO</span>
            <span>•</span>
            <span>Panel de Administración</span>
            <span>•</span>
            <span className="flex items-center">
              Hecho con <Heart className="h-4 w-4 text-red-500 mx-1" /> para el cuidado de tus pies
            </span>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <Clock className="h-4 w-4 mr-1" />
            <span>Última actualización: {new Date().toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}