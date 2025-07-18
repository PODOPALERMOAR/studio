import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © {new Date().getFullYear()} Foot Haven. All Rights Reserved.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    )
}
