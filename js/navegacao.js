// navegacao.js
// Barra de navegação superior (breadcrumbs + Administração + Sair),
// compartilhada por todas as páginas internas do site.
//
// Uso: chamar montarNavegacao(trilha) depois de checarSessao(), onde
// trilha é uma lista de { label, href? } representando os níveis
// depois de "Início" (que já é sempre o primeiro item, fixo).
// Itens sem "href" (ou o último da lista) aparecem como texto simples,
// já que representam a página atual.

async function montarNavegacao(trilha) {
  trilha = trilha || [];

  const partes = [
    trilha.length === 0
      ? `<span class="nav-atual">Início</span>`
      : `<a href="index.html">Início</a>`
  ];
  trilha.forEach((item, i) => {
    const ehUltimo = i === trilha.length - 1;
    partes.push(`<span class="nav-separador">›</span>`);
    partes.push(
      (ehUltimo || !item.href)
        ? `<span class="nav-atual">${item.label}</span>`
        : `<a href="${item.href}">${item.label}</a>`
    );
  });

  const nav = document.getElementById("nav-topo");
  if (!nav) return;

  nav.innerHTML = `
    <div class="nav-trilha">${partes.join(" ")}</div>
    <div class="nav-acoes">
      <a href="admin.html" id="nav-admin" class="nav-admin" style="display:none;">Administração</a>
      <button class="link-sair" onclick="fazerLogout()">Sair</button>
    </div>
  `;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (perfil?.role === "admin") {
    document.getElementById("nav-admin").style.display = "inline";
  }
}
