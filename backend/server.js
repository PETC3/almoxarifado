const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // Biblioteca para conexão com PostgreSQL
const cors = require('cors');
const path = require('path');
var session = require('express-session')
app.use(cors({origin: 'http://127.0.0.1:5500', credentials: true,}));
const port = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(session({ secret: "chave-secreta", resave: false, saveUninitialized: true }));
app.use(express.json());

// Configuração do Pool de Conexões do PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Almoxarifado',
    password: 'admin',
    port: 5432,
});

// Middleware para processar dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));

// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../frontend/index.html');
});

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Consulta ao banco para verificar se o usuário existe
        const result = await pool.query(
            'SELECT id, username FROM usuario WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0]; // Obtém o usuário retornado

            // Armazena o nome e o id do usuário na sessão
            req.session.nome = user.username;
            req.session.id = user.id;  // Adiciona o ID à sessão
            req.session.message = "Login realizado com sucesso!";

            // Redireciona para a página restrita passando o nome e o id na URL
            res.redirect(`http://127.0.0.1:5500/frontend/acesso-restrito/interface.html?nome=${user.username}&id=${user.id}`);
        } else {
            // Caso o login falhe, redireciona para a página de login novamente
            res.redirect('http://127.0.0.1:5500/frontend/index.html');
        }
    } catch (err) {
        console.error('Erro ao consultar o banco de dados:', err);
        res.status(500).send('Erro no servidor.');
    }
});

// Endpoint para buscar os dados da tabela
app.get("/estoque", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM estoque");
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      res.status(500).send("Erro ao buscar dados.");
    }
  });

// Endpoint para adicionar um novo usuário
app.post("/usuarios", async (req, res) => {
  const { username, password, name_user} = req.body;
  try {
      const result = await pool.query(
          "INSERT INTO usuario (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, password, name, type",
          [username, password, name_user]
      );

      const newUser = result.rows[0];
      res.status(201).json(newUser); // Retorna o novo usuário criado
  } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      res.status(500).send("Erro ao adicionar usuário.");
  }
});

// Endpoint para buscar os dados da tabela de usuários
app.get("/usuarios", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM usuario");
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).send("Erro ao buscar usuários.");
    }
  });

// Rota para adicionar um item ao estoque
app.post("/add-item", async (req, res) => {
  const { name, category, quantity, description } = req.body;

  try {
      // Inserir o item na tabela 'estoque'
      const result = await pool.query(
          "INSERT INTO estoque (name, category, amount, description) VALUES ($1, $2, $3, $4) RETURNING *",
          [name, category, quantity, description]
      );
      res.status(201).json({ message: "Item adicionado com sucesso!", item: result.rows[0] });
  } catch (err) {
      console.error("Erro ao adicionar item:", err);
      res.status(500).json({ message: "Erro ao adicionar item ao banco de dados." });
  }
});

// Rota para deletar item
app.delete("/delete-item/:id", async (req, res) => {
  const itemId = parseInt(req.params.id);

  try {
      const result = await pool.query("DELETE FROM estoque WHERE id = $1 RETURNING *", [itemId]);

      if (result.rowCount === 0) {
          return res.status(404).json({ message: "Item não encontrado." });
      }

      res.status(200).json({ message: "Item deletado com sucesso!", item: result.rows[0] });
  } catch (err) {
      console.error("Erro ao deletar item:", err);
      res.status(500).json({ message: "Erro ao deletar item do banco de dados." });
  }
});

// Rota para retirar item
app.put("/retirar-item", async (req, res) => {
  const { nameOrCode, quantity, userId } = req.body;

  try {
      // Verifica se o item existe no estoque
      const itemResult = await pool.query(
          "SELECT id, name, amount FROM estoque WHERE name = $1 OR id::text = $1",
          [nameOrCode]
      );

      if (itemResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: "Item não encontrado." });
      }

      const item = itemResult.rows[0];

      // Verifica se há quantidade suficiente para retirada
      if (item.amount < quantity) {
          return res.status(400).json({ success: false, message: "Quantidade insuficiente no estoque." });
      }

      // Atualiza a quantidade no estoque
      const newQuantity = item.amount - quantity;
      await pool.query(
          "UPDATE estoque SET amount = $1 WHERE id = $2",
          [newQuantity, item.id]
      );

      // Insere o registro na tabela pedidos
      await pool.query(
          "INSERT INTO pedido (qtd_retirada, usuario_id, estoque_id) VALUES ($1, $2, $3)",
          [quantity, userId, item.id]
      );

      res.status(200).json({ success: true, message: "Item retirado com sucesso e registrado no histórico." });
  } catch (err) {
      console.error("Erro ao retirar item:", err);
      res.status(500).json({ success: false, message: "Erro ao retirar item do estoque." });
  }
});

// Rota para buscar os pedidos com dados do usuário e do item
app.get('/pedidos', async (req, res) => {
  try {
      // Consulta para recuperar os pedidos com dados de usuário e item
      const query = `
          SELECT 
              p.id AS pedido_id,
              u.name AS nome_usuario, 
              e.name AS nome_item_estoque, 
              p.qtd_retirada, 
              p.data_pedido
          FROM 
              Pedido p
          JOIN 
              usuario u ON p.usuario_id = u.id
          JOIN 
              estoque e ON p.estoque_id = e.id;
      `;

      const result = await pool.query(query);

      if (result.rows.length > 0) {
          res.json(result.rows);  // Envia os dados como resposta
      } else {
          res.status(404).send('Nenhum pedido encontrado.');
      }
  } catch (err) {
      console.error('Erro ao consultar pedidos:', err);
      res.status(500).send('Erro ao consultar pedidos.');
  }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
