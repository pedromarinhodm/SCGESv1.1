import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer";
import { ObjectId } from "mongodb";


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// multer recebe arquivo em memória (buffer)
const upload = multer({ storage: multer.memoryStorage() });


// =====================================
// 🔗 Conexão com o MongoDB local
// =====================================
const mongoURI = "mongodb://127.0.0.1:27017/controle_estoque"

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Conectado ao MongoDB (controle_estoque)"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err))

//======================================
// Configurar GridFS
//======================================

let gridfsBucket;

mongoose.connection.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "formularios"
  });

  console.log("📁 GridFS inicializado (bucket: formularios)");
});



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
// Middleware global — permite streaming de PDF sem sobrescrever headers
app.use((req, res, next) => {
  // Só altera o header se a rota NÃO for PDF
  if (!req.path.includes("/formularios/")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});


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
  const { descricao, quantidade, unidade, servidor_almoxarifado, data_entrada } = req.body

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

    // Parse data_entrada as local date (yyyy-mm-dd) to avoid timezone issues
    let dataMovimentacao = new Date()
    if (data_entrada) {
      const [ano, mes, dia] = data_entrada.split('-').map(Number)
      dataMovimentacao = new Date(ano, mes - 1, dia, 12, 0, 0) // Set to noon to avoid DST issues
    }

    // Registra movimentação de entrada
    const novaMovimentacao = new Movimentacao({
      tipo: "entrada",
      quantidade,
      servidor_almoxarifado,
      produto_id: produto._id,
      data: dataMovimentacao,
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

// ================== UPLOAD DE FORMULÁRIO ==================
app.post("/api/formularios", upload.single("arquivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const { data_inicial, data_final } = req.body;

    // cria upload stream do GridFS
    const uploadStream = gridfsBucket.openUploadStream(
      Date.now() + "-" + req.file.originalname,
      {
        contentType: req.file.mimetype,
        metadata: {
          data_inicial,
          data_final
        }
      }
    );

    // grava o buffer enviado pelo multer
    uploadStream.end(req.file.buffer);

   uploadStream.on("finish", async () => {
        await mongoose.connection.db.collection("formularios_meta").insertOne({
        fileId: uploadStream.id,           
        filename: uploadStream.filename,   
        data_inicial,
        data_final,
        uploadDate: new Date()
      });

      res.json({
        message: "Formulário salvo com sucesso",
        id: uploadStream.id   
      });

    });

    uploadStream.on("error", (err) => {
      console.error("Erro no GridFS:", err);
      res.status(500).json({ error: "Erro ao salvar PDF no servidor." });
    });

  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// Listar formulários
app.get("/api/formularios", async (req, res) => {
  const docs = await mongoose.connection.db
    .collection("formularios_meta")
    .find({})
    .sort({ uploadDate: -1 })
    .toArray();0
    

  // Normalize fileId to string for easier client usage
  const normalized = docs.map(d => ({
    _id: d._id,
    fileId: d.fileId ? d.fileId.toString() : null,
    filename: d.filename,
    data_inicial: d.data_inicial,
    data_final: d.data_final,
    uploadDate: d.uploadDate
  }));

  res.json(normalized);
});

// Visualizar formulários
app.get("/api/formularios/:id/view", async (req, res) => {
  try {
    const metaId = new mongoose.Types.ObjectId(req.params.id);
    const meta = await mongoose.connection.db.collection("formularios_meta").findOne({ _id: metaId });
    if (!meta) return res.status(404).json({ error: "Arquivo não encontrado" });

    const fileId = meta.fileId instanceof mongoose.Types.ObjectId ? meta.fileId : new mongoose.Types.ObjectId(meta.fileId);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline"
    });

    gridfsBucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    console.error("Erro ao visualizar formulário:", err);
    res.status(500).json({ error: "Erro ao visualizar formulário" });
  }
});

// Download formulário
app.get("/api/formularios/:id/download", async (req, res) => {
  try {
    const metaId = new mongoose.Types.ObjectId(req.params.id);
    const meta = await mongoose.connection.db.collection("formularios_meta").findOne({ _id: metaId });
    if (!meta) return res.status(404).json({ error: "Arquivo não encontrado" });

    const fileId = meta.fileId instanceof mongoose.Types.ObjectId ? meta.fileId : new mongoose.Types.ObjectId(meta.fileId);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    gridfsBucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    console.error("Erro ao fazer download do formulário:", err);
    res.status(500).json({ error: "Erro ao fazer download do formulário" });
  }
});

// DELETE - excluir formulário
app.delete("/api/formularios/:id", async (req, res) => {
  try {
    const metaId = new mongoose.Types.ObjectId(req.params.id);

    const meta = await mongoose.connection.db.collection("formularios_meta").findOne({ _id: metaId });
    if (!meta) return res.status(404).json({ error: "Arquivo não encontrado" });

    const fileId = meta.fileId instanceof mongoose.Types.ObjectId ? meta.fileId : new mongoose.Types.ObjectId(meta.fileId);

    // Exclui do GridFS
    try {
      await gridfsBucket.delete(fileId);
    } catch (gfsErr) {
      if (!gfsErr.message || !gfsErr.message.includes("File not found")) {
        console.error("Erro ao excluir arquivo no GridFS:", gfsErr);
        return res.status(500).json({ error: "Erro ao excluir arquivo no GridFS" });
      }
      // caso seja 'File not found', prossegue para excluir metadados
    }

    // Exclui metadados
    await mongoose.connection.db.collection("formularios_meta").deleteOne({ _id: metaId });

    res.json({ success: true });

  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    res.status(500).json({ error: "Erro ao excluir arquivo" });
  }
});






// =====================================
// 🚀 Servidor
// =====================================
const PORT = 3000
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`))
//=======================================================================================











