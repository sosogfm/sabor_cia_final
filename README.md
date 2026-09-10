# Sabor & Cia

Aplicação web do restaurante Sabor & Cia, construída com Node.js, Express e EJS. O site público exibe informações institucionais, contato e o link para o cardápio do mês. A área administrativa é protegida por sessão com e-mail e senha e permite enviar um PDF por mês do ano.

O objetivo do projeto é fornecer uma interface simples para o restaurante atualizar seu cardápio mensal.

## Funcionalidades

- Página inicial com apresentação do restaurante.
- Páginas de contato e sobre.
- Download público do cardápio mensal em PDF.
- Área administrativa com autenticação por sessão.
- Upload de PDFs por mês e ano.
- Armazenamento dos arquivos enviados no diretório configurado por `UPLOADS_DIR`.

## Requisitos

- Node.js 20 ou superior.
- npm.
- Um arquivo `.env` configurado.

## Configuração

Crie o arquivo `.env` na raiz do projeto com os valores abaixo:

```env
PORT=3000
BASE_PATH=/restaurante
SESSION_SECRET=uma_chave_forte_e_unica
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=sua_senha_forte
UPLOADS_DIR=/srv/fabrica_sabor_cia/uploads
```

O arquivo `.env.sample` pode ser usado como referência.

## Como rodar

Instale as dependências:

```bash
npm install
```

Inicie o servidor em modo desenvolvimento:

```bash
npm run dev
```

Ou execute em modo produção local:

```bash
npm start
```

Depois, acesse:

- Site público: `http://localhost:3000/restaurante`
- Login admin: `http://localhost:3000/restaurante/admin/login`

Se a variável `PORT` estiver diferente, ajuste a URL conforme o valor definido no `.env`.

## Como usar a área administrativa

1. Acesse a tela de login administrativa.
2. Entre com o e-mail e a senha definidos em `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
3. No painel, selecione o ano, o mês e o arquivo PDF do cardápio.
4. Envie o formulário.
5. O arquivo ficará disponível publicamente na rota de cardápio do mês.

Os arquivos enviados são salvos em:

```text
/srv/fabrica_sabor_cia/uploads/<ano>/<mes>.pdf
```

## Rotas principais

- `GET /restaurante` - página inicial.
- `GET /restaurante/contato` - página de contato.
- `GET /restaurante/sobre` - página sobre.
- `GET /restaurante/cardapio` - cardápio do mês atual.
- `GET /restaurante/cardapio/:ano/:mes` - cardápio de um mês específico.
- `GET /restaurante/admin/login` - login da administração.
- `GET /restaurante/admin` - painel administrativo.
- `POST /restaurante/admin/cardapio` - upload do PDF do cardápio.
- `GET /restaurante/admin/logout` - encerra a sessão.

## Estrutura do projeto

```text
index.js
views/
	index.ejs
	sobre.ejs
	contato.ejs
	admin-login.ejs
	admin.ejs
public/
	assets/
		css/
		img/
	manifest.json
	service-worker.js
uploads/
```

## Contribuição

1. Crie uma branch para a sua alteração.
2. Faça as mudanças com foco em um único objetivo por vez.
3. Valide a aplicação antes de abrir o PR.
4. Descreva claramente o que foi alterado e como testar.

Sugestão de fluxo local:

```bash
npm install
npm run dev
```

## Equipe de desenvolvimento

- Projeto desenvolvido para a Fábrica de Software IFC Videira.
- Autor registrado no pacote: Sofia.
- Mantido como uma aplicação web para apoio ao restaurante Sabor & Cia.

Se quiser, esta seção pode ser atualizada com os nomes e papéis reais da equipe.

## Observações

- O site público depende do caminho base definido em `BASE_PATH`.
- O upload aceita apenas arquivos PDF.
- A pasta definida em `UPLOADS_DIR` deve ser persistida no ambiente de deploy.
- Em produção, o deploy usa a secret `UPLOADS_DIR` para definir o volume de uploads.

## Licença

Este projeto não possui licença definida no momento.
