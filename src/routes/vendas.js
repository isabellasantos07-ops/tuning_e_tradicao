const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const [vendas] = await db.query(`
    SELECT v.*, u.nome AS nome_operador
    FROM venda v
    JOIN usuario u ON u.id_usuario = v.id_usuario
    ORDER BY v.data_hora DESC
  `);
  res.json(vendas);
});

router.get('/:id', async (req, res) => {
  const [vendas] = await db.query(`
    SELECT v.*, u.nome AS nome_operador
    FROM venda v
    JOIN usuario u ON u.id_usuario = v.id_usuario
    WHERE v.id_venda = ?
  `, [req.params.id]);
  if (!vendas.length) return res.status(404).json({ erro: 'Venda nao encontrada.' });

  const [itens] = await db.query(`
    SELECT i.*, p.nome AS nome_produto
    FROM item_venda i
    JOIN produto p ON p.id_produto = i.id_produto
    WHERE i.id_venda = ?
  `, [req.params.id]);

  res.json({ ...vendas[0], itens });
});

router.post('/', async (req, res) => {
  const { id_usuario, forma_pagamento, itens } = req.body;

  if (!id_usuario) return res.status(400).json({ erro: 'Informe o operador (id_usuario).' });
  if (!['dinheiro', 'pix', 'debito', 'credito'].includes(forma_pagamento)) {
    return res.status(400).json({ erro: 'Forma de pagamento invalida.' });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'A venda precisa ter pelo menos 1 item.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let valorTotal = 0;
    const itensOk = [];

    for (const item of itens) {
      const idProduto = Number(item.id_produto);
      const quantidade = Number(item.quantidade);
      if (!idProduto || quantidade <= 0) {
        throw { http: 400, mensagem: 'Item invalido.' };
      }

      const [produtos] = await conn.query(
        'SELECT id_produto, nome, preco_venda, quantidade_estoque FROM produto WHERE id_produto = ? FOR UPDATE',
        [idProduto]
      );
      if (!produtos.length) throw { http: 400, mensagem: `Produto ${idProduto} nao existe.` };

      const p = produtos[0];
      if (quantidade > p.quantidade_estoque) {
        throw {
          http: 400,
          mensagem: `Estoque insuficiente de "${p.nome}". Pedido: ${quantidade}. Disponivel: ${p.quantidade_estoque}.`
        };
      }

      valorTotal += Number(p.preco_venda) * quantidade;
      itensOk.push({ id_produto: idProduto, quantidade, valor_unitario: Number(p.preco_venda) });
    }

    const [venda] = await conn.query(
      `INSERT INTO venda (id_usuario, data_hora, valor_total, forma_pagamento, status)
       VALUES (?, NOW(), ?, ?, 'paga')`,
      [id_usuario, valorTotal, forma_pagamento]
    );
    const idVenda = venda.insertId;

    for (const item of itensOk) {
      await conn.query(
        'INSERT INTO item_venda (id_venda, id_produto, quantidade, valor_unitario) VALUES (?, ?, ?, ?)',
        [idVenda, item.id_produto, item.quantidade, item.valor_unitario]
      );
      await conn.query(
        'UPDATE produto SET quantidade_estoque = quantidade_estoque - ? WHERE id_produto = ?',
        [item.quantidade, item.id_produto]
      );
      await conn.query(
        `INSERT INTO movimentacao_estoque
         (id_produto, id_usuario, id_venda, tipo, quantidade, data_hora, motivo)
         VALUES (?, ?, ?, 'saida', ?, NOW(), ?)`,
        [item.id_produto, id_usuario, idVenda, item.quantidade, `Saida da venda ${idVenda}`]
      );
    }

    await conn.commit();
    res.status(201).json({
      mensagem: 'Venda registrada e estoque atualizado.',
      id_venda: idVenda,
      valor_total: Number(valorTotal.toFixed(2))
    });
  } catch (e) {
    await conn.rollback();
    if (e.http) return res.status(e.http).json({ erro: e.mensagem });
    res.status(500).json({ erro: 'Erro ao registrar venda.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
