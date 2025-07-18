
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. INFORMACIÓN DEL RESPONSABLE",
      items: [
        { label: "Denominación", text: "PODOPALERMO" },
        { label: "Profesional responsable", text: "Lorena Miño" },
        { label: "Matrícula profesional", text: "[Completar número de matrícula]" },
        { label: "Domicilio", text: "Av. Santa Fe 3288, Planta Baja \"C\", Ciudad Autónoma de Buenos Aires" },
        { label: "Teléfono", text: "+54 9 11 6743-7969" },
        { label: "Email", text: "podopalermo@gmail.com" },
        { label: "Instagram", text: "@podopalermo" },
      ]
    },
    {
      title: "2. FINALIDAD DEL TRATAMIENTO DE DATOS",
      content: "En PODOPALERMO recopilamos y tratamos sus datos personales con las siguientes finalidades:",
      list: [
        "Gestión de turnos: Programación y confirmación de citas médicas",
        "Comunicación: Envío de recordatorios de turnos y comunicaciones relacionadas con el servicio",
        "Atención profesional: Brindar servicios de podología de calidad",
        "Administración: Gestión administrativa del consultorio",
        "Mejora del servicio: Optimización de nuestros procesos mediante análisis de datos",
      ]
    },
    {
      title: "3. DATOS PERSONALES RECOPILADOS",
      content: "Los datos personales que solicitamos son mínimos y necesarios para brindar nuestros servicios:",
      list: [
        "Datos de identificación: Nombre y apellido",
        "Datos de contacto: Número de teléfono celular",
        "Datos de comunicación: Conversaciones mantenidas a través de nuestro sistema de gestión de turnos",
      ],
      footer: "No recopilamos datos sensibles ni creamos historiales clínicos digitales."
    },
    {
      title: "4. MEDIOS DE RECOPILACIÓN",
      content: "Los datos se obtienen a través de:",
      list: [
        "Sistema propio de gestión de turnos: Chatbot con inteligencia artificial desarrollado específicamente para PODOPALERMO",
        "Comunicación directa: WhatsApp, llamadas telefónicas y email",
        "Redes sociales: Interacciones a través de Instagram (@podopalermo)",
      ]
    },
    {
      title: "5. ALMACENAMIENTO Y SEGURIDAD",
      subSections: [
        {
          subTitle: "Ubicación de los datos",
          content: "Sus datos personales se almacenan de forma segura en servicios en la nube de Google, que cumplen con estándares internacionales de seguridad y protección de datos."
        },
        {
          subTitle: "Medidas de seguridad",
          content: "Implementamos las siguientes medidas para proteger su información:",
          list: [
            "Acceso restringido: Solo el personal autorizado tiene acceso a los datos",
            "Cifrado: Los datos se almacenan con tecnología de cifrado",
            "Respaldos seguros: Copias de seguridad regulares en servidores protegidos",
            "Actualizaciones de seguridad: Mantenimiento constante de los sistemas de protección",
          ]
        }
      ]
    },
    {
      title: "6. PLAZO DE CONSERVACIÓN",
      content: "Los datos personales se conservan durante el tiempo necesario para cumplir con las finalidades establecidas y las obligaciones legales aplicables:",
      list: [
        "Datos de contacto: Mientras mantenga relación con nuestro consultorio",
        "Registros de comunicación: Según requerimientos legales aplicables al sector salud",
      ]
    },
    {
      title: "7. COMPARTICIÓN DE DATOS",
      content: "PODOPALERMO NO comparte sus datos personales con:",
      list: [
        "Obras sociales",
        "Otros profesionales de la salud",
        "Laboratorios",
        "Terceros no autorizados",
      ],
      footer: "Sus datos solo son utilizados internamente para los fines descritos en esta política."
    },
    {
      title: "8. DERECHOS DEL TITULAR",
      content: "Conforme a la Ley 25.326 de Protección de Datos Personales, usted tiene derecho a:",
      subSections: [
        { subTitle: "Derecho de acceso", content: "Conocer qué datos personales tenemos sobre usted y cómo los utilizamos." },
        { subTitle: "Derecho de rectificación", content: "Solicitar la corrección de datos inexactos o incompletos." },
        { subTitle: "Derecho de supresión", content: "Solicitar la eliminación de sus datos cuando ya no sean necesarios." },
        { subTitle: "Derecho de oposición", content: "Oponerse al tratamiento de sus datos para finalidades específicas." },
        { subTitle: "Derecho de portabilidad", content: "Solicitar la transferencia de sus datos en formato estructurado." },
        {
          subTitle: "Cómo ejercer sus derechos",
          content: "Para ejercer cualquiera de estos derechos, puede contactarnos por:",
          list: [
            "Email: podopalermo@gmail.com",
            "Teléfono: +54 9 11 6743-7969",
            "Presencialmente: Av. Santa Fe 3288, Planta Baja \"C\"",
          ]
        }
      ]
    },
    {
      title: "9. COMUNICACIONES Y RECORDATORIOS",
      subSections: [
        {
          subTitle: "WhatsApp",
          content: "Enviamos recordatorios de turnos y comunicaciones relacionadas con el servicio a través de WhatsApp. El uso de este canal implica su consentimiento para recibir estos mensajes."
        },
        {
          subTitle: "Email",
          content: "Ocasionalmente podemos enviar comunicaciones por email relacionadas con nuestros servicios."
        },
        {
          subTitle: "Cancelación de comunicaciones",
          content: "Puede solicitar la cancelación de estos envíos en cualquier momento contactándonos por los medios indicados."
        }
      ]
    },
    {
      title: "10. REDES SOCIALES",
      content: "Nuestra presencia en Instagram (@podopalermo) se rige por las políticas de privacidad de dicha plataforma. Las interacciones en redes sociales están sujetas a las condiciones de uso de cada plataforma."
    },
    {
      title: "11. COOKIES Y TECNOLOGÍAS SIMILARES",
      content: "Nuestro sistema de gestión de turnos puede utilizar tecnologías similares a las cookies para mejorar la experiencia del usuario y optimizar el funcionamiento del servicio."
    },
    {
      title: "12. MENORES DE EDAD",
      content: "No recopilamos intencionalmente datos de menores de 18 años sin el consentimiento expreso de sus padres o tutores legales."
    },
    {
      title: "13. MODIFICACIONES A ESTA POLÍTICA",
      content: "Nos reservamos el derecho de modificar esta Política de Privacidad. Los cambios serán notificados a través de nuestros canales de comunicación habituales y publicados en nuestras redes sociales."
    },
    {
      title: "14. MARCO LEGAL",
      content: "Esta Política de Privacidad se rige por:",
      list: [
        "Ley 25.326 - Ley de Protección de los Datos Personales",
        "Decreto 1558/2001 - Reglamentación de la Ley 25.326",
        "Disposiciones de la Agencia de Acceso a la Información Pública",
        "Normativas aplicables al ejercicio profesional de la podología",
      ]
    },
    {
      title: "15. CONTACTO",
      content: "Para cualquier consulta sobre esta Política de Privacidad o el tratamiento de sus datos personales:",
      items: [
        { text: "PODOPALERMO" },
        { label: "Responsable", text: "Lorena Miño" },
        { label: "Dirección", text: "Av. Santa Fe 3288, Planta Baja \"C\", CABA" },
        { label: "Teléfono", text: "+54 9 11 6743-7969" },
        { label: "Email", text: "podopalermo@gmail.com" },
        { label: "Instagram", text: "@podopalermo" },
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl font-headline font-semibold text-primary">Política de Privacidad</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">PODOPALERMO</CardTitle>
          <p className="text-sm text-muted-foreground">
            <strong>Fecha de última actualización:</strong> 13 de junio de 2025
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">{section.title}</h2>
              {typeof section.content === 'string' && <p className="text-foreground/80 leading-relaxed">{section.content}</p>}
              
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

              {section.subSections && section.subSections.map((sub, subIndex) => (
                <div key={subIndex} className="pl-4 space-y-2 mt-3">
                  <h3 className="text-lg font-medium text-foreground/90">{sub.subTitle}</h3>
                  {typeof sub.content === 'string' && <p className="text-foreground/80 leading-relaxed">{sub.content}</p>}
                  {sub.list && (
                    <ul className="list-disc list-inside space-y-1 pl-4 text-foreground/80">
                      {sub.list.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}

              {section.footer && <p className="text-sm text-muted-foreground pt-2">{section.footer}</p>}
              {index < sections.length -1 && <Separator className="my-6 !mt-8" />}
            </div>
          ))}
          
          <Separator className="my-6 !mt-8" />
          <p className="text-xs text-muted-foreground italic text-center pt-4">
              Esta Política de Privacidad ha sido elaborada en cumplimiento de la legislación argentina vigente en materia de protección de datos personales y está adaptada específicamente para las actividades de PODOPALERMO.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    