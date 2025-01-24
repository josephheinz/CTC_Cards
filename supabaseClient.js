const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://divhtiffrhtqqocneani.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmh0aWZmcmh0cXFvY25lYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjY5MjMsImV4cCI6MjA1MzMwMjkyM30.NcPy5KZAAUevC9BeHFj9NwJubmMG0jtBpwpbhKSiyk4";
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        flowType: 'pkce', // Set the flowType to PKCE
    },
});

module.exports = supabase;