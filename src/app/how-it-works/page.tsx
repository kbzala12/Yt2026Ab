
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Gift, Bot, CheckCircle, ArrowDown } from 'lucide-react';

export default function HowItWorksPage() {
    return (
        <div className="w-full py-8 px-4">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        How It Works?
                    </CardTitle>
                    <CardDescription>
                        A simple guide to using our platform and earning coins.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    
                    <div className="flex flex-col items-center">
                        <StepCard
                            icon={Coins}
                            title="1. Watch Videos & Earn Coins"
                            description="Watch the videos available on the home page. You will be rewarded with 30 coins for every 3 minutes of watch time."
                        />

                        <ArrowDown className="w-8 h-8 text-muted-foreground my-2" />

                        <StepCard
                            icon={Gift}
                            title="2. Claim Daily Bonus"
                            description="Don't forget to claim your daily bonus of 10 coins by logging in every day! You can claim it from the 'Daily Bonus' page."
                        />

                        <ArrowDown className="w-8 h-8 text-muted-foreground my-2" />

                        <StepCard
                            icon={Bot}
                            title="3. Submit New Videos"
                            description="Once you have accumulated 1280 coins, you can submit a new YouTube video link by visiting the 'Submit URL' page."
                        />

                        <ArrowDown className="w-8 h-8 text-muted-foreground my-2" />

                        <StepCard
                            icon={CheckCircle}
                            title="4. Review and Approval"
                            description="Your submitted video will be reviewed by our team. If it follows our guidelines, it will be approved and made available for everyone on the home page."
                        />
                    </div>

                    <div className="p-4 text-center bg-destructive/10 text-destructive rounded-lg">
                        <p className="font-bold">Remember:</p>
                        <p className="text-sm">You can earn a maximum of 1500 coins per day by watching videos.</p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}

interface StepCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg w-full">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);
