import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ckpqjledxzroqweebmaa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcHFqbGVkeHpyb3F3ZWVibWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTAxOTksImV4cCI6MjA5MzI4NjE5OX0.W-W6r928B8PCPdiEnxyPYuB9S_Dr1s79lLlA1-Vad3g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);