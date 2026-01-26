-- COMENTAR COM --


-- cria uma tabela chamada categorias
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY, -- cada linha é única
    nome VARCHAR(50) NOT NULL
);

-- tabela com os locais (armário, gaveta etc)
CREATE TABLE locais (
    id SERIAL PRIMARY KEY, 
    nome VARCHAR(50) NOT NULL
);

-- tabela de itens
CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    categoria_id INTEGER NOT NULL, -- ligar o item com a categoria
    local_id INTEGER NOT NULL, -- ligar o item com o local

-- chaves estrangeiras
-- RESTRIÇÃO
    CONSTRAINT fk_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id),
        -- categoria_id só pode ter valores que existam em categorias(id)

    CONSTRAINT fk_local
        FOREIGN KEY (local_id)
        REFERENCES locais(id)
);
