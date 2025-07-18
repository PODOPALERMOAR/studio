
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage() {
  const clinicName = "PODOPALERMO";
  const clinicEmail = "podopalermo@gmail.com";
  const clinicPhone = "+54 9 11 6743-7969";
  const clinicAddress = "Av. Santa Fe 3288, Planta Baja \"C\", Ciudad Autónoma de Buenos Aires";
  const lastUpdatedDate = "13 de junio de 2025";

  const sections = [
    {
      title: "1. ACEPTACIÓN DE LOS TÉRMINOS",
      content: `Bienvenido/a a ${clinicName}. Estos Términos y Condiciones ("Términos") rigen el uso de nuestros servicios de agendamiento de turnos online y cualquier otro servicio relacionado (colectivamente, el "Servicio") proporcionado por ${clinicName} ("nosotros", "nuestro"). Al acceder o utilizar nuestro Servicio, usted ("Usuario", "usted") acepta estar legalmente vinculado por estos Términos. Si no está de acuerdo con alguna parte de los Términos, no podrá utilizar nuestro Servicio.`
    },
    {
      title: "2. DESCRIPCIÓN DEL SERVICIO",
      content: `El Servicio permite a los usuarios buscar disponibilidad de turnos, agendar, y gestionar citas con los profesionales de ${clinicName}. Nos esforzamos por mantener la información de disponibilidad actualizada, pero no garantizamos la disponibilidad en tiempo real hasta la confirmación final de la cita.`
    },
    {
      title: "3. REGISTRO Y DATOS DEL USUARIO",
      content: `Para utilizar ciertas funciones del Servicio, como agendar un turno, es posible que deba proporcionar información personal, incluyendo nombre, apellido y número de teléfono. Usted se compromete a proporcionar información veraz, actual y completa. El tratamiento de sus datos personales se rige por nuestra Política de Privacidad, que forma parte integrante de estos Términos.`
    },
    {
      title: "4. AGENDAMIENTO Y CANCELACIÓN DE TURNOS",
      list: [
        `Confirmación: Una vez que agende un turno, recibirá una confirmación. Esta confirmación no garantiza la prestación del servicio si existen circunstancias imprevistas que impidan al profesional atender.`,
        `Cancelaciones por el Usuario: Le solicitamos que, en caso de no poder asistir a un turno confirmado, lo cancele con la mayor antelación posible a través de los canales de comunicación provistos o contactándose directamente con nosotros. Esto permite que otros pacientes puedan acceder a ese horario.`,
        `Cancelaciones por ${clinicName}: Nos reservamos el derecho de cancelar o reprogramar turnos debido a circunstancias imprevistas o de fuerza mayor, notificándole con la mayor antelación posible.`,
        `Faltas a las citas (No Show): Ausentarse a una cita sin previo aviso podría estar sujeto a políticas internas del consultorio. Le recomendamos consultar directamente con ${clinicName} para más información sobre este aspecto.`
      ]
    },
    {
      title: "5. USO ACEPTABLE DEL SERVICIO",
      content: "Usted se compromete a utilizar el Servicio de manera responsable y para los fines previstos. No deberá:",
      list: [
        "Utilizar el Servicio para fines ilegales o no autorizados.",
        "Proporcionar información falsa o engañosa.",
        "Intentar interferir con el funcionamiento adecuado del Servicio.",
        "Agendar múltiples turnos de manera especulativa o fraudulenta."
      ]
    },
    {
      title: "6. PROPIEDAD INTELECTUAL",
      content: `Todo el contenido presente en el Servicio, incluyendo textos, gráficos, logos, íconos, imágenes, y software, es propiedad de ${clinicName} o sus licenciantes y está protegido por las leyes de propiedad intelectual. No se concede ningún derecho o licencia sobre dicho contenido, excepto lo expresamente permitido en estos Términos.`
    },
    {
      title: "7. LIMITACIÓN DE RESPONSABILIDAD",
      content: `${clinicName} no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de uso del Servicio, incluyendo, entre otros, la confianza depositada por el Usuario en cualquier información obtenida del Servicio, o que resulten de errores, omisiones, interrupciones, eliminación de archivos o correo electrónico, defectos, virus, demoras en la operación o transmisión, o cualquier falla de rendimiento. La información proporcionada sobre disponibilidad de turnos es orientativa y puede estar sujeta a cambios sin previo aviso.`
    },
    {
      title: "8. MODIFICACIONES A LOS TÉRMINOS",
      content: `Nos reservamos el derecho de modificar estos Términos en cualquier momento. Cualquier cambio será efectivo inmediatamente después de su publicación en nuestro sitio web o a través del Servicio. Se indicará la fecha de "Última actualización" al inicio de estos Términos. Su uso continuado del Servicio después de la publicación de los cambios constituirá su aceptación de dichos cambios. Le recomendamos revisar estos Términos periódicamente.`
    },
    {
      title: "9. LEY APLICABLE Y JURISDICCIÓN",
      content: `Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República Argentina. Cualquier disputa que surja en relación con estos Términos estará sujeta a la jurisdicción exclusiva de los tribunales competentes de la Ciudad Autónoma de Buenos Aires, República Argentina.`
    },
    {
      title: "10. CONTACTO",
      content: `Si tiene alguna pregunta sobre estos Términos y Condiciones, puede contactarnos a:`,
      items: [
        { label: "Email", text: clinicEmail },
        { label: "Teléfono", text: clinicPhone },
        { label: "Dirección", text: clinicAddress }
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl font-headline font-semibold text-primary">Términos y Condiciones</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">{clinicName}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            <strong>Fecha de última actualización:</strong> {lastUpdatedDate}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">{section.title}</h2>
              {section.content && <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{section.content}</p>}
              
              {section.list && (
                <ul className="list-disc list-inside space-y-1 pl-4 text-foreground/80">
                  {section.list.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}

              {section.items && section.items.map((item, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed">
                  {item.label && <strong>{item.label}: </strong>}
                  {item.text}
                </p>
              ))}
              {index < sections.length - 1 && <Separator className="my-6 !mt-8" />}
            </div>
          ))}
          
          <Separator className="my-6 !mt-8" />
          <p className="text-xs text-muted-foreground italic text-center pt-4">
              Estos Términos y Condiciones han sido elaborados para regular el uso de los servicios de {clinicName}. Le recomendamos leerlos atentamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
