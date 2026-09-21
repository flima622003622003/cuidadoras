// regras.js
// Este arquivo é o "motor de adaptação" do sistema (Nível 1: regras condicionais).
// Cada regra diz: "se a avaliação inicial do idoso tiver tal característica,
// ative tal campo no formulário diário".
//
// Para ajustar o comportamento do app no futuro, normalmente você só precisa
// editar este arquivo — sem mexer no resto do código.

const CAMPOS_UNIVERSAIS = [
  { chave: "horario_acordou", label: "Acordou às", tipo: "hora" },
  { chave: "horario_dormiu", label: "Dormiu às", tipo: "hora" },
  { chave: "cochilos", label: "Cochilos durante o dia (opcional)", tipo: "texto_curto" },
  {
    chave: "refeicao_simples",
    label: "Refeições",
    tipo: "refeicoes_simples",
    refeicoes: ["Café da manhã", "Almoço", "Lanche", "Jantar"],
    opcoes: ["Comeu bem", "Comeu pouco", "Não comeu"]
  },
  { chave: "observacoes", label: "Observações do dia", tipo: "texto_longo" }
];

const REGRAS_ADAPTACAO = [
  {
    id: "r01",
    descricao: "Diabetes ativa registro de glicemia",
    condicao: { campo: "diabetes", operador: "==", valor: "sim" },
    campo_ativado: {
      chave: "glicemia",
      label: "Glicemia (mg/dL)",
      tipo: "numero_com_hora"
    }
  },
  {
    id: "r02",
    descricao: "Pressão alta ativa registro de pressão arterial",
    condicao: { campo: "pressao_alta", operador: "==", valor: "sim" },
    campo_ativado: {
      chave: "pressao_arterial",
      label: "Pressão arterial (sistólica / diastólica)",
      tipo: "par_numerico"
    }
  },
  {
    id: "r03",
    descricao: "Auxílio total para se alimentar ativa registro detalhado de refeição",
    condicao: { campo: "avd_alimentar_se", operador: "==", valor: "auxilio_total" },
    campo_ativado: {
      chave: "refeicao_detalhada",
      label: "Refeições — detalhado",
      tipo: "refeicoes_detalhadas",
      refeicoes: ["Café da manhã", "Almoço", "Lanche", "Jantar"],
      substitui: "refeicao_simples",
      subcampos: [
        { chave: "quantidade_ingerida", tipo: "selecao", opcoes: ["Nenhuma", "Pouca", "Metade", "Tudo"] },
        { chave: "dificuldade_deglutir", tipo: "booleano", label: "Dificuldade para engolir?" }
      ]
    }
  },
  {
    id: "r05",
    descricao: "Qualquer nível de auxílio no controle de urina ativa bloco de eliminações",
    condicao: { campo: "avd_controle_urina", operador: "!=", valor: "sem_auxilio" },
    campo_ativado: {
      chave: "eliminacoes",
      label: "Controle de eliminações",
      tipo: "checklist",
      opcoes: ["Troca realizada", "Episódio de incontinência"]
    }
  },
  {
    id: "r06",
    descricao: "Sono ruim ou histórico de queda ativa alerta de cochilos diurnos",
    condicao: {
      operador_logico: "OU",
      condicoes: [
        { campo: "dorme_bem", operador: "==", valor: "nao" },
        { campo: "historico_queda", operador: "==", valor: "sim" }
      ]
    },
    campo_ativado: {
      chave: "alerta_cochilos",
      label: "⚠ Horas de cochilo diurno hoje",
      tipo: "numero"
    }
  },
  {
    id: "r07",
    descricao: "Auxílio total para gerenciar medicações vira checklist com horário",
    condicao: { campo: "aivd_gerenciar_medicacoes", operador: "==", valor: "auxilio_total" },
    campo_ativado: {
      chave: "checklist_medicacoes",
      label: "Medicações do dia",
      tipo: "checklist_com_horario"
    }
  },
  {
    id: "r08",
    descricao: "Problema renal ativa registro de ingestão de líquidos",
    condicao: { campo: "problema_renal", operador: "==", valor: "sim" },
    campo_ativado: {
      chave: "ingestao_liquidos",
      label: "Ingestão de líquidos (ml)",
      tipo: "numero"
    }
  }
];

// Avalia uma condição (simples ou composta com OU/E) contra a avaliação do idoso
function avaliarCondicao(condicao, avaliacao) {
  if (condicao.operador_logico === "OU") {
    return condicao.condicoes.some(c => avaliarCondicao(c, avaliacao));
  }
  if (condicao.operador_logico === "E") {
    return condicao.condicoes.every(c => avaliarCondicao(c, avaliacao));
  }
  const valorAtual = avaliacao[condicao.campo];
  if (condicao.operador === "==") return valorAtual === condicao.valor;
  if (condicao.operador === "!=") return valorAtual !== condicao.valor && valorAtual != null;
  return false;
}

// Monta a lista final de campos que devem aparecer no formulário diário
// para um idoso específico, a partir da avaliação inicial dele.
function montarCamposDoIdoso(avaliacao) {
  let campos = [...CAMPOS_UNIVERSAIS];

  REGRAS_ADAPTACAO.forEach(regra => {
    if (avaliarCondicao(regra.condicao, avaliacao)) {
      if (regra.campo_ativado.substitui) {
        campos = campos.filter(c => c.chave !== regra.campo_ativado.substitui);
      }
      campos.push(regra.campo_ativado);
    }
  });

  return campos;
}
