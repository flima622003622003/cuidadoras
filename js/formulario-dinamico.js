// formulario-dinamico.js
// Recebe a lista de campos ativos (universais + os que as regras ligaram)
// e desenha o HTML correspondente. Também sabe ler de volta os valores
// preenchidos, na hora de salvar.
//
// Adicionar um novo "tipo" de campo no futuro = adicionar um case aqui
// e, se for condicional, uma regra em regras.js. O resto do sistema
// não precisa mudar.

function criarCampoHTML(campo) {
  switch (campo.tipo) {
    case "hora":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label for="${campo.chave}">${campo.label}</label>
          <input type="time" id="${campo.chave}" name="${campo.chave}">
        </div>`;

    case "texto_curto":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label for="${campo.chave}">${campo.label}</label>
          <input type="text" id="${campo.chave}" name="${campo.chave}">
        </div>`;

    case "texto_longo":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label for="${campo.chave}">${campo.label}</label>
          <textarea id="${campo.chave}" name="${campo.chave}"></textarea>
        </div>`;

    case "numero":
      return `
        <div class="campo campo-destacado" data-chave="${campo.chave}">
          <label for="${campo.chave}">${campo.label}</label>
          <input type="number" id="${campo.chave}" name="${campo.chave}">
        </div>`;

    case "numero_com_hora":
      return `
        <div class="campo campo-destacado" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          <div class="linha-botoes">
            <input type="number" id="${campo.chave}_valor" placeholder="valor">
            <input type="time" id="${campo.chave}_hora">
          </div>
        </div>`;

    case "par_numerico":
      return `
        <div class="campo campo-destacado" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          <div class="linha-botoes">
            <input type="number" id="${campo.chave}_sistolica" placeholder="Sistólica">
            <input type="number" id="${campo.chave}_diastolica" placeholder="Diastólica">
          </div>
        </div>`;

    case "booleano":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          <div class="grupo-opcoes">
            <label class="opcao"><input type="radio" name="${campo.chave}" value="sim"><span>Sim</span></label>
            <label class="opcao"><input type="radio" name="${campo.chave}" value="nao"><span>Não</span></label>
          </div>
        </div>`;

    case "selecao":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label>${campo.label || ""}</label>
          <div class="grupo-opcoes">
            ${campo.opcoes.map(op => `
              <label class="opcao">
                <input type="radio" name="${campo.chave}" value="${op}">
                <span>${op}</span>
              </label>`).join("")}
          </div>
        </div>`;

    case "checklist":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          <div class="grupo-opcoes">
            ${campo.opcoes.map((op, i) => `
              <label class="opcao">
                <input type="checkbox" name="${campo.chave}[]" value="${op}">
                <span>${op}</span>
              </label>`).join("")}
          </div>
        </div>`;

    case "checklist_com_horario":
      return `
        <div class="campo campo-destacado" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          <p class="ajuda">Adicione cada medicação tomada hoje e o horário.</p>
          <div id="${campo.chave}_lista"></div>
          <button type="button" class="botao-secundario" onclick="adicionarLinhaMedicacao('${campo.chave}')">+ Adicionar medicação</button>
        </div>`;

    case "refeicoes_simples":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          ${campo.refeicoes.map(ref => `
            <div style="margin-bottom:10px;">
              <span class="ajuda">${ref}</span>
              <div class="grupo-opcoes">
                ${campo.opcoes.map(op => `
                  <label class="opcao">
                    <input type="radio" name="${campo.chave}__${ref}" value="${op}">
                    <span>${op}</span>
                  </label>`).join("")}
              </div>
            </div>`).join("")}
        </div>`;

    case "refeicoes_detalhadas":
      return `
        <div class="campo" data-chave="${campo.chave}">
          <label>${campo.label}</label>
          ${campo.refeicoes.map(ref => `
            <div style="margin-bottom:14px;">
              <span class="ajuda">${ref}</span>
              <div class="grupo-opcoes" style="margin-bottom:6px;">
                ${campo.subcampos[0].opcoes.map(op => `
                  <label class="opcao">
                    <input type="radio" name="${campo.chave}__${ref}__quantidade" value="${op}">
                    <span>${op}</span>
                  </label>`).join("")}
              </div>
              <div class="grupo-opcoes">
                <label class="opcao"><input type="radio" name="${campo.chave}__${ref}__deglutir" value="sim"><span>Dificuldade p/ engolir: Sim</span></label>
                <label class="opcao"><input type="radio" name="${campo.chave}__${ref}__deglutir" value="nao"><span>Não</span></label>
              </div>
            </div>`).join("")}
        </div>`;

    default:
      return `<div class="campo"><em>Campo "${campo.chave}" com tipo desconhecido (${campo.tipo}).</em></div>`;
  }
}

function montarFormularioNaTela(containerId, camposAtivos) {
  const container = document.getElementById(containerId);
  container.innerHTML = camposAtivos.map(criarCampoHTML).join("");
}

// Usado pelo botão "+ Adicionar medicação" no checklist_com_horario
function adicionarLinhaMedicacao(chave) {
  const lista = document.getElementById(`${chave}_lista`);
  const linha = document.createElement("div");
  linha.className = "linha-botoes";
  linha.style.marginBottom = "8px";
  linha.innerHTML = `
    <input type="text" placeholder="Nome da medicação" class="${chave}_nome">
    <input type="time" class="${chave}_horario">
  `;
  lista.appendChild(linha);
}

// Lê os valores preenchidos no formulário de volta, na estrutura que
// será salva em registros_diarios.campos_extras (jsonb) no Supabase.
function coletarValoresFormulario(camposAtivos) {
  const valores = {};

  camposAtivos.forEach(campo => {
    switch (campo.tipo) {
      case "hora":
      case "texto_curto":
      case "texto_longo":
      case "numero":
        valores[campo.chave] = document.getElementById(campo.chave)?.value || null;
        break;

      case "numero_com_hora":
        valores[campo.chave] = {
          valor: document.getElementById(`${campo.chave}_valor`)?.value || null,
          hora: document.getElementById(`${campo.chave}_hora`)?.value || null
        };
        break;

      case "par_numerico":
        valores[campo.chave] = {
          sistolica: document.getElementById(`${campo.chave}_sistolica`)?.value || null,
          diastolica: document.getElementById(`${campo.chave}_diastolica`)?.value || null
        };
        break;

      case "booleano":
      case "selecao":
        valores[campo.chave] = document.querySelector(`input[name="${campo.chave}"]:checked`)?.value || null;
        break;

      case "checklist":
        valores[campo.chave] = Array.from(
          document.querySelectorAll(`input[name="${campo.chave}[]"]:checked`)
        ).map(el => el.value);
        break;

      case "checklist_com_horario": {
        const nomes = document.querySelectorAll(`.${campo.chave}_nome`);
        const horarios = document.querySelectorAll(`.${campo.chave}_horario`);
        valores[campo.chave] = Array.from(nomes).map((el, i) => ({
          nome: el.value,
          horario: horarios[i]?.value || null
        })).filter(m => m.nome);
        break;
      }

      case "refeicoes_simples":
        valores[campo.chave] = {};
        campo.refeicoes.forEach(ref => {
          valores[campo.chave][ref] = document.querySelector(
            `input[name="${campo.chave}__${ref}"]:checked`
          )?.value || null;
        });
        break;

      case "refeicoes_detalhadas":
        valores[campo.chave] = {};
        campo.refeicoes.forEach(ref => {
          valores[campo.chave][ref] = {
            quantidade: document.querySelector(`input[name="${campo.chave}__${ref}__quantidade"]:checked`)?.value || null,
            dificuldade_deglutir: document.querySelector(`input[name="${campo.chave}__${ref}__deglutir"]:checked`)?.value || null
          };
        });
        break;
    }
  });

  return valores;
}
