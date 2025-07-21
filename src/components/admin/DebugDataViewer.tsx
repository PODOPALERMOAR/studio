'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bug, X } from 'lucide-react';

interface DebugDataViewerProps {
  data: any;
  title?: string;
}

export default function DebugDataViewer({ data, title = 'Debug Data' }: DebugDataViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm"
        className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bug className="h-4 w-4 mr-2" />
        {isOpen ? 'Cerrar Debug' : 'Ver Datos Raw'}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-16 right-4 w-[90vw] max-w-2xl max-h-[80vh] overflow-auto p-4 bg-gray-900 text-gray-100 border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data, (key, value) => {
              // Formatear fechas para mejor legibilidad
              if (value instanceof Date) {
                return `Date: ${value.toISOString()}`;
              }
              return value;
            }, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}