// ============================================================
// 📦 CONTROLE DE ESTOQUE - script.js (versão MongoDB)
// ============================================================

const API_URL = "http://localhost:3000/api"
let produtosArr = []
let movimentacoesArr = []
const bootstrap = window.bootstrap // Declare the bootstrap variable

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos()
  carregarMovimentacoes()

  // ======= Formulários =======
  document.getElementById("formEntrada")?.addEventListener("submit", registrarEntradaSimplificada)
  document.getElementById("formMovimentacao")?.addEventListener("submit", registrarMovimentacao)
  document.getElementById("formEditarProduto")?.addEventListener("submit", salvarEdicaoProduto)

  // ======= Filtros automáticos do histórico =======
  const filtros = ["filtroProduto", "filtroTipo", "dataInicio", "dataFim"]
  filtros.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", filtrarMovimentacoes)
    document.getElementById(id)?.addEventListener("change", filtrarMovimentacoes)
  })

  // ======= Botão limpar filtros =======
  document.getElementById("btnLimpar")?.addEventListener("click", () => {
    document.getElementById("filtroProduto").value = ""
    document.getElementById("filtroTipo").value = ""
    document.getElementById("dataInicio").value = ""
    document.getElementById("dataFim").value = ""
    renderizarMovimentacoes(movimentacoesArr)
    atualizarDashboard(movimentacoesArr) 
  })

  // ====== Botão Exportar PDF ======
  document.getElementById("btnExportarPDF")?.addEventListener("click", exportarPDF);


  // ======= Busca de produtos em estoque =======
  document.getElementById("buscaProduto")?.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase()
    const filtrados = produtosArr.filter((p) => p.descricao.toLowerCase().includes(termo))
    renderizarProdutos(filtrados)
  })

  // ======= Botão Exportar PDF do Estoque Atual =======
  document.getElementById("btnExportarProdutos")?.addEventListener("click", exportarProdutosPDF);

  // Setar data atual nos campos de data
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  const dataAtual = `${ano}-${mes}-${dia}`
  document.getElementById("data_saida").value = dataAtual
  document.getElementById("data_entrada").value = dataAtual

  // Resetar datas para atual após submit
  document.getElementById("formMovimentacao").addEventListener("submit", () => {
    setTimeout(() => {
      document.getElementById("data_saida").value = dataAtual
    }, 100)
  })
  document.getElementById("formEntrada").addEventListener("submit", () => {
    setTimeout(() => {
      document.getElementById("data_entrada").value = dataAtual
    }, 100)
  })

  ativarDestaqueNavbar()
})

// ============================================================
// 🗂️ Funções de carregamento (API)
// ============================================================

async function carregarProdutos() {
  try {
    const res = await fetch(`${API_URL}/produtos`)
    produtosArr = await res.json()
    renderizarProdutos(produtosArr)
    atualizarListaProdutos()
  } catch (err) {
    console.error("Erro ao carregar produtos:", err)
  }
}

async function carregarMovimentacoes() {
  try {
    const res = await fetch(`${API_URL}/movimentacoes`)
    movimentacoesArr = await res.json()

    // Normaliza para o formato esperado, armazenando apenas a data (yyyy-mm-dd)
    movimentacoesArr = movimentacoesArr.map((m) => ({
  id: m._id,
  codigo: m.produto_id?.codigo || null,
  produto: m.produto_id?.descricao || "Produto removido",
  tipo: m.tipo === "entrada" ? "Entrada" : "Saída",
  quantidade: m.quantidade,
  servidorAlmoxarifado: m.servidor_almoxarifado,
  setorResponsavel: m.setor_responsavel || "-",
  servidorRetirada: m.servidor_retirada || "-",
  data: m.data,
}))


    renderizarMovimentacoes(movimentacoesArr)
    atualizarDashboard(movimentacoesArr)
  } catch (err) {
    console.error("Erro ao carregar movimentações:", err)
  }
}

// ============================================================
// 📋 Renderização das tabelas
// ============================================================

function renderizarProdutos(lista) {
  const tbody = document.querySelector("#tabelaProdutos tbody")
  tbody.innerHTML = ""

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Nenhum produto cadastrado</td></tr>`
    return
  }

  lista.forEach((produto) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${String(produto.codigo || "").padStart(3, "0")}</td>
      <td>${produto.descricao}</td>
      <td>${produto.quantidade}</td>
      <td>${produto.unidade || "-"}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="abrirModalEditar('${produto._id}')">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto('${produto._id}')">Excluir</button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

function renderizarMovimentacoes(lista) {
  const tbody = document.querySelector("#tabelaMovimentacoes tbody")
  tbody.innerHTML = ""

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted">Nenhuma movimentação registrada</td></tr>`
    return
  }

  lista.forEach((mov) => {
    const tr = document.createElement("tr")
    const dataMov = new Date(mov.data)
    // Ajusta a data para o fuso horário de São Paulo antes de formatar
    const saoPauloDate = new Date(dataMov.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const dataFormatada = saoPauloDate.toLocaleDateString("pt-BR")
    tr.innerHTML = `
      <td>${String(mov.codigo || "").padStart(3, "0")}</td>
      <td>${mov.produto}</td>
      <td>${mov.tipo}</td>
      <td>${mov.quantidade}</td>
      <td>${mov.servidorAlmoxarifado}</td>
      <td>${mov.setorResponsavel}</td>
      <td>${mov.servidorRetirada}</td>
      <td>${dataFormatada}</td>
    `
    tbody.appendChild(tr)
  })
}

// ============================================================
// 🧾 Registro de entrada simplificada
// ============================================================

async function registrarEntradaSimplificada(e) {
  e.preventDefault()

  const descricao = document.getElementById("entrada_descricao").value.trim()
  const quantidade = Number.parseInt(document.getElementById("entrada_quantidade").value)
  const unidade = document.getElementById("entrada_unidade").value.trim()
  const servidor = document.getElementById("entrada_servidor").value.trim()
  const dataEntrada = document.getElementById("data_entrada").value.trim()

  if (!descricao || !quantidade || !servidor) {
    alert("Preencha todos os campos obrigatórios.")
    return
  }

  try {
    const res = await fetch(`${API_URL}/entrada`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        quantidade,
        unidade,
        servidor_almoxarifado: servidor,
        data_entrada: dataEntrada,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      alert(data.message || "Entrada registrada com sucesso!")
      carregarProdutos()
      carregarMovimentacoes()
      e.target.reset()
    } else {
      alert("Erro: " + (data.error || "Falha ao registrar entrada."))
    }
  } catch (err) {
    console.error("Erro ao registrar entrada:", err)
  }
}

// ============================================================
// 📤 Registro de movimentação (saída)
// ============================================================

async function registrarMovimentacao(e) {
  e.preventDefault()

  const produtoNome = document.getElementById("produto_nome").value.trim()
  const quantidade = Number.parseInt(document.getElementById("qtd_mov").value)
  const servidorAlmoxarifado = document.getElementById("servidor_almoxarifado").value.trim()
  const dataSaida = document.getElementById("data_saida").value.trim()
  const setorResponsavel = document.getElementById("setor_responsavel").value.trim()
  const servidorRetirada = document.getElementById("servidor_retirada").value.trim()

  const produto = produtosArr.find((p) => p.descricao.toLowerCase() === produtoNome.toLowerCase())
  if (!produto) {
    alert("Produto não encontrado no estoque.")
    return
  }

  if (quantidade > produto.quantidade) {
    alert("Quantidade insuficiente em estoque!")
    return
  }

  try {
    const res = await fetch(`${API_URL}/saida`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produto_id: produto._id,
        tipo: "saida",
        quantidade,
        servidor_almoxarifado: servidorAlmoxarifado,
        data: dataSaida,
        setor_responsavel: setorResponsavel,
        servidor_retirada: servidorRetirada,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      alert("Movimentação registrada com sucesso!")
      carregarProdutos()
      carregarMovimentacoes()
      e.target.reset()
    } else {
      alert("Erro: " + (data.error || "Falha ao registrar movimentação."))
    }
  } catch (err) {
    console.error("Erro ao registrar movimentação:", err)
  }
}

// ============================================================
// 🔍 Filtro de movimentações (datas sem hora)
// ============================================================

function filtrarMovimentacoes() {
  const filtroProduto = document.getElementById("filtroProduto").value.toLowerCase()
  const filtroTipo = document.getElementById("filtroTipo").value
  const dataInicio = document.getElementById("dataInicio").value
  const dataFim = document.getElementById("dataFim").value

  const filtradas = movimentacoesArr.filter((mov) => {
    const nomeOk = mov.produto.toLowerCase().includes(filtroProduto)
    const tipoOk = !filtroTipo || mov.tipo === filtroTipo

    let dataOk = true

    if (dataInicio) {
      // Parse input dates as local dates (not UTC)
      const [anoInicio, mesInicio, diaInicio] = dataInicio.split("-").map(Number)
      const inicio = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0)

      let fim
      if (dataFim) {
        const [anoFim, mesFim, diaFim] = dataFim.split("-").map(Number)
        fim = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999)
      } else {
        fim = new Date(anoInicio, mesInicio - 1, diaInicio, 23, 59, 59, 999)
      }

      // Convert movement date to local date for comparison
      const dataMov = new Date(mov.data)
      const dataMovLocal = new Date(dataMov.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))

      dataOk = dataMovLocal >= inicio && dataMovLocal <= fim
    }

    return nomeOk && tipoOk && dataOk
  })

  renderizarMovimentacoes(filtradas)
  atualizarDashboard(filtradas)
}

// ============================================================
// ⚙️ Edição e exclusão de produtos
// ============================================================

function abrirModalEditar(id) {
  const produto = produtosArr.find((p) => p._id === id)
  if (!produto) return

  document.getElementById("edit_produto_id").value = produto._id
  document.getElementById("edit_descricao").value = produto.descricao
  document.getElementById("edit_quantidade").value = produto.quantidade
  document.getElementById("edit_unidade").value = produto.unidade || ""
  // 🆕 Novos campos
  document.getElementById("edit_descricao_complementar").value = produto.descricao_complementar || ""
  document.getElementById("edit_validade").value = produto.validade || ""
  document.getElementById("edit_fornecedor").value = produto.fornecedor || ""
  document.getElementById("edit_numero_processo").value = produto.numero_processo || ""
  document.getElementById("edit_observacoes").value = produto.observacoes || ""

  new bootstrap.Modal(document.getElementById("modalEditarProduto")).show()
}

async function salvarEdicaoProduto(e) {
  e.preventDefault()

  const id = document.getElementById("edit_produto_id").value
  const descricao = document.getElementById("edit_descricao").value.trim()
  const quantidade = Number.parseInt(document.getElementById("edit_quantidade").value)
  const unidade = document.getElementById("edit_unidade").value.trim()

  // 🆕 Novos campos
  const descricao_complementar = document.getElementById("edit_descricao_complementar").value.trim()
  const validade = document.getElementById("edit_validade").value.trim()
  const fornecedor = document.getElementById("edit_fornecedor").value.trim()
  const numero_processo = document.getElementById("edit_numero_processo").value.trim()
  const observacoes = document.getElementById("edit_observacoes").value.trim()

  try {
    const res = await fetch(`${API_URL}/produtos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao,
        quantidade,
        unidade,
        descricao_complementar,
        validade,
        fornecedor,
        numero_processo,
        observacoes,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      alert("✅ Produto atualizado com sucesso!")
      // 🔁 Atualiza array local com dados retornados
      const idx = produtosArr.findIndex((p) => p._id === id)
      if (idx !== -1 && data.produto) produtosArr[idx] = data.produto
      renderizarProdutos(produtosArr)

      const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditarProduto"))
      modal.hide()
    } else {
      alert("Erro: " + (data.error || "Falha ao atualizar produto."))
    }
  } catch (err) {
    console.error("Erro ao atualizar produto:", err)
  }
}

async function excluirProduto(id) {
  if (!confirm("Deseja realmente excluir este produto?")) return
  try {
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (res.ok) {
      alert(data.message || "Produto excluído com sucesso.")
      carregarProdutos()
      carregarMovimentacoes()
    } else {
      alert("Erro: " + (data.error || "Falha ao excluir produto."))
    }
  } catch (err) {
    console.error("Erro ao excluir produto:", err)
  }
}

// ============================================================
// 🧾 Atualização da lista de produtos no datalist
// ============================================================

function atualizarListaProdutos() {
  const datalist = document.getElementById("listaProdutos")
  if (!datalist) return
  datalist.innerHTML = produtosArr.map((p) => `<option value="${p.descricao}">`).join("")
}

// ============================================================
// 🔹 Destaque automático da seção no menu
// ============================================================

function ativarDestaqueNavbar() {
  const links = document.querySelectorAll(".navbar-nav .nav-link")

  window.addEventListener("scroll", () => {
    let atual = ""

    document.querySelectorAll("section, div[id]").forEach((sec) => {
      const topo = window.scrollY
      const offset = sec.offsetTop - 150
      const altura = sec.offsetHeight
      const id = sec.getAttribute("id")

      if (topo >= offset && topo < offset + altura) atual = id
    })

    links.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === "#" + atual) {
        link.classList.add("active")
      }
    })
  })
}

// ============================================================
// 📊 Atualização do Dashboard
// ============================================================

function atualizarDashboard(movimentacoes) {
  let totalEntradas = 0
  let totalSaidas = 0

  movimentacoes.forEach((mov) => {
    if (mov.tipo === "Entrada") {
      totalEntradas += mov.quantidade
    } else if (mov.tipo === "Saída") {
      totalSaidas += mov.quantidade
    }
  })

  const saldoFinal = totalEntradas - totalSaidas

  // Atualiza os elementos do dashboard
  document.getElementById("totalEntradas").textContent = totalEntradas
  document.getElementById("totalSaidas").textContent = totalSaidas
  document.getElementById("saldoFinal").textContent = saldoFinal

  // Adiciona classe de cor ao saldo final
  const saldoElement = document.getElementById("saldoFinal")
  saldoElement.classList.remove("text-success", "text-danger", "text-muted")
  if (saldoFinal > 0) {
    saldoElement.classList.add("text-success")
  } else if (saldoFinal < 0) {
    saldoElement.classList.add("text-danger")
  } else {
    saldoElement.classList.add("text-muted")
  }
}

  // ============================================================
  // 🧾 EXPORTAR PDF - Histórico + Dashboard + Filtros
  // ============================================================
  function exportarPDF() {
    if (!window.jspdf) {
      alert('Biblioteca jsPDF não foi carregada. Atualize a página e tente novamente.');
      return;
    }
    const { jsPDF } = window.jspdf;

    // Captura linhas visíveis da tabela
    const rows = [...document.querySelectorAll("#tabelaMovimentacoes tbody tr")];

    if (!rows.length || rows[0].children.length === 1) {
        alert("Nenhuma movimentação para exportar.");
        return;
    }

    // Extrai valores da tabela (somente as 4 primeiras colunas: ID, Descrição, Quantidade, Unidade)
    const dados = rows.map((tr) => [...tr.children].slice(0, 4).map((td) => td.innerText.trim()));

    // Cabeçalhos
    const colunas = [
        "ID", "Produto", "Tipo", "Quantidade",
        "Servidor Almoxarifado", "Setor",
        "Servidor Retirada", "Data"
    ];

    const pdf = new jsPDF("landscape");

    // -----------------------------------------------------------
    // 🟦 TÍTULO
    // -----------------------------------------------------------
    pdf.setFontSize(14);
    pdf.text("Histórico de Movimentações - Almoxarifado", 14, 18);

    // -----------------------------------------------------------
    // 🟧 FILTROS APLICADOS
    // -----------------------------------------------------------
    const filtroProduto = document.getElementById("filtroProduto").value || "Todos";
    const filtroTipo = document.getElementById("filtroTipo").value || "Todos";
    const dataInicio = document.getElementById("dataInicio").value || "-";
    const dataFim = document.getElementById("dataFim").value || "-";

    pdf.setFontSize(10);
    pdf.text(`Produto: ${filtroProduto}`, 14, 27);
    pdf.text(`Tipo: ${filtroTipo}`, 80, 27);
    pdf.text(`Período: ${dataInicio} até ${dataFim}`, 140, 27);

    // -----------------------------------------------------------
    // 🟩 DADOS DO DASHBOARD (capturados do HTML)
    // -----------------------------------------------------------
    const totalEntradas = document.getElementById("totalEntradas").textContent.trim();
    const totalSaidas = document.getElementById("totalSaidas").textContent.trim();
    const saldoFinal = document.getElementById("saldoFinal").textContent.trim();

    pdf.setFontSize(12);
    pdf.text("Resumo do Estoque", 14, 38);

    pdf.setFontSize(10);

    pdf.text(`Total de Entradas: ${totalEntradas}`, 14, 46);
    pdf.text(`Total de Saídas: ${totalSaidas}`, 80, 46);
    pdf.text(`Saldo Atual: ${saldoFinal}`, 150, 46);

    // -----------------------------------------------------------
    // 📄 TABELA DE MOVIMENTAÇÕES
    // -----------------------------------------------------------
    pdf.autoTable({
        head: [colunas],
        body: dados,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 65, 115] },
    });

    pdf.save("historico_movimentacoes.pdf");
  }

    // ============================================================
    // 🧾 EXPORTAR PDF - Estoque Atual (Produtos)
    // ============================================================
    function exportarProdutosPDF() {
        if (!window.jspdf) {
          alert('Biblioteca jsPDF não foi carregada. Atualize a página e tente novamente.');
          return;
        }
        const { jsPDF } = window.jspdf;

      // Captura linhas visíveis da tabela de produtos
      const rows = [...document.querySelectorAll("#tabelaProdutos tbody tr")];

      if (!rows.length || rows[0].children.length === 1) {
        alert("Nenhum produto para exportar.");
        return;
      }

      // Extrai valores da tabela
      const dados = rows.map((tr) => [...tr.children].map((td) => td.innerText));

      // Cabeçalhos
      const colunas = ["ID", "Descrição", "Quantidade", "Unidade"];

      const pdf = new jsPDF("portrait", "mm", "a4");

      // Título
      pdf.setFontSize(14);
      pdf.text("Estoque Atual - Almoxarifado", 14, 18);

      // Data de geração
      const agora = new Date();
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${agora.toLocaleString()}`, 14, 26);

      // Tabela de Produtos
      pdf.autoTable({
        head: [colunas],
        body: dados,
        startY: 36,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 65, 115] },
      });

      pdf.save("estoque_atual.pdf");
    }

  // ============================ FORMULÁRIOS ============================
const API_FORM = "http://localhost:3000/api/formularios";
let listaFormularios = [];

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  carregarFormularios();

  document.getElementById("formFiltroInicio").addEventListener("change", filtrarFormularios);
  document.getElementById("formFiltroFim").addEventListener("change", filtrarFormularios);

  document.getElementById("btnLimparFormularios").addEventListener("click", () => {
    document.getElementById("formFiltroInicio").value = "";
    document.getElementById("formFiltroFim").value = "";
    renderFormularios(listaFormularios);
  });

  document.getElementById("formAnexarFormulario")
    .addEventListener("submit", enviarFormulario);
});

// Carregar formulários
async function carregarFormularios() {
  try {
    const res = await fetch(API_FORM);
    if (!res.ok) throw new Error("Erro ao buscar formulários");

    listaFormularios = await res.json();
    renderFormularios(listaFormularios);

  } catch (err) {
    console.error(err);
    alert("Não foi possível carregar a lista de formulários.");
  }
}

// Renderizar tabela 
function renderFormularios(lista) {
  const tbody = document.querySelector("#tabelaFormularios tbody");
  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="text-muted text-center">
      Nenhum formulário encontrado
      </td></tr>`;
    return;
  }

  lista.forEach(item => {
    const dataInicial = item.data_inicial
      ? new Date(item.data_inicial + "T00:00:00").toLocaleDateString()
      : "-";

    const dataFinal = item.data_final
      ? new Date(item.data_final + "T00:00:00").toLocaleDateString()
      : "-";

    const upload = item.uploadDate
      ? new Date(item.uploadDate).toLocaleDateString()
      : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dataInicial}</td>
      <td>${dataFinal}</td>
      <td>${item.filename || "-"}</td>
      <td>${upload}</td>

      <td>
        <button class="btn btn-sm btn-outline-primary"
                onclick="visualizarFormulario('${item._id}')">Visualizar</button>

        <button class="btn btn-sm btn-outline-success"
                onclick="baixarFormulario('${item._id}', '${item.filename}')">Baixar</button>

        <button class="btn btn-sm btn-outline-danger"
                onclick="excluirFormulario('${item._id}')">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// Filtros de data
function filtrarFormularios() {
  const ini = document.getElementById("formFiltroInicio").value;
  const fim = document.getElementById("formFiltroFim").value;

  const di = ini ? new Date(`${ini}T00:00:00`) : null;
  const df = fim ? new Date(`${fim}T23:59:59`) : null;

  const filtrado = listaFormularios.filter(f => {
    const d = new Date(f.uploadDate);
    if (di && d < di) return false;
    if (df && d > df) return false;
    return true;
  });

  renderFormularios(filtrado);
}

// Upload
async function enviarFormulario(e) {
  e.preventDefault();

  const inputArquivo = document.getElementById("anexo_arquivo");
  if (!inputArquivo.files.length) {
    alert("Selecione um arquivo antes de enviar.");
    return;
  }

  const fd = new FormData();
  fd.append("data_inicial", document.getElementById("anexo_data_inicial").value);
  fd.append("data_final", document.getElementById("anexo_data_final").value);
  fd.append("arquivo", inputArquivo.files[0]);

  try {
    const res = await fetch(API_FORM, { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok) {
      alert("Erro ao anexar: " + (json.error || "Falha desconhecida."));
      return;
    }

    alert("Formulário anexado com sucesso!");

    // Limpa formulário
    e.target.reset();

    // Fecha modal com segurança
    const modalEl = document.getElementById("modalAnexarFormulario");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Recarrega lista
    carregarFormularios();

  } catch (err) {
    console.error("Erro ao enviar formulário:", err);
    alert("Não foi possível enviar o arquivo.");
  }
}

// Visualizar formulário
function visualizarFormulario(id) {
  window.open(`${API_FORM}/${id}/view`, "_blank");
}

// Download formulário
function baixarFormulario(id, nome) {
  const url = `${API_FORM}/${id}/download`;
  const a = document.createElement("a");
  a.href = url;
  a.download = nome || "arquivo.pdf";
  a.click();
}

// Excluir formulário
async function excluirFormulario(id) {
  if (!confirm("Deseja realmente excluir este formulário?")) return;

  try {
    const res = await fetch(`${API_FORM}/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const err = await res.json();
      alert("Erro ao excluir: " + (err.error || "Falha desconhecida"));
      return;
    }

    alert("Formulário excluído com sucesso!");
    carregarFormularios();

  } catch (error) {
    console.error(error);
    alert("Erro ao excluir formulário.");
  }
}
















