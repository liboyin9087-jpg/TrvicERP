import { createAnonClient } from './supabase.ts';

export async function requireUser(req: Request): Promise<{ userId: string; authHeader: string } | null> {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  try {
    const supabase = createAnonClient(authHeader);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return { userId: data.user.id, authHeader };
  } catch {
    return null;
  }
}
