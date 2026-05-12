import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nvooahlskbdovfeigolw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52b29haGxza2Jkb3ZmZWlnb2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTY2MzIsImV4cCI6MjA5MTEzMjYzMn0.ol7NALOx2R8u4wmFEC04w9EZxdu3r9pqiZte00LduNM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
