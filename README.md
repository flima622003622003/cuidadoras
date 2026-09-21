# Cuidar Perto — MVP (HTML/CSS/JS + Supabase)

MVP de registro diário de cuidado para idosos, com formulário que se
adapta conforme o perfil funcional e clínico de cada idoso (Nível 1:
regras condicionais, sem chamada de IA em tempo real).

## Estrutura do projeto

```
index.html            → login e seleção de idoso
cadastro.html          → avaliação inicial (AVD's, AIVD's, dados clínicos)
registro-diario.html   → formulário diário, montado dinamicamente
historico.html         → últimos registros de um idoso
css/estilo.css         → visual do site
js/supabaseClient.js   → conexão com o Supabase (EDITAR com suas chaves)
js/regras.js           → motor de adaptação (Nível 1) — edite aqui para mudar regras
js/formulario-dinamico.js → desenha e lê os campos do formulário diário
```

## Passo 1 — Criar o projeto no Supabase

1. Em [supabase.com](https://supabase.com), crie um novo projeto (gratuito).
2. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**
3. Abra `js/supabaseClient.js` e substitua:
   ```javascript
   const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLICA_AQUI";
   ```

## Passo 2 — Criar as tabelas

No Supabase, vá em **SQL Editor** e execute:

```sql
create extension if not exists "pgcrypto";

create table idosos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_nascimento date,
  criado_em timestamptz default now()
);

create table cuidadores_idosos (
  id uuid primary key default gen_random_uuid(),
  cuidador_id uuid references auth.users(id) not null,
  idoso_id uuid references idosos(id) not null
);

create table avaliacoes_iniciais (
  id uuid primary key default gen_random_uuid(),
  idoso_id uuid references idosos(id) not null,
  avd_alimentar_se text,
  avd_ir_banheiro text,
  avd_higiene_pessoal text,
  avd_controle_urina text,
  aivd_gerenciar_financas text,
  aivd_lidar_transporte text,
  aivd_fazer_compras text,
  aivd_preparar_refeicoes text,
  aivd_usar_telefone text,
  aivd_gerenciar_medicacoes text,
  aivd_manutencao_casa text,
  historico_clinico text,
  historico_queda text,
  pressao_alta text,
  problema_coracao text,
  problema_circulacao text,
  diabetes text,
  colesterol_alto text,
  problema_renal text,
  dorme_bem text,
  ouve_bem text,
  tem_alergia text,
  qual_alergia text,
  outras_comorbidades text,
  criado_em timestamptz default now()
);

create table registros_diarios (
  id uuid primary key default gen_random_uuid(),
  idoso_id uuid references idosos(id) not null,
  cuidador_id uuid references auth.users(id) not null,
  data date not null,
  campos_extras jsonb,
  criado_em timestamptz default now()
);
```

## Passo 3 — Ativar RLS (obrigatório — os dados são sensíveis)

Como o site vai ficar num repositório público, a chave `anon` fica visível
no código. Isso é normal e esperado — a segurança real vem das políticas
abaixo, que garantem que cada cuidador só vê os idosos vinculados a ele:

```sql
alter table idosos enable row level security;
alter table cuidadores_idosos enable row level security;
alter table avaliacoes_iniciais enable row level security;
alter table registros_diarios enable row level security;

-- cuidadores_idosos: só enxerga/insere seus próprios vínculos
create policy "cuidador ve seus vinculos" on cuidadores_idosos
  for select using (auth.uid() = cuidador_id);
create policy "cuidador cria vinculo" on cuidadores_idosos
  for insert with check (auth.uid() = cuidador_id);

-- idosos: só quem tem vínculo pode ver
create policy "ve idoso vinculado" on idosos
  for select using (
    exists (select 1 from cuidadores_idosos ci
            where ci.idoso_id = idosos.id and ci.cuidador_id = auth.uid())
  );
create policy "qualquer cuidador logado pode cadastrar idoso" on idosos
  for insert with check (auth.uid() is not null);

-- avaliacoes_iniciais: só quem tem vínculo com o idoso
create policy "ve avaliacao de idoso vinculado" on avaliacoes_iniciais
  for select using (
    exists (select 1 from cuidadores_idosos ci
            where ci.idoso_id = avaliacoes_iniciais.idoso_id and ci.cuidador_id = auth.uid())
  );
create policy "cria avaliacao de idoso vinculado" on avaliacoes_iniciais
  for insert with check (
    exists (select 1 from cuidadores_idosos ci
            where ci.idoso_id = avaliacoes_iniciais.idoso_id and ci.cuidador_id = auth.uid())
  );

-- registros_diarios: só o próprio cuidador, e só de idoso vinculado
create policy "ve seus proprios registros" on registros_diarios
  for select using (auth.uid() = cuidador_id);
create policy "cria registro de idoso vinculado" on registros_diarios
  for insert with check (
    auth.uid() = cuidador_id and
    exists (select 1 from cuidadores_idosos ci
            where ci.idoso_id = registros_diarios.idoso_id and ci.cuidador_id = auth.uid())
  );
```

## Passo 4 — Criar os usuários (cuidadoras) de teste

No Supabase, vá em **Authentication → Users → Add user** e crie um usuário
(e-mail + senha) para cada uma das cuidadoras que vão testar. Não precisa
de tela de "criar conta" no site para este MVP — você mesmo cria os
acessos manualmente, o que também evita gente de fora se cadastrando
sozinha num app que guarda dados de saúde de terceiros.

## Perfil de administrador

Existe uma tabela `profiles` (id do usuário + `role`) que controla quem
pode acessar `admin.html`, uma tela que lista **todos** os registros
diários (de qualquer cuidador) e permite apagá-los — algo que nenhuma
cuidadora comum pode fazer.

Para tornar alguém administrador, rode no **SQL Editor** do Supabase
(troque pelo UUID do usuário, visível em Authentication → Users):

```sql
insert into profiles (id, role) values ('UUID-DO-USUARIO', 'admin')
on conflict (id) do update set role = 'admin';
```

O link "Administração" só aparece na tela inicial para quem é admin,
mas a segurança de verdade vem da política de RLS (`is_admin()`), não
da interface.

## Passo 5 — Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba esta pasta inteira (`git add .`, `git commit`, `git push`).
2. No repositório, vá em **Settings → Pages**.
3. Em "Source", selecione a branch principal (`main`) e a pasta raiz (`/`).
4. Salve. Em alguns minutos o GitHub mostra o link público, algo como
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
5. Envie esse link para as cuidadoras testarem no celular.

**Atenção:** se o repositório for público, qualquer pessoa pode ver o
código-fonte (isso é normal e é por isso que o Passo 3 é obrigatório).
Se preferir mais privacidade, um repositório privado no GitHub também
publica no GitHub Pages, mas exige uma conta paga (GitHub Pro) ou usar
o plano gratuito de organizações educacionais, se você tiver acesso
pela UFMA.

## Como editar as regras de adaptação (Nível 1)

Todo o "cérebro" de personalização está em `js/regras.js`, no array
`REGRAS_ADAPTACAO`. Para adicionar uma nova regra, copie um bloco
existente e ajuste:

```javascript
{
  id: "r09",
  descricao: "explique aqui o que essa regra faz",
  condicao: { campo: "nome_do_campo_da_avaliacao", operador: "==", valor: "sim" },
  campo_ativado: {
    chave: "nome_unico_do_campo",
    label: "O que aparece na tela para o cuidador",
    tipo: "numero" // ou: hora, texto_curto, texto_longo, booleano, selecao,
                    // checklist, checklist_com_horario, numero_com_hora, par_numerico
  }
}
```

Não é necessário mexer em nenhum outro arquivo — o formulário diário lê
essa lista sozinho e monta a tela.

## O que fica de fora desta primeira versão (de propósito)

- Múltiplos idosos por cuidador funcionam, mas não há tela de edição da
  avaliação inicial depois de criada (é preciso editar direto no Supabase).
- Sem exportação em PDF ou portal para a família.
- Sem tela de "esqueci minha senha" — se uma cuidadora esquecer, você
  reseta manualmente pelo painel do Supabase.

Esses cortes foram deliberados para validar rápido se a ideia central
(formulário que muda conforme o idoso) já ajuda no dia a dia, antes de
investir tempo em recursos que ninguém pediu ainda.
