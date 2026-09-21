// supabaseClient.js
// Cria a conexão com o Supabase, usada por todas as páginas do site.
//
// IMPORTANTE: substitua os dois valores abaixo pelos do SEU projeto Supabase.
// Você encontra eles em: Supabase → seu projeto → Project Settings → API.
// A "anon public key" É PARA SER PÚBLICA — ela aparece no código do site
// normalmente. A proteção real dos dados vem das políticas de RLS
// configuradas no banco (veja o README.md).

const SUPABASE_URL = "https://owjfyhrpirmqvkbaxokx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ltaNA7nnVozoSCOcZIjg";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Garante que só se acessa páginas internas estando logado.
// Chame checarSessao() no topo de cada página que exige login.
async function checarSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

async function fazerLogout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}
