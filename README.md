# Tuning & Tradição

Sistema de frente de caixa e gestão de estoque para uma oficina que une carro clássico e performance.

O cliente chega no balcão, a peça é consultada na hora e, quando a venda fecha, o estoque baixa sozinho. Sem planilha de um lado e caixa do outro.

---

## O que o sistema resolve

- Perda de peça sem rastro
- Atendimento parado porque alguém foi “ver no fundo”
- Inventário manual e número que não bate com a prateleira

Cada venda grava o cupom, os itens e a saída de estoque na mesma transação. Se a quantidade pedida for maior do que o saldo, a venda é barrada.

---

## O que tem no projeto

- Banco relacional (categorias, produtos, usuários, vendas, itens e movimentação de estoque)
- API de estoque com cadastro, consulta, edição e exclusão
- PDV com baixa automática e validação de saldo
- Histórico de commits do grupo no GitHub

---

## Tecnologias

- Node.js
- Express
- MySQL
- GitHub
