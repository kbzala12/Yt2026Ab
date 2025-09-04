
"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000); // 2 seconds

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {isLoading && (
                <div 
                    className={cn(
                        "fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
                        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="text-center animate-fade-in-up">
                        <h1 className="text-6xl font-bold text-primary mb-4">kbyt</h1>
                        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                    </div>
                </div>
            )}
            {!isLoading && (
                 <div className="animate-fade-in-up">
                    {children}
                 </div>
            )}
        </>
    );
}
