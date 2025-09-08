import { supabase } from '../../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  error?: string;
}

export const validateSupabaseSession = async (): Promise<SessionValidationResult> => {
  try {
    console.log('Mobile sync: Starting session validation...');

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Mobile sync: Session validation error:', {
        message: error.message,
        code: error.status,
        platform: 'mobile'
      });
      return { isValid: false, session: null, error: error.message };
    }

    if (!session) {
      console.log('Mobile sync: No active session found');
      return { isValid: false, session: null, error: 'No active session' };
    }

    console.log('Mobile sync: Session found, checking expiration...', {
      userId: session.user.id,
      expiresAt: session.expires_at
    });

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('Mobile sync: Session expired, attempting refresh...', {
        expiredAt: session.expires_at,
        currentTime: now,
        platform: 'mobile'
      });

      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        console.error('Mobile sync: Session refresh failed:', {
          error: refreshError?.message,
          platform: 'mobile',
          userId: session.user.id
        });
        return { isValid: false, session: null, error: 'Session expired and refresh failed' };
      }

      console.log('Mobile sync: Session refreshed successfully', {
        userId: refreshData.session.user.id,
        newExpiresAt: refreshData.session.expires_at,
        platform: 'mobile'
      });
      return { isValid: true, session: refreshData.session };
    }

    console.log('Mobile sync: Session is valid and not expired', {
      userId: session.user.id,
      timeRemaining: session.expires_at ? session.expires_at - now : 'no expiration',
      platform: 'mobile'
    });
    return { isValid: true, session };

  } catch (error) {
    console.error('Mobile sync: Session validation exception:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      platform: 'mobile'
    });
    return {
      isValid: false,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown session validation error'
    };
  }
};

export const logSessionStatus = async (context: string): Promise<void> => {
  const result = await validateSupabaseSession();
  console.log(`Mobile sync: Session status for ${context}:`, {
    isValid: result.isValid,
    hasSession: !!result.session,
    error: result.error,
    platform: 'mobile'
  });
};
