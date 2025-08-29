
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Gift, Check } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { claimDailyBonus, getUserData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  coins: number;
  lastDailyBonusClaimDate?: string;
}

export default function DailyClaimPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isClaimedToday = useCallback(() => {
    if (!user?.lastDailyBonusClaimDate) return false;
    const today = format(new Date(), 'yyyy-MM-dd');
    return user.lastDailyBonusClaimDate === today;
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserString = localStorage.getItem('user');
      if (!storedUserString) {
        setError('You must be logged in to view this page.');
        setIsLoading(false);
        return;
      }

      try {
        const storedUser = JSON.parse(storedUserString);
        const result = await getUserData(storedUser.id);
        
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          setError(result.error || 'Failed to fetch user data.');
        }
      } catch (e) {
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleClaim = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const result = await claimDailyBonus(user.id);
      if (result.success && result.user) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setUser(result.user); // Update user state with new data
        localStorage.setItem('user', JSON.stringify(result.user));
      } else {
        toast({
          title: 'Already Claimed',
          description: result.error || 'Could not claim bonus.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    if (error) {
      return <div className="text-red-500 text-center py-10">{error}</div>;
    }
    if (user) {
      return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                 <div className="p-6 bg-yellow-400 rounded-full inline-block animate-pulse">
                    <Gift className="h-16 w-16 text-white" />
                 </div>
            </div>

          <h2 className="text-2xl font-bold">Get your daily 10 coins!</h2>
          <p className="text-muted-foreground">
            Come back every day to claim your free bonus coins.
          </p>

          <Button 
            onClick={handleClaim} 
            disabled={isProcessing || isClaimedToday()}
            size="lg"
            className={cn(
              "w-full max-w-xs",
              isClaimedToday() && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isClaimedToday() ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Claimed Today
              </>
            ) : (
              'Claim Now'
            )}
          </Button>

           <div className="pt-4 text-sm text-muted-foreground">
                <p>Your current balance: {user.coins.toLocaleString()} 💰</p>
            </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center text-center">
            <Star />
            Daily Bonus
          </CardTitle>
          <CardDescription className="text-center">
            A special reward for your daily visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
