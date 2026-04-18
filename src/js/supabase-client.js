// =====================================================
// SUPABASE SOZLAMALARI
// Bu ikki qiymatni o'zingizning Supabase loyihasidan oling:
// supabase.com → Loyihangiz → Settings → API
// =====================================================
const SUPABASE_URL = 'https://tabekaxrnzrgislsebfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhYmVrYXhybnpyZ2lzbHNlYmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTc0ODIsImV4cCI6MjA5MjA3MzQ4Mn0.HN-qB7EZw7C0VFTrZGTfllqr1zlNcj8cfAJWyc6uqsA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
