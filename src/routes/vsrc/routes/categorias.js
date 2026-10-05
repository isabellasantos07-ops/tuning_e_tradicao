const express = require('express');
const db = require('../db');
const router = express.Router();
function validarCategoria(body) {
  const erros = [];
  const nome = (body.nome || '').trim();
  const descricao = (body.descricao || '').trim();
  if (!nome) erros.push('Nome da categoria nao pode ficar em branco.');
  return { erros, nome, descricao: descricao || null };
}

router.get('/', async (req, res) => {
  const [linhas] = await db.query('SELECT * FROM categoria ORDER BY nome');
  res.json(linhas);
});

router.get('/:id', async (req, res) => {
  const [linhas] = await db.query('SELECT * FROM categoria WHERE id_categoria = ?', [req.params.id]);
  if (!linhas.length) return res.status(404).json({ erro: 'Categoria nao encontrada.' });
  res.json(linhas[0]);
});

router.post('/', async (req, res) => {
  const { erros, nome, descricao } = validarCategoria(req.body);
  if (erros.length) return res.status(400).json({ erros });
  const [r] = await db.query('INSERT INTO categoria (nome, descricao) VALUES (?, ?)', [nome, descricao]);
  res.status(201).json({ mensagem: 'Categoria criada.', id_categoria: r.insertId });
});

router.put('/:id', async (req, res) => {
  const { erros, nome, descricao } = validarCategoria(req.body);
  if (erros.length) return res.status(400).json({ erros });
  const [r] = await db.query('UPDATE categoria SET nome = ?, descricao = ? WHERE id_categoria = ?', [nome, descricao, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'Categoria nao encontrada.' });
  res.json({ mensagem: 'Categoria atualizada.' });
});

router.delete('/:id', async (req, res) => {
  const [produtos] = await db.query('SELECT id_produto FROM produto WHERE id_categoria = ? LIMIT 1', [req.params.id]);
  if (produtos.length) return res.status(400).json({ erro: 'Nao da para excluir: existem produtos nessa categoria.' });
  const [r] = await db.query('DELETE FROM categoria WHERE id_categoria = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'Categoria nao encontrada.' });
  res.json({ mensagem: 'Categoria excluida.' });
});

module.exports = router;
