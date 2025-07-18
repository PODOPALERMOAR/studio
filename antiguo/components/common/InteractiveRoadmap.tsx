
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, GitFork, Zap } from 'lucide-react'; // Zap for 'Próximamente'
import { cn } from '@/lib/utils';

interface RoadmapStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  details?: string[]; // Details to show on expand
}

const initialRoadmapData: RoadmapStep[] = [
  {
    id: 'consulta',
    title: 'Consulta Inicial y Diagnóstico',
    icon: CheckCircle,
    description: 'Evaluación completa para entender tus necesidades y definir el mejor plan de tratamiento.',
    status: 'completed',
    details: [
      'Análisis postural y de la marcha.',
      'Estudio de antecedentes médicos.',
      'Diagnóstico preciso de la afección podológica.',
    ],
  },
  {
    id: 'tratamiento',
    title: 'Tratamientos Personalizados',
    icon: CheckCircle,
    description: 'Aplicación de tratamientos específicos utilizando tecnología avanzada y técnicas actualizadas.',
    status: 'current',
    details: [
      'Onicocriptosis (uña encarnada).',
      'Verrugas plantares.',
      'Helomas (callos) y durezas.',
      'Pie diabético y cuidado preventivo.',
    ],
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento y Prevención',
    icon: Zap,
    description: 'Planes de seguimiento para asegurar la recuperación y prevenir futuras complicaciones.',
    status: 'upcoming',
    details: [
      'Educación sobre cuidado del pie.',
      'Recomendaciones de calzado.',
      'Visitas de control programadas.',
    ],
  },
  {
    id: 'bienestar',
    title: 'Bienestar Integral del Pie',
    icon: Zap,
    description: 'Servicios complementarios para el confort y la salud general de tus pies.',
    status: 'upcoming',
    details: [
      'Ortesis de silicona personalizadas.',
      'Estudios biomecánicos.',
      'Asesoramiento para deportistas.',
    ],
  },
];

export function InteractiveRoadmap() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [roadmapData] = useState<RoadmapStep[]>(initialRoadmapData);

  const toggleStep = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  return (
    <div className="w-full p-2 md:p-4 space-y-4">
      {roadmapData.map((step, index) => (
        <Card
          key={step.id}
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            step.status === 'completed' ? 'bg-green-50 border-green-200' :
            step.status === 'current' ? 'bg-blue-50 border-blue-200' :
            'bg-gray-50 border-gray-200',
            expandedStep === step.id ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
          )}
        >
          <CardHeader
            className="flex flex-row items-center justify-between p-3 cursor-pointer"
            onClick={() => toggleStep(step.id)}
          >
            <div className="flex items-center space-x-3">
              <step.icon
                className={cn(
                  "h-6 w-6",
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'current' ? 'text-blue-600' :
                  'text-gray-500'
                )}
              />
              <CardTitle className="text-sm md:text-base font-semibold text-foreground">
                {step.title}
              </CardTitle>
            </div>
            <GitFork
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                expandedStep === step.id ? "rotate-90" : ""
              )}
            />
          </CardHeader>
          {expandedStep === step.id && (
            <CardContent className="p-3 pt-0 animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">{step.description}</p>
              {step.details && step.details.length > 0 && (
                <ul className="list-disc list-inside pl-2 space-y-1 text-xs text-muted-foreground/80">
                  {step.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          )}
        </Card>
      ))}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Haz clic en cada etapa para ver más detalles.
      </p>
    </div>
  );
}
