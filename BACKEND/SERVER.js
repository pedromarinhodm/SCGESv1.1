import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// =====================================
// 🔗 Conexão com o MongoDB local
// =====================================
const mongoURI = "mongodb://127.0.0.1:27017/controle_estoque"

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectado ao MongoDB (controle_estoque)"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err))

// =====================================
// 🧩 Modelos (Schemas)
// =====================================
const produtoSchema = new mongoose.Schema(
  {
    codigo: { type: Number, unique: true },
    descricao: { type: String, required: true, trim: true },
    quantidade: { type: Number, required: true, default: 0 },
    unidade: { type: String, default: "" },
    descricao_complementar: { type: String, default: "" },
    validade: { type: String, default: "" },
    fornecedor: { type: String, default: "" },
    numero_processo: { type: String, default: "" },
    observacoes: { type: String, default: "" },
  },
  { timestamps: true },
)

const movimentacaoSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["entrada", "saida"], required: true },
    quantidade: { type: Number, required: true },
    servidor_almoxarifado: { type: String, required: true },
    setor_responsavel: { type: String },
    servidor_retirada: { type: String },
    // ✅ Correção: grava data local ajustada para fuso horário
    data: {
      type: Date,
      default: Date.now,
    },
    produto_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true,
    },
  },
  { timestamps: true },
)

const Produto = mongoose.model("Produto", produtoSchema)
const Movimentacao = mongoose.model("Movimentacao", movimentacaoSchema)

// =====================================
// ⚙️ Configurações do servidor
// =====================================
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  next()
})

// =====================================
// 🟢 Rotas de Produtos
// =====================================
app.get("/api/produtos", async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ descricao: 1 })
    res.json(produtos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/produtos", async (req, res) => {
  const { descricao, quantidade, unidade, descricao_complementar, validade, fornecedor, numero_processo, observacoes } =
    req.body

  if (!descricao || quantidade == null) return res.status(400).json({ error: "Campos obrigatórios ausentes." })

  try {
    // 🔢 Gera código sequencial automático
    const ultimo = await Produto.findOne().sort({ codigo: -1 }).select("codigo")
    const proximoCodigo = ultimo && ultimo.codigo ? ultimo.codigo + 1 : 1

    const novoProduto = new Produto({
      codigo: proximoCodigo,
      descricao,
      quantidade,
      unidade,
      descricao_complementar,
      validade,
      fornecedor,
      numero_processo,
      observacoes,
    })

    await novoProduto.save()
    res.json({ success: true, produto: novoProduto })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


app.put("/api/produtos/:id", async (req, res) => {
  const { id } = req.params
  const { descricao, quantidade, unidade, descricao_complementar, validade, fornecedor, numero_processo, observacoes } =
    req.body

  try {
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      id,
      {
        descricao,
        quantidade,
        unidade,
        descricao_complementar,
        validade,
        fornecedor,
        numero_processo,
        observacoes,
      },
      { new: true },
    )
    res.json({ success: true, produto: produtoAtualizado })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete("/api/produtos/:id", async (req, res) => {
  const { id } = req.params
  try {
    const produtoRemovido = await Produto.findByIdAndDelete(id)
    if (!produtoRemovido) return res.status(404).json({ error: "Produto não encontrado." })
    const resultadoMov = await Movimentacao.deleteMany({ produto_id: id })
    res.json({
      success: true,
      message: `Produto '${produtoRemovido.descricao}' excluído com sucesso.`,
      movimentacoesRemovidas: resultadoMov.deletedCount || 0,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================
// 🟠 Rotas de Movimentações
// =====================================
app.get("/api/movimentacoes", async (req, res) => {
  try {
    const movs = await Movimentacao.find()
    .populate("produto_id", "codigo descricao")
    .sort({ data: -1, createdAt: -1 })
    res.json(movs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================
// 🟢 NOVA ROTA: /api/entrada (corrigida)
// =====================================
app.post("/api/entrada", async (req, res) => {
  const { descricao, quantidade, unidade, servidor_almoxarifado } = req.body

  if (!descricao || !quantidade || !servidor_almoxarifado) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." })
  }

  try {
    // Verifica se o produto já existe
    let produto = await Produto.findOne({ descricao: { $regex: `^${descricao}$`, $options: "i" } })

    if (produto) {
    // Se já existe, apenas incrementa a quantidade
    produto.quantidade += quantidade
    await produto.save()
  } else {
    // Se não existe, cria novo produto com código sequencial
    const ultimo = await Produto.findOne().sort({ codigo: -1 }).select("codigo")
    const proximoCodigo = ultimo && ultimo.codigo ? ultimo.codigo + 1 : 1

    produto = new Produto({ codigo: proximoCodigo, descricao, quantidade, unidade })
    await produto.save()
  }


    // Registra movimentação de entrada
    const novaMovimentacao = new Movimentacao({
      tipo: "entrada",
      quantidade,
      servidor_almoxarifado,
      produto_id: produto._id,
    })
    await novaMovimentacao.save()

    res.json({ success: true, message: "Entrada registrada com sucesso!" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/saida", async (req, res) => {
  const { produto_id, quantidade, servidor_almoxarifado, data, setor_responsavel, servidor_retirada } = req.body

  if (!produto_id || !quantidade || !servidor_almoxarifado) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." })
  }

  try {
    const produto = await Produto.findById(produto_id)
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." })
    }

    if (produto.quantidade < quantidade) {
      return res.status(400).json({ error: "Quantidade insuficiente em estoque." })
    }

    produto.quantidade -= quantidade
    await produto.save()

    // Parse data as local date (yyyy-mm-dd) to avoid timezone issues
    let dataMovimentacao = new Date()
    if (data) {
      const [ano, mes, dia] = data.split('-').map(Number)
      dataMovimentacao = new Date(ano, mes - 1, dia, 12, 0, 0) // Set to noon to avoid DST issues
    }

    const novaMovimentacao = new Movimentacao({
      produto_id,
      tipo: "saida",
      quantidade,
      servidor_almoxarifado,
      data: dataMovimentacao,
      setor_responsavel,
      servidor_retirada,
    })
    await novaMovimentacao.save()

    res.json({ success: true, message: "Saída registrada com sucesso!" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================
// 🚀 Servidor
// =====================================
const PORT = 3000
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`))





