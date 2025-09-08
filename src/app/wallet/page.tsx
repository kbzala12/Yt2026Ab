
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getUserData } from '@/app/actions';

interface User {
  id: string;
  username: string;
  coins: number;
}

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
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
        // Also update localStorage with the freshest data
        localStorage.setItem('user', JSON.stringify(result.user));
      } else {
        setError(result.error || 'Failed to fetch user data.');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className="w-full py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon />
            My Wallet
          </CardTitle>
          <CardDescription>View your coin balance and activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-6 bg-destructive text-destructive-foreground rounded-lg shadow-lg">
                <div>
                  <p className="text-sm opacity-80">Welcome, {user.username}</p>
                  <p className="text-sm opacity-80">Total Balance</p>
                  <p className="text-4xl font-bold">{user.coins.toLocaleString()}</p>
                </div>
                <p className="text-5xl">💰</p>
              </div>
              <h3 className="text-lg font-semibold pt-4">Coin History</h3>
              <div className="text-center text-muted-foreground py-10 border rounded-lg">
                <p>No transaction history to show.</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
