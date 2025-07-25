import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const products = [
    { id: 1, name: "Plantillas Ortopédicas", price: "$49.99", image: "https://placehold.co/400x300.png", hint: "shoe insoles" },
    { id: 2, name: "Crema Antimicótica", price: "$19.99", image: "https://placehold.co/400x300.png", hint: "foot cream" },
    { id: 3, name: "Medias de Compresión", price: "$24.99", image: "https://placehold.co/400x300.png", hint: "compression socks" },
    { id: 4, name: "Masajeador de Pies", price: "$89.99", image: "https://placehold.co/400x300.png", hint: "foot massager" },
    { id: 5, name: "Set de Cortaúñas", price: "$15.99", image: "https://placehold.co/400x300.png", hint: "nail clippers" },
    { id: 6, name: "Máscara Hidratante para Pies", price: "$22.50", image: "https://placehold.co/400x300.png", hint: "foot mask" },
    { id: 7, name: "Protectores de Talón", price: "$12.99", image: "https://placehold.co/400x300.png", hint: "heel protector" },
    { id: 8, name: "Pantuflas Aprobadas por Podólogos", price: "$55.00", image: "https://placehold.co/400x300.png", hint: "comfortable slippers" },
];

export default function MarketplacePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto py-10 px-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold font-headline">Tienda de Afiliados</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Productos recomendados para la salud de tus pies. Como afiliados de Amazon, ganamos por compras calificadas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader className="p-0">
                                <Image src={product.image} alt={product.name} width={400} height={300} className="w-full h-48 object-cover" data-ai-hint={product.hint} />
                            </CardHeader>
                            <CardContent className="flex-grow p-4">
                                <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                                <p className="text-xl font-bold text-primary mt-2">{product.price}</p>
                            </CardContent>
                            <CardFooter className="p-4 bg-gray-50 dark:bg-gray-800">
                                <Button asChild className="w-full">
                                    <Link href="https://amazon.com" target="_blank" rel="noopener noreferrer">Comprar en Amazon</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    )
}
