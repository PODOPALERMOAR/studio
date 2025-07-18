import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2">
      <title>Google</title>
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-1.54 3.23-3.48 3.23-2.05 0-3.72-1.7-3.72-3.72s1.67-3.72 3.72-3.72c.98 0 1.86.36 2.53.97l2.2-2.2c-1.43-1.34-3.24-2.18-5.38-2.18-4.4 0-7.98 3.58-7.98 7.98s3.58 7.98 7.98 7.98c4.04 0 7.3-2.72 7.3-7.52 0-.5-.05-.95-.14-1.4H12.48z"
        fill="currentColor"
      />
    </svg>
);
  

export default function LoginPage() {
    return (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow flex items-center justify-center bg-background p-4">
              <Card className="w-full max-w-md mx-auto shadow-lg">
                  <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-headline">Access Your Account</CardTitle>
                      <CardDescription>
                          Continue with Google or your phone to manage your appointments.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full">
                          <GoogleIcon />
                          <span>Continue with Google</span>
                      </Button>
                      <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" type="tel" placeholder="+54 9 11 1234-5678" required />
                      </div>
                      <Button className="w-full">Send Code</Button>
                      <p className="text-xs text-center text-muted-foreground px-4">
                          By continuing, you agree to our{" "}
                          <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>.
                      </p>
                  </CardContent>
              </Card>
          </main>
          <Footer />
        </div>
    );
}
