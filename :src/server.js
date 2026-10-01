:const express = require('express');const cors = require('cors');
require('dotenv').config();

const categoriasRoutes = require('./routes/categorias');
const produtosRoutes = require('./routes/produtos');
const vendasRoutes = require('./routes/vendas');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    projeto: 'Tuning & Tradicao',
    status: 'online',
    rotas: {
      categorias: '/categorias',
      produtos: '/produtos',
      vendas: '/vendas'
    }
  });
});

app.use('/categorias', categoriasRoutes);
app.use('/produtos', produtosRoutes);
app.use('/vendas', vendasRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota nao encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
