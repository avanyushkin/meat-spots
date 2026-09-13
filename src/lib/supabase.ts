import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const clientAuthEmail = import.meta.env.VITE_CLIENT_AUTH_EMAIL as string;

if (!supabaseUrl || !supabaseAnonKey || !clientAuthEmail) {
  throw new Error(
    "Missing Supabase env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLIENT_AUTH_EMAIL"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function login(password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: clientAuthEmail,
    password,
  });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Не удалось войти");
  }
  return data.session;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function restoreSession(refreshToken: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) return null;
  return data.session;
}
